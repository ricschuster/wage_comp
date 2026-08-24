# Milestones

Each milestone is a set of PRs. Slices are vertical: a jurisdiction's
parameters, its engine module, and its golden tests land together, because a
parameter table with no test attached proves nothing.

## M0. Harness

Repo scaffolding adapted from SHI_example: build tooling, CI, Pages deploy,
issue and PR templates, docs framework, project brief, ADRs, backlog issues.

Status: in progress.

## M1. Engine, one jurisdiction slice per PR

Each slice ships parameters with citations, a pure engine module, unit tests for
the rules, and golden tests pinned to an official calculator.

1. Canada federal: brackets, basic personal amount with phase-out, Canada
   Employment Amount.
2. Canada payroll: CPP, CPP2, EI.
3. British Columbia: brackets, basic personal amount, BC tax reduction credit.
4. Austria regular salary: brackets, employee credits, regular social insurance,
   the sliding reduced unemployment contribution, SV-Rückerstattung, and the
   Werbungskosten and Sonderausgaben Pauschalen.
5. Austria special payments: the 6/7 and 1/7 split, Jahressechstel bands,
   special-payment social insurance with its separate ceiling.

Verification target: engine output matches the CRA Payroll Deductions Online
Calculator and a recognised Austrian brutto-netto calculator at fixed incomes
spanning the range, with the calculator settings recorded alongside each case.

## M2. Comparison layer

FX and both PPP bases, net and PPP-adjusted results, effective deduction rates,
the Austria over Canada ratio, and the structured calculation trace that feeds
the audit view.

## M3. Dashboard

Inputs, headline cards, results table, and three hand-rolled SVG charts:
PPP-adjusted net income, effective deduction rate, and the ratio with its 1.0
reference line.

## M4. Solver, audit, methodology

Equivalence solver. Expandable audit view per output line. Assumptions panel
with guardrails, modified-from-default flags, and reset. Methodology page. Share
link via URL-encoded state.

## M5. Deploy and document

Pages live, README with screenshot, handoff.

## Post-MVP backlog

Tracked as GitHub issues. Open issues are the live roadmap.

- Alberta and Ontario parameters, then the remaining provinces and territories
- Quebec as its own module (QPP, QPIP, federal abatement)
- Housing-adjusted mode for a chosen city pair
- Value of deductions: healthcare and pension entitlement
- Multi-year comparison and an annual parameter update procedure
- Couples and dependants
- Employer-side total cost of employment
