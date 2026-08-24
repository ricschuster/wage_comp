#!/usr/bin/env bash
#
# Fetch an authoritative tax source page for the annual parameter refresh.
#
#   tools/source.sh <url> <name>
#
# Writes tools/cache/<name>.html and tools/cache/<name>.txt, both gitignored.
#
# Installs curl_cffi into tools/pylibs on first run. That dependency exists
# because canada.ca rejects curl and wget on their TLS fingerprint; see
# CONTRIBUTING.md for the full story.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pylibs="${here}/pylibs"

if [ "$#" -ne 2 ]; then
  echo "usage: tools/source.sh <url> <name>" >&2
  exit 2
fi

if [ ! -d "${pylibs}/curl_cffi" ]; then
  echo "Installing curl_cffi into tools/pylibs (first run only)..." >&2
  pip3 install --quiet --target "${pylibs}" curl_cffi >&2
fi

PYTHONPATH="${pylibs}" exec python3 "${here}/fetch_source.py" "$@"
