=begin
  Jekyll filter producing a Subresource Integrity hash for a site-local asset.
  Usage:
    <script src="/js/jquery.min.js" integrity="{{ '/js/jquery.min.js' | sri }}"></script>
  The digest is taken from the file on disk at build time, so it can never drift
  out of sync with the asset the way a hand-written hash would.
=end
require "base64"
require "digest"

module Jekyll
  module SriFilter
    def sri(path)
      source = @context.registers[:site].source
      file = File.join(source, path.sub(%r{\A/}, ""))
      unless File.file?(file)
        raise "sri filter: no such file: #{file} (referenced as #{path})"
      end
      "sha384-" + Base64.strict_encode64(Digest::SHA384.digest(File.binread(file)))
    end
  end
end

Liquid::Template.register_filter(Jekyll::SriFilter)
