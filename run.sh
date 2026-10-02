#!/bin/sh -e
# Local preview at http://localhost:4000. Uses the qbiowww conda env
# (environment.yml) where cdrun is available, plain Bundler elsewhere.
if command -v cdrun >/dev/null 2>&1; then
    exec cdrun qbiowww bundle exec jekyll serve --watch "$@"
fi
exec bundle exec jekyll serve --watch "$@"
