# Project Brief: Canada / Austria Wage Comparison

## Objective

Compare **after-tax purchasing power** between Canada and Austria across a
configurable gross income range.

The primary goal is not nominal salary comparison. Gross salary is an input, not
an answer.

## Headline outputs

- Net take-home pay, both countries
- PPP-adjusted take-home pay, both countries
- Effective deduction rate, both countries
- Austria divided by Canada purchasing-power ratio

Ratio interpretation:

- Above 1.0: Austria ahead
- Below 1.0: Canada ahead
- At 1.0: equivalent

## Origin and what changed

An earlier Excel workbook (v02, August 2026) established the framing and caught
one genuine modelling error: it originally omitted Austrian special payments and
materially understated Austrian compensation. That framing is carried forward.

Everything else was rebuilt. The workbook is not maintained in parallel and its
numbers were not imported. Reasons:

1. Its parameters had no provenance. They were plausible and unverified.
2. Spreadsheet formulas cannot be tested, so "preserve the Austrian
   special-payment logic" was an unverifiable claim.
3. The requirements (province selector, scenario management, user-entered
   assumptions, an audit trail) are the things that become unmaintainable
   spaghetti in Excel.

See `docs/decisions/2026-08-24_app-replaces-workbook.md`.

## Correctness rules

1. **Austrian special payments are a split, not an addition.** Annual Austrian
   gross splits 6/7 regular and 1/7 special. The 13th and 14th salaries are not
   added on top of annual compensation.
2. **Austrian social insurance is two regimes.** Regular salary and special
   payments carry separate rates and separate ceilings. They are never collapsed
   into one rate.
3. **Every parameter carries a citation.** Source URL plus retrieval date. An
   unsourceable value becomes a documented gap, not a guess.

Each rule is enforced by a test.

## Modelled baseline

Both countries, unless a user changes an assumption within its guardrails:

- Single taxpayer, no dependents
- Employment income only
- No voluntary or discretionary deductions

Canada, modelled:

- Federal brackets, basic personal amount with its phase-out, Canada Employment
  Amount
- Provincial brackets, basic personal amount, and the BC tax reduction credit
- CPP, CPP2, EI

Canada, not modelled: RRSP, union dues, medical credits, dependants, spousal
transfers, self-employment.

Austria, modelled:

- Income tax brackets and the employee credits
- The 6/7 and 1/7 split of annual gross
- Jahressechstel band structure applied to special payments
- Social insurance, regular and special payment regimes with separate ceilings
- The sliding reduced unemployment contribution at low incomes
- SV-Rückerstattung (negative tax) at low incomes
- Werbungskosten and Sonderausgaben Pauschalen

Austria, not modelled: family benefits, commuter allowance, employer-specific
collective agreements, job-change edge cases, advanced Jahressechstel scenarios
such as mid-year entry or exit.

Neither side models employer-side cost. That is a backlog item.

## Purchasing power basis

Two comparison bases, user-selectable:

- **FX.** A user-entered exchange rate with a sourced, date-stamped default.
  There is no backend, so no live rate fetch, and a hardcoded rate would go
  stale within days.
- **PPP.** Two bases:
  - Household final consumption expenditure PPP (default)
  - GDP PPP (alternate, for continuity with the workbook)

Household consumption PPP is the default because GDP PPP includes investment,
government spending and net exports, which is the wrong basket for a question
about what a person can buy. See
`docs/decisions/2026-08-24_ppp-basis.md`.

## Known limitations of the comparison itself

These are documented in the app's methodology page, because they bound what the
ratio means.

1. **Same-gross comparison assumes a labour-market parity that does not exist.**
   Nobody is offered the same gross in both countries. This is why the
   equivalence solver is in the MVP: "what Austrian gross matches this Canadian
   package" is the question people actually face.
2. **PPP does not correct for what deductions buy.** Austrian social insurance
   purchases healthcare and a substantial defined-benefit pension entitlement.
   Treating both countries' deductions as pure loss systematically understates
   Austria. Backlog item.
3. **Housing is the largest uncorrected term.** For a Vancouver versus Vienna
   comparison, housing cost dominates real purchasing power, and PPP at the
   national level mutes it badly. Backlog item.
4. **Childcare, tuition and transit differ structurally** and PPP does not fix
   them.

## Success criteria

A user can answer, directly from the dashboard:

1. If I earn X in Canada, how does my after-tax purchasing power compare to
   Austria?
2. Does the answer change under PPP versus FX?
3. Does the answer change by Canadian province?
4. At what income does Austria overtake Canada, if at all?
5. What Austrian gross would match a given Canadian package?
6. How sensitive is the result to a given assumption?

## Scope of the MVP

In:

- Province selector, populated with BC only. The lookup architecture ships now
  so that adding a province is a parameter file plus tests.
- Dashboard with headline cards
- Income range generator (start, end, increment)
- Scenarios as named input bundles plus URL-encoded sharing
- Three charts: PPP-adjusted net, effective deduction rate, ratio with a 1.0
  reference line
- FX versus PPP toggle, and PPP basis toggle
- Equivalence solver
- Audit view: every output line expands to show formula, inputs, parameter
  values, and citations
- Assumptions panel with guardrails, modified-from-default flags, and reset
- Methodology page

Out, tracked as issues:

- Alberta, Ontario, then remaining provinces and territories
- Quebec, which is its own module rather than a parameter table: QPP instead of
  CPP, QPIP, and the federal abatement
- Housing-adjusted mode
- Value of deductions (healthcare and pension entitlement)
- Multi-year comparison
- Couples and dependants
- Employer-side total cost of employment

## Milestones

See `docs/design/03_milestones.md`.
