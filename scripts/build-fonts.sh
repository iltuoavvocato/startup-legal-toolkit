#!/usr/bin/env sh
# Dev-time helper: subsets the variable TTFs in assets-src/ to Latin and converts them to WOFF2.
# Inter is pinned to opsz=14 and wght 400–700 to keep it small; Playfair keeps its full wght axis.
# Requires Python with fonttools + brotli (e.g. `python3 -m venv .venv && .venv/bin/pip install fonttools brotli`).
# Output is committed in src/assets/fonts/, so this does not run during `npm run build`.
set -e
PY=${PYTHON:-python3}
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212"
OUT=src/assets/fonts
TMP=$(mktemp -d)
mkdir -p "$OUT"
"$PY" -m fontTools.varLib.instancer assets-src/Inter.ttf opsz=14 wght=400:700 -o "$TMP/Inter.ttf" -q
cp assets-src/Playfair.ttf assets-src/PlayfairItalic.ttf "$TMP/"
for f in Inter Playfair PlayfairItalic; do
  "$PY" -m fontTools.subset "$TMP/$f.ttf" --unicodes="$UNICODES" --layout-features='*' \
    --flavor=woff2 --output-file="$OUT/$f.woff2"
done
rm -rf "$TMP"
ls -la "$OUT"
