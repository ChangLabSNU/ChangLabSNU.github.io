=begin
  Responsive images.

    {% picture <preset> <image path> [attribute="value" ...] %}

  Emits an <img> whose srcset lists WebP copies of the image at the widths
  the preset (under `pictures:` in _config.yml) names, with the preset's
  `sizes`, so the browser fetches only about as many pixels as it will draw.
  width/height come from the image itself unless given, so the box is
  reserved before it loads. Any other attribute (alt, class, loading, ...) is
  passed through. Liquid in the tag is rendered first, so this works in a loop:

    {% picture member-thumb images/members/{{ member.photo }} alt="{{ member.name }}" %}

  The copies are made with libvips (the ruby-vips gem), resized, converted to
  sRGB and stripped of metadata (camera EXIF and GPS included), and cached in
  .jekyll-cache/pictures by a digest of the source file, so a rebuild only
  encodes new or changed images. Each is published next to its original as
  <name>-<width>.webp. The original is published too: Open Graph cards and
  the member pages link to it directly.

  Without libvips -- a laptop that only previews the site -- this falls back
  to a plain <img> of the original and warns once. A production build
  (JEKYLL_ENV=production: CI and sync.sh) fails instead, so full-size images
  are never deployed by accident.
=end
require "cgi"
require "digest"
require "fileutils"

module Jekyll
  module Picture
    QUALITY = 80
    ATTRIBUTE = /([\w-]+)="([^"]*)"/

    class << self
      # The Vips module, or nil when libvips cannot be loaded.
      def vips
        return @vips if defined?(@vips)
        @vips = begin
          require "vips"
          Vips
        rescue LoadError => e
          @load_error = e.message
          nil
        end
      end

      attr_reader :load_error
      attr_accessor :warned
    end

    # A generated copy: read from the cache, published at dir/name.
    class GeneratedFile < StaticFile
      def initialize(site, cached, dir, name)
        super(site, site.source, dir, name)
        @cached = cached
      end

      def path
        @cached
      end
    end

    class Tag < Liquid::Tag
      def initialize(tag_name, markup, tokens)
        super
        @markup = markup
      end

      def render(context)
        site = context.registers[:site]
        preset_name, source, rest = Liquid::Template.parse(@markup).render(context).strip.split(/\s+/, 3)
        preset = site.config.dig("pictures", preset_name)
        raise ArgumentError, "picture: no preset #{preset_name.inspect} under `pictures:` in _config.yml" unless preset

        relative = source.to_s.sub(%r{\A/}, "")
        file = site.in_source_dir(relative)
        raise ArgumentError, "picture: no such file #{relative}" unless File.file?(file)

        attributes = rest.to_s.scan(ATTRIBUTE).to_h
        baseurl = site.config["baseurl"].to_s
        vips = Picture.vips
        unless vips
          if Jekyll.env == "production"
            raise Errors::FatalException, "picture: a production build needs libvips (#{Picture.load_error})"
          end
          unless Picture.warned
            Jekyll.logger.warn "Picture:", "libvips not found; serving original images unresized"
            Picture.warned = true
          end
          return tag({ "src" => "#{baseurl}/#{relative}" }.merge(attributes))
        end

        width, height = dimensions(vips, file)
        digest = Digest::SHA256.file(file).hexdigest[0, 20]
        cache = site.in_source_dir(site.config["cache_dir"] || ".jekyll-cache", "pictures")
        dir = File.dirname("/#{relative}")
        stem = File.basename(relative, ".*")

        widths = Array(preset["widths"]).map { |w| [Integer(w), width].min }.uniq.sort
        candidates = widths.map do |w|
          cached = File.join(cache, "#{digest}-#{w}-q#{QUALITY}.webp")
          encode(vips, file, w, cached) unless File.file?(cached)
          name = "#{stem}-#{w}.webp"
          publish(site, cached, dir, name)
          ["#{baseurl}#{dir}/#{name}", w]
        end

        largest = candidates.last
        generated = {
          "src" => largest[0],
          "srcset" => candidates.map { |url, w| "#{url} #{w}w" }.join(", "),
          "sizes" => preset["sizes"],
        }
        unless attributes.key?("width") || attributes.key?("height")
          generated["width"] = largest[1].to_s
          generated["height"] = (height * largest[1].to_f / width).round.to_s
        end
        tag(generated.merge(attributes))
      end

      private

      # Pixel size as displayed: EXIF orientations 5-8 turn the image on its
      # side, and libvips rotates the copies to match.
      def dimensions(vips, file)
        image = vips::Image.new_from_file(file)
        turned = image.get_typeof("orientation").positive? && image.get("orientation").between?(5, 8)
        turned ? [image.height, image.width] : [image.width, image.height]
      end

      def encode(vips, file, width, cached)
        FileUtils.mkdir_p(File.dirname(cached))
        image = vips::Image.thumbnail(file, width, height: 10_000_000, size: :down, export_profile: "srgb")
        temporary = "#{cached}.#{Process.pid}.tmp"
        File.binwrite(temporary, image.webpsave_buffer(Q: QUALITY, keep: :none))
        File.rename(temporary, cached)
      end

      def publish(site, cached, dir, name)
        return if site.static_files.any? { |f| f.is_a?(GeneratedFile) && f.url == "#{dir}/#{name}" }
        site.static_files << GeneratedFile.new(site, cached, dir, name)
      end

      def tag(attributes)
        "<img " + attributes.map { |k, v| %(#{k}="#{CGI.escapeHTML(v.to_s)}") }.join(" ") + ">"
      end
    end
  end
end

Liquid::Template.register_tag("picture", Jekyll::Picture::Tag)
