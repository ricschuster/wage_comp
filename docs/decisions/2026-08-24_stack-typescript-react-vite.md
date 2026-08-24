# Stack: TypeScript, React, Vite, static deployment

## Status

Accepted

## Context

The tool must let users enter their own incomes and assumptions and build their
own scenarios, which rules out precomputing a fixed grid of results and shipping
it as static data. The tax engine has to run live against arbitrary inputs.

It must also be permanently published, publicly, at no running cost, from the
existing GitHub repository.

The owner has HTML and CSS experience but not JavaScript. Two prior projects
(ricschuster/SCP_tutorial and NCC-CNC/SHI_example) already use a working harness
for exactly this shape of app, and the owner asked to mirror them.

## Decision

TypeScript (strict), React, Vite, Vitest, deployed as a static site to GitHub
Pages. Mirror the SHI_example harness: eslint and prettier configs, CI and
deploy workflows, issue and PR templates, and the `docs/{design,decisions,handoffs}`
framework.

The tax computation lives in pure, framework-free modules under `src/engine/`
with no React imports, so it is unit-testable independently of the UI.

Charts are hand-rolled SVG. No charting library.

## Consequences

Positive:

- One implementation of the tax logic, running client-side, with no backend to
  deploy or keep alive and no hosting cost.
- The engine is testable, so "preserve the Austrian special-payment logic"
  becomes an assertion in CI rather than a hope.
- The harness, CI gates and review workflow are already proven in two sibling
  repos, so M0 is a copy-and-adapt rather than a design exercise.

Negative:

- The engine is not directly callable from R or Python. If batch analysis is
  wanted later, a small CLI runner over the same engine is the answer, not a
  second implementation.
- No live FX rate, since there is no backend. Handled by making FX a user input
  with a sourced, date-stamped default.
- Three line charts hand-rolled in SVG is more code than calling a library, but
  avoids a dependency whose surface far exceeds the need.
