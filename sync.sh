#!/bin/sh -e
# Refresh the backup mirror (https://qbio.snu.ac.kr, served by this server's
# nginx from $DEST). The live site is GitHub Pages, built by
# .github/workflows/jekyll.yml from main; this builds the same commit the same
# way, so the mirror never carries unpublished work.
#
#   ./sync.sh       build and publish
#   ./sync.sh -n    build, then only show what rsync would change
DEST=/home/www/qbio.io/

# Served from the same docroot but not part of this repo. rsync --delete would
# otherwise remove them; add any new hand-placed directory here.
KEEP="/inst/ /ribogami-en/ /ribogami-ko/"

DRYRUN=
[ "$1" = "-n" ] && DRYRUN=--dry-run

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
cdrun qbiowww "JEKYLL_ENV=production bundle exec jekyll build -d '$OUT'"

set --
for p in $KEEP; do set -- "$@" --filter="protect $p"; done
rsync -av --delete $DRYRUN "$@" "$OUT/" "$DEST"
