# CLAUDE.md

Working rules and durable context for this project. This file is loaded into
context automatically, so keep it to direction and rules, not a task list.

## Project name

wage_comp

## Project purpose

wage_comp is an interactive web app that compares **after-tax purchasing power**
between Canada and Austria across a configurable gross income range.

The goal is not nominal salary comparison. The headline outputs are net
take-home pay, PPP-adjusted take-home pay, effective deduction rates, and the
Austria divided by Canada purchasing-power ratio.

It replaces an earlier Excel workbook. There is no workbook to maintain in
parallel; the app is the model.

See `docs/design/00_project_brief.md` for the full brief.

## Project status

MVP shipped and live at https://ricschuster.github.io/wage_comp/.

M0 through M5 are done: the harness, the engine for both countries with sourced
and tested parameters, the comparison layer, the equivalence solver, the
dashboard, three charts, the audit view, the methodology page, and the
assumptions and sharing panel. Open GitHub issues are the live
roadmap.

## Scope

A client-side, single-taxpayer comparison tool on sourced 2026 tax parameters.

It is deliberately NOT: tax advice, a filing tool, a backend service, a payroll
system, or a household or family tax model. Do not expand scope without a design
note in `docs/design/` or an ADR in `docs/decisions/`.

Modelled baseline, both countries: single taxpayer, no dependents, employment
income only, no voluntary deductions (no RRSP, no union dues, no medical
credits, no commuter allowance, no family benefits). Changing that baseline is a
scope decision, not an implementation detail.

## The three correctness rules

These come from the failure modes of the workbook this replaces. Each is
enforced by a test, not by convention.

1. **Austrian special payments are a split, not an addition.** Annual Austrian
   gross is split 6/7 regular and 1/7 special. Never add a 13th and 14th salary
   on top of annual compensation. Never double count.
2. **Austrian social insurance is two regimes, not one rate.** Regular salary and
   special payments have separate rates and separate ceilings. Do not collapse
   them.
3. **Every tax parameter carries a citation.** A number without a source and a
   retrieval date does not ship. If it cannot be sourced, it becomes a
   documented gap, not a guess.

## Stack

- TypeScript (strict), React, Vite.
- Vitest for unit tests.
- Hand-rolled SVG for charts. No charting library: three line charts do not
  justify the dependency.
- Pure, framework-free TypeScript for the tax engine so it is unit-testable
  independent of React.
- GitHub Pages for static deployment. No backend, so no live FX fetch: the FX
  rate is a user input with a sourced, date-stamped default.

The tax computation must stay out of React components, in pure modules under
`src/engine/`.

## Repo structure

Explore the tree rather than trusting this; it drifts.

- `src/engine/` pure, testable tax logic (Canada federal, Canada payroll,
  provincial, Austria regular, Austria special payment, comparison, solver,
  calculation trace). No React imports.
- `src/data/` tax parameter tables keyed by year, PPP and FX reference values.
  Every value carries `{ value, source, retrieved }`.
- `src/ui/` React components: dashboard, inputs, table, charts, audit view.
- Co-located `*.test.ts` Vitest suites.

Already in place:

- `docs/design/` design notes, `docs/decisions/` ADRs, `docs/handoffs/` session
  handoffs.
- `.github/` issue and PR templates, workflows, Dependabot.
- `.claude/` Claude Code settings and any repo-local skills.

## Parameter and sourcing rules

1. Parameters live in `src/data/`, keyed by tax year, never inline in engine
   code. An annual update is a new parameter file plus a test run.
2. Every value carries its source URL and the date it was retrieved.
3. Golden tests pin engine output to results from an official calculator (CRA
   Payroll Deductions Online Calculator for Canada, a recognised
   brutto-netto calculator for Austria) at fixed incomes. Record the exact
   calculator settings used, because those calculators embed defaults of their
   own.
4. When a parameter cannot be verified, document the gap in the methodology
   rather than shipping a plausible guess.
5. Check one full result by hand after any parameter change. Every test can
   pass and the answer still be wrong, because the tests and the code can share
   an assumption. That is how the Quebec contribution-credit bug survived.
6. The yearly refresh follows `docs/ANNUAL_UPDATE.md`. Adding a year should be
   a data change only; if it needs an engine change, the abstraction leaked.

## Style rules

1. Do not use em dashes in docs, comments, commit messages, or user-facing text.
2. Keep writing concise and direct.
3. Use bullets and numbered lists where helpful.
4. Prefer plain language over jargon.
5. Label assumptions clearly.

## Git and commit expectations

Use Git from day one.

