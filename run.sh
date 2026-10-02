#!/bin/sh -e
# Local preview at http://localhost:4000
exec bundle exec jekyll serve --watch "$@"
