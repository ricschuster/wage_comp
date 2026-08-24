# The app replaces the Excel workbook, and its numbers are not imported

## Status

Accepted

## Context

This project began as an Excel workbook comparing Canadian and Austrian
after-tax income (v02, August 2026). The workbook established the right framing
and caught a real modelling error: it originally omitted Austrian special
payments and materially understated Austrian compensation.

A brief proposed extending the workbook with a province selector, a dashboard, a
dynamic income generator, a scenario manager and a chart suite.

## Decision

Build the app instead. Do not maintain the workbook in parallel, and do not
import its parameter values.

Carry forward from the workbook: the objective, the correctness rules about
Austrian special payments and social insurance, and the documented list of
modelled and unmodelled items.

## Context for not importing the numbers

The workbook's tax parameters had no provenance recorded. They were generated
rather than sourced, which makes them plausible and unverified. Importing them
would move unverified numbers into the repository where they would acquire
false authority from being version controlled and test covered.

Every parameter is therefore sourced fresh, with a URL and a retrieval date, and
pinned by golden tests against official calculators.

## Consequences

Positive:

- The requirements that would have become unmaintainable spreadsheet formulas
  (lookups across provinces, user-editable assumptions, scenario management, an
  audit trail) become ordinary code with tests.
- Provenance is clean. No unverified value survives into the repository.
- The model can be audited by anyone, which suits the owner's open science
  approach.

Negative:

- Sourcing every parameter is slower than copying the workbook's cells, and it
  front-loads the work into M1.
- Users who wanted a spreadsheet get a web app. Mitigated by the audit view,
  which exposes the formula, inputs, parameter values and citations behind every
  output line.
