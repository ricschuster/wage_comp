# Contributing

Feedback, bug reports, and ideas are welcome through GitHub issues.

Corrections to tax parameters are especially welcome. Please include a source
link so the value can be cited in the repository.

The workflow is:

1. Branch from `main` (one short-lived branch per change).
2. Keep changes small and focused. Slice vertically: a jurisdiction's
   parameters, its engine module, and its tests belong in the same pull request.
3. Run the project checks locally before pushing:
   - `npm run format:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test` (or `npm run test:coverage`)
   - `npm run build`
4. Open a pull request into `main`. CI must pass before merge.

## Setup

- Node version is pinned in `.nvmrc`.
- `npm ci` to install, `npm run dev` to run locally.

## The annual refresh

For the yearly parameter update, follow `docs/ANNUAL_UPDATE.md`. It lists when
each source publishes, the two tooling traps that will otherwise cost you an
hour, the verification steps, and the changes already known to be coming.

## Adding or changing a tax parameter

1. Parameters live in `src/data/`, keyed by tax year. Never inline a tax value
   in engine code.
2. Every value carries its source URL and the date it was retrieved.
3. Add or update a golden test pinning engine output to an official calculator,
   and record the exact calculator settings used in the test.
4. If a value cannot be verified against an authoritative source, document the
   gap rather than shipping a plausible guess.

### Fetching from canada.ca

CRA pages sit behind Akamai bot protection that rejects `curl` and `wget` on
their TLS handshake, so scripted fetches fail with an HTTP/2 stream error or a
timeout rather than a clean refusal. A normal browser works fine.

If you need to script it (for the annual parameter refresh, for example), a
client that replays a real browser TLS fingerprint gets through. For example,
with `curl_cffi` installed:

```python
from curl_cffi import requests

response = requests.get(url, impersonate='chrome', timeout=60)
```

Note also that `www.canada.ca` resolves to IPv6 first, so on a host without
working IPv6 the connection will hang before bot protection is even reached.

Austrian sources (`sozialversicherung.gv.at`, `bmf.gv.at`) and the Justice Laws
site (`laws-lois.justice.gc.ca`) have no such restriction.

## Conventions

- Conventional Commits (for example `feat: ...`, `fix: ...`, `chore: ...`,
  `docs: ...`).
- No em dashes in code, comments, docs, commit messages, or user-facing text.
- See `CLAUDE.md` for the full working rules and `docs/` for design notes and
  decision records.