- Use concise Conventional Commit style (`feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`).
- Keep commits small and meaningful.
- PR flow: work one feature or slice per branch and PR. Slice vertically: a
  jurisdiction's parameters, engine module, and tests land together, because a
  parameter table with no test attached proves nothing. Reference the issue in
  the PR body with `Closes #N` so the merge auto-closes it. Verify before
  opening the PR.
- Auto-merge is the default: open the PR, then enable auto-merge
  (`gh pr merge <n> --squash --auto --delete-branch`) so it lands on its own once
  CI passes. No need to wait for a human approval step unless the owner asks.

## Issue workflow

GitHub issues are the durable, cross-session tracker. Split work by lifecycle:
anything that gets opened and later closed (features, bugs, tech debt) belongs in
an issue; the narrative of a session belongs in a handoff.

1. Open an issue when starting a feature or a slice of work. Reference it in the
   PR with `Closes #N`. Open issues are the live roadmap: open = todo,
   closed = shipped.
2. Do not retroactively open and close issues for already-shipped work.
3. Labels, kept minimal: `bug`, `enhancement`, `documentation`, `question`,
   `tech-debt`, `design-call` (needs an owner decision first).

## Where durable context lives

The owner works across more than one machine, so any Claude-local personal memory
is NOT shared and MUST NOT be the home for durable project context. The repository
is the single source of truth, because it travels through git to every machine:

1. Trackable, open-then-closed work -> GitHub issues.
2. Owner direction and working preferences -> this file (CLAUDE.md).
3. Design threads and decisions -> `docs/design/` and `docs/decisions/` (ADRs).
4. Session narrative -> `docs/handoffs/`.

If a fact is worth remembering, write it to one of the four homes above.

## Session handoff format

When creating a handoff, write `docs/handoffs/<YYYY-MM-DD>_Handoff_vNN.md` with:

```markdown
# Session Handoff: YYYY-MM-DD

## Summary

Brief summary of what changed.

## Completed

- Item

## Current state

- What works
- What is incomplete
- Known issues

## Next actions

1. Next action

## Risks or decisions needed

- Risk or decision
```

## Documentation expectations

- `README.md`: what the project is, how to install, run, and test.
- `docs/design/`: design notes.
- `docs/decisions/`: ADRs for significant technical or design choices.
- `docs/handoffs/`: session handoffs when useful.

The methodology page in the app is user-facing documentation and is part of the
deliverable, not an afterthought. It must state what is modelled, what is
omitted, how PPP is applied, and how the ratio is computed.

## Dependency rules

1. Explain why a dependency is needed before adding it.
2. Prefer built-in language and framework capabilities first.
3. Add a short ADR in `docs/decisions/` for major dependencies or stack choices.

## Command style

Run shell commands as single, atomic invocations so they match the allowlist in
`.claude/settings.json` and do not trigger extra permission prompts.

1. Avoid compound commands. Command substitution `$(...)`, heredocs, pipes,
   `for`/`while`/`if` cannot be statically matched, so they always prompt even
   when the inner command is allowlisted.
2. Pass long text through a file, never `$(printf ...)` or a heredoc. Write the
   text with the file tools first, then `git commit -F <file>`,
   `gh pr create --body-file <file>`, and `gh issue create --body-file <file>`.
3. To wait for CI, use `gh pr checks <n> --watch` (one blocking command), not a
   hand-rolled polling loop.
4. Prefer many small allowlisted commands over one bundled script.

## UI verification

Look at any UI change before opening the PR. A green test suite says nothing
about whether the screen reads correctly: on 2026-08-26 three layout faults
shipped with 468 tests passing, and the worst of them rendered every tooltip in
uppercase, which made the explanations harder to read than no explanations.

This is the same rule as hand-checking a result after a parameter change. Tests
and code share assumptions, and neither can see a stylesheet.

1. `tools/screenshot.sh` regenerates the README image from a production build.
   Run it when the dashboard's appearance changes.
2. To check a specific view or an open control, point `tools/screenshot.mjs` at a
   running dev server instead. It takes a URL, an output path and a Chromium
   path. Install one with `npx playwright install chromium` if none is cached.
3. No browser extension and no account permission is involved, so this works on
   every machine and in CI. Do not reach for browser automation tooling instead.
4. Inherited CSS is the trap worth checking first. A panel or overlay placed
   inside a heading, a table header or a legend picks up its `text-transform`,
   `letter-spacing` and `font-weight`.

## Claude Code operating mode

Act as an autonomous coding agent, but keep the owner in control of design
direction.

1. Make the smallest useful change.
2. Keep the project runnable.
3. Write or update tests for logic that warrants them.
4. Update docs when design or behaviour changes.
5. Do not expand scope without noting the tradeoff.
6. Flag risks clearly.
7. Keep outputs concise.
8. Do not use em dashes.

When uncertain, choose the simplest option that supports the goal.
