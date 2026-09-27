#!/usr/bin/env bash
# Builds dist/ and zips its contents into curratio-<version>.zip for the Chrome Web Store.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
VERSION="$(node -p "require('$ROOT/package.json').version")"
OUT="$ROOT/curratio-${VERSION}.zip"

cd "$ROOT"

echo "Building extension..."
npm run build

if [[ ! -f "$DIST/manifest.json" ]]; then
  echo "error: $DIST/manifest.json not found" >&2
  exit 1
fi

rm -f "$OUT"

echo "Packaging $OUT..."
(
  cd "$DIST"
  zip -qr "$OUT" . -x '.*' -x '__MACOSX/*' -x '*/.*'
)

echo "Verifying zip layout..."
if ! unzip -l "$OUT" | awk '{print $4}' | grep -qx 'manifest.json'; then
  echo "error: manifest.json is not at the zip root" >&2
  exit 1
fi

echo "Done: $OUT"
unzip -l "$OUT" | head -20
