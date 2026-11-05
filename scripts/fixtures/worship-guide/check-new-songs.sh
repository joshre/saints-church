#!/usr/bin/env bash
# runs `new` and `print` on new-songs.plan.json in a throwaway copy of the site and diffs against expected/
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
HERE="$ROOT/scripts/fixtures/worship-guide"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

cp -R "$ROOT/scripts" "$ROOT/_data" "$ROOT/_worship_guides" "$ROOT/_config.yml" "$TMP/"
ln -s "$ROOT/node_modules" "$TMP/node_modules"
cd "$TMP"

status=0
npx --no-install tsx scripts/worship-guide.ts new "$HERE/new-songs.plan.json" >new.out || status=$?
fail=0
[ "$status" -eq 2 ] || { echo "new exited $status, expected 2"; fail=1; }
diff -u "$HERE/expected/new.out" new.out || fail=1
diff -u "$HERE/expected/2099-01-04.md" _worship_guides/2099-01-04.md || fail=1
diff -u "$HERE/expected/a-new-test-song.yml" _data/songs/a-new-test-song.yml || fail=1
diff -u "$HERE/expected/how-great-thou-art-1000002.yml" _data/songs/how-great-thou-art-1000002.yml || fail=1
[ ! -e _data/songs/labels-only.yml ] || { echo "labels-only.yml was written"; fail=1; }

if npx --no-install tsx scripts/worship-guide.ts print 2099-01-04 >/dev/null 2>print.err; then
  echo "print succeeded with a song missing"
  fail=1
fi
grep -q 'no lyrics on file for: labels-only' print.err || { echo "print did not name the missing song"; cat print.err; fail=1; }

[ "$fail" -eq 0 ] && echo "worship-guide new-songs check: ok"
exit "$fail"
