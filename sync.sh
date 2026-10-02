#!/bin/sh -e
# Refresh the backup mirror of qbio.io on the lab server. The live site is
# GitHub Pages, built by .github/workflows/jekyll.yml from main; this builds
# the same commit the same way, so the mirror never carries unpublished work.
DEST=/home/www/qbio.io/

git fetch -q origin main
if [ -n "$(git status --porcelain)" ] || \
   [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "sync.sh: this checkout is not a clean copy of origin/main; not publishing it" >&2
    exit 1
fi

# Build into a scratch directory so a failed build leaves the mirror untouched.
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
chmod 755 "$OUT"  # rsync -a copies this mode onto $DEST itself
JEKYLL_ENV=production bundle exec jekyll build -d "$OUT"
rsync -av --delete "$OUT/" "$DEST"
