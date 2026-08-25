#!/usr/bin/env bash
#
# Regenerates docs/images/app-screenshot.png from a production build.
#
#   tools/screenshot.sh
#
# Builds the app, serves dist on a scratch port with a plain static server,
# drives a headless browser at it, and cleans up. One command, so it needs no
# shell pipeline at the call site.
#
# Requires a Chromium that Playwright can drive. If none is cached, install one
# with: npx playwright install chromium

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
port="${SCREENSHOT_PORT:-4190}"
out="${root}/docs/images/app-screenshot.png"

chrome="$(find "${HOME}/.cache/ms-playwright" -maxdepth 3 -type f -name chrome -path '*chrome-linux*' 2>/dev/null | sort | tail -1 || true)"
if [ -z "${chrome}" ]; then
  echo "No Playwright Chromium found. Run: npx playwright install chromium" >&2
  exit 1
fi

if [ ! -d "${root}/tools/node_modules/playwright-core" ]; then
  echo "Installing playwright-core into tools/node_modules (first run only)..." >&2
  npm install --silent --prefix "${root}/tools" --no-save playwright-core >&2
fi

echo "Building..." >&2
npm run --silent build --prefix "${root}" >&2

# Serve under /wage_comp/ so the built base path resolves, as it does on Pages.
serve_dir="$(mktemp -d)"
ln -s "${root}/dist" "${serve_dir}/wage_comp"

python3 -m http.server "${port}" --directory "${serve_dir}" >/dev/null 2>&1 &
server_pid=$!

cleanup() {
  kill "${server_pid}" 2>/dev/null || true
  rm -rf "${serve_dir}"
}
trap cleanup EXIT

sleep 2

NODE_PATH="${root}/tools/node_modules" node "${root}/tools/screenshot.mjs" \
  "http://localhost:${port}/wage_comp/" "${out}" "${chrome}"
