#!/bin/sh
cdrun qbiowww bundle exec jekyll clean
cdrun qbiowww bundle exec jekyll build
rsync -av --delete _site/ /home/www/qbio.io/
