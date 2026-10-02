#!/bin/sh -e
# Refresh the backup mirror (https://qbio.snu.ac.kr, served by this server's
# nginx from $DEST) with what GitHub Pages serves: the current origin/main,
# built the same way as .github/workflows/jekyll.yml builds it. The build runs
# on an export of that commit, not on this working tree, so local edits or
# another checked-out branch never reach the mirror. Cron runs it hourly.
#
#   ./sync.sh       fetch, build, publish, and list what changed
#   ./sync.sh -n    the same, but only show what would change
#   ./sync.sh -q    print nothing unless the mirror changed or a step failed
#                   (for cron, which mails whatever is printed)
DEST=/home/www/qbio.io/

# Served from the same docroot but not part of this repo. rsync --delete would
# otherwise remove them; add any new hand-placed directory here.
KEEP="/inst/ /ribogami-en/ /ribogami-ko/"

DRYRUN=
QUIET=
for arg in "$@"; do
    case "$arg" in
        -n) DRYRUN=--dry-run ;;
        -q) QUIET=--quiet ;;
        *) echo "usage: $0 [-n] [-q]" >&2; exit 2 ;;
    esac
done

PATH="$HOME/bin:$PATH"  # cdrun lives there; cron's PATH does not have it
cd "$(dirname "$0")"

# Cron and a manual run must not overlap.
exec 9>"$(git rev-parse --git-dir)/sync.lock"
flock -n 9 || { echo "sync.sh: another run is in progress" >&2; exit 1; }

git fetch -q origin main
COMMIT=$(git log -1 --format='%h %s' origin/main)

SRC=$(mktemp -d)
OUT=$(mktemp -d)
trap 'rm -rf "$SRC" "$OUT"' EXIT
chmod 755 "$OUT"  # rsync -p copies this mode onto $DEST itself
git archive origin/main | tar -x -C "$SRC"
[ -n "$QUIET" ] || echo "Building $COMMIT"
cdrun qbiowww "cd '$SRC' && JEKYLL_ENV=production bundle exec jekyll build $QUIET -d '$OUT'"

set --
for p in $KEEP; do set -- "$@" --filter="protect $p"; done
# -c compares contents, so files a rebuild merely re-dated are left alone and
# only real changes are copied and listed. -t is left out for the same reason.
CHANGES=$(rsync -rlpc --delete --itemize-changes $DRYRUN "$@" "$OUT/" "$DEST")

if [ -n "$CHANGES" ]; then
    echo "qbio.snu.ac.kr mirror ${DRYRUN:+would be }updated to $COMMIT:"
    echo "$CHANGES"
elif [ -z "$QUIET" ]; then
    echo "qbio.snu.ac.kr mirror is already at $COMMIT"
fi
