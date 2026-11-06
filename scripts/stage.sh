#!/bin/sh
# Copies the files that make up the live site into a folder (default dist/) for Cloudflare Pages.
# Only tracked files are taken; notes, build scripts and config stay out.
set -e
OUT=${1:-dist}
LIST=$(mktemp)
rm -rf "$OUT"; mkdir -p "$OUT"
git ls-files -z | grep -zvE '^(\.nojekyll|\.gitignore|AGENTS\.md|CLAUDE\.md|README\.md|site\.config\.json|docs/|scripts/|\.github/|\.claude/)' > "$LIST"
# One tar reads the whole list (xargs would split it into several archives and only the first gets unpacked).
tar --null -T "$LIST" -cf - | tar xf - -C "$OUT"
want=$(tr -cd '\0' < "$LIST" | wc -c | tr -d ' '); got=$(find "$OUT" -type f | wc -l | tr -d ' ')
rm -f "$LIST"
for f in index.html 404.html _headers assets/site.css assets/topics.js; do [ -f "$OUT/$f" ] || { echo "missing $f"; exit 1; }; done
[ "$want" = "$got" ] || { echo "staged $got of $want files"; exit 1; }
echo "staged $got files in $OUT"
