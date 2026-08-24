# wage_comp

Interactive tool comparing **after-tax purchasing power** between Canada and
Austria across a configurable gross income range.

> Status: early build. The harness is in place; the tax engine is being built
> one jurisdiction slice per pull request. Open issues are the live roadmap.

## What it does

Gross salary is an input, not an answer. The tool reports:

- Net take-home pay, both countries
- PPP-adjusted take-home pay, both countries
- Effective deduction rate, both countries
- The Austria divided by Canada purchasing-power ratio

Above 1.0 the Austrian position is ahead, below 1.0 the Canadian position is
ahead.

It also inverts the question: given a Canadian package, what Austrian gross
would match it in purchasing-power terms? That is usually the more useful
question, because nobody is offered the same gross in both countries.

## Design commitments

- **Every tax parameter carries a citation.** Source URL and retrieval date. A
  value that cannot be sourced is recorded as a documented gap, not shipped as
  a plausible guess.
- **Correctness is tested, not asserted.** Engine output is pinned by golden
  tests to results from official calculators, alongside unit tests for the
  structural rules.
- **The model is auditable.** Every output line expands to show the formula, its
  inputs, the parameter values used, and where each came from.
- **No backend.** A static site, so nothing to keep alive and nothing to pay
  for. The exchange rate is a user input with a sourced, date-stamped default
  rather than a live fetch.

## Scope

Single taxpayer, no dependants, employment income only, no voluntary deductions.
Tax year 2026. British Columbia at first, with other provinces added as
parameter files. Quebec is a separate module (QPP, QPIP, federal abatement) and
is not yet supported.

This is not tax advice and not a filing tool. Read
`docs/design/00_project_brief.md` for what is modelled and what is not.

## Development

Node version is pinned in `.nvmrc`.

```sh
npm ci        # install
npm run dev   # local dev server
npm test      # unit and golden tests
npm run build # production build
```

Full check suite, matching CI:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

## Repository layout

- `src/engine/` pure, testable tax logic. No React imports.
- `src/data/` tax parameter tables keyed by year, with provenance on every value.
- `src/ui/` React components.
- `docs/design/` design notes, `docs/decisions/` ADRs, `docs/handoffs/` session
  handoffs.

## Contributing

See `CONTRIBUTING.md`. Corrections to tax parameters are especially welcome, and
are most useful with a source link.

## License

GNU General Public License v3.0 or later. See `LICENSE`.
