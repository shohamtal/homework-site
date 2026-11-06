#!/bin/sh
# Copies the files that make up the live site into a folder (default dist/) for Cloudflare Pages.
# Only tracked files are taken; notes, build scripts and config stay out.
set -e
OUT=${1:-dist}
rm -rf "$OUT"; mkdir -p "$OUT"
git ls-files -z | grep -zvE '^(\.nojekyll|\.gitignore|AGENTS\.md|CLAUDE\.md|README\.md|site\.config\.json|docs/|scripts/|\.github/|\.claude/)' | xargs -0 tar cf - | tar xf - -C "$OUT"
echo "staged $(find "$OUT" -type f | wc -l | tr -d ' ') files in $OUT"
