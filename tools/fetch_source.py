"""Fetch an authoritative source page and save it as HTML and readable text.

Why this exists: canada.ca sits behind Akamai bot protection that rejects curl
and wget on their TLS handshake, so ordinary scripted fetches fail with an
HTTP/2 stream error or a timeout rather than a clean refusal. curl_cffi replays
a real Chrome fingerprint and gets through. See CONTRIBUTING.md.

Usage: fetch_source.py <url> <name>

Writes <name>.html and <name>.txt into tools/cache/, which is gitignored. The
text file keeps table rows on one line each, so bracket tables stay readable.
"""

import html
import re
import sys
from pathlib import Path

from curl_cffi import requests

CACHE = Path(__file__).resolve().parent / 'cache'


def to_text(source: str) -> str:
    """Strip HTML to readable text, keeping table rows on one line each."""
    source = re.sub(r'(?is)<(script|style|noscript|svg)\b.*?</\1>', ' ', source)
    source = re.sub(r'(?i)</t[dh]>', '\t', source)
    source = re.sub(r'(?i)</tr>', '\n', source)
    source = re.sub(r'(?i)<(br|/p|/h[1-6]|/li|/div)\b[^>]*>', '\n', source)

    text = html.unescape(re.sub(r'(?s)<[^>]+>', ' ', source))

    lines = []
    for line in text.splitlines():
        cleaned = re.sub(r'[ \xa0]{2,}', ' ', line).strip()
        if cleaned:
            lines.append(cleaned)
    return '\n'.join(lines)


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        return 2

    url, name = sys.argv[1], sys.argv[2]
    if not re.fullmatch(r'[A-Za-z0-9._-]+', name):
        print(f'name must be a simple filename, got {name!r}', file=sys.stderr)
        return 2

    CACHE.mkdir(parents=True, exist_ok=True)

    response = requests.get(
        url,
        impersonate='chrome',
        timeout=60,
        headers={'Accept-Language': 'en-CA,en;q=0.9'},
    )
    print(f'status={response.status_code} bytes={len(response.content)}')
    response.raise_for_status()

    html_path = CACHE / f'{name}.html'
    text_path = CACHE / f'{name}.txt'
    html_path.write_bytes(response.content)
    text_path.write_text(to_text(response.text), encoding='utf-8')

    print(f'wrote {html_path}')
    print(f'wrote {text_path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
