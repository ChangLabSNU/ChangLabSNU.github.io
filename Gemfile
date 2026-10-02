source 'https://rubygems.org'

gem "jekyll", "~> 4.3"
gem "kramdown-parser-gfm"
# libvips binding for _plugins/picture.rb, which loads it itself and copes when
# libvips is missing -- hence not auto-required.
gem "ruby-vips", "~> 2.2", require: false

group :jekyll_plugins do
  gem "jekyll-sitemap"
end

group :test do
  gem "html-proofer", "~> 5.0"
end
