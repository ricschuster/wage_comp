# Parameter provenance and verification policy

## Status

Accepted

## Context

The quality of this tool is bounded by the quality of roughly a hundred tax
parameters, not by the quality of its architecture. A polished dashboard on
unsourced parameters is a more confident wrong answer than the spreadsheet it
replaces.

Two failure modes matter:

1. A parameter is wrong and nobody notices, because nothing checks it.
2. A parameter silently goes stale when the tax year rolls over.

The owner will spot check occasionally but is not going to re-derive the tax
code, and asked that verification live in the repository as tests so it is run,
documented and transparent.

## Decision

**Structure.** Parameters live in `src/data/`, keyed by tax year, never inline
in engine code. Each value is a record carrying the value, its source URL, and
the date it was retrieved.

**Verification.** Two layers:

1. *Unit tests* assert the structural rules: the 6/7 and 1/7 split, no double
   counting of special payments, separate social insurance ceilings, bracket
   tables that are contiguous and ordered, ceilings that are positive and
   monotonic.
2. *Golden tests* pin engine output to results from an official calculator at
   fixed incomes spanning the modelled range. Canada uses the CRA Payroll
   Deductions Online Calculator. Austria uses a recognised brutto-netto
   calculator. Each golden case records the exact calculator settings used,
   because those calculators embed defaults of their own (commuter allowance,
   pay periods, credits claimed) that would otherwise silently explain a
   mismatch.

**Gaps.** A parameter that cannot be verified against an authoritative source
does not ship as a plausible guess. It is recorded as a documented gap in the
methodology page, and the affected output is labelled.

**Annual update.** A new tax year is a new parameter file plus a golden test
run, not a code change. If a year rollover requires touching `src/engine/`, that
is a signal the parameter abstraction leaked.

**Audit surface.** Every output line in the app expands to show the formula
applied, its inputs, the parameter values used, and the citation for each. The
tests are the second layer of the same commitment.

## Consequences

Positive:

- Correctness claims are checkable by a third party, which is the point of
  publishing openly.
- Staleness becomes visible: a retrieval date that trails the tax year is a
  reviewable fact rather than an invisible one.
- Spot checking is cheap, because the citation sits next to the number.

Negative:

- Sourcing is the slowest part of M1 and cannot be parallelised away. Austrian
  values in particular are often published as PDFs rather than as structured
  data.
- Golden tests are brittle in a useful way: an upstream calculator changing its
  defaults will break CI. That is preferable to it changing silently.
- Carrying provenance on every value makes the data files more verbose than a
  bare table of numbers.
