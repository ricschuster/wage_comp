# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Project harness: build tooling, CI, GitHub Pages deploy, issue and pull
  request templates, docs framework.
- Project brief, milestones, and four architecture decision records covering the
  stack, the decision to replace the Excel workbook, the PPP basis, and the
  parameter provenance policy.
- Tax engine for both countries, with every parameter sourced and cited: Canada
  federal, Canada payroll (CPP, CPP2, EI), British Columbia behind a province
  lookup, Austria regular salary, and Austrian special payments.
- Comparison layer with market exchange rate and two PPP bases, effective
  deduction rates, the Austria over Canada ratio, and a calculation trace.
- Equivalence solver answering what Austrian gross matches a Canadian package.
- Dashboard with inputs, headline cards, an equivalent-salary panel and a
  results table.
- Three hand-rolled SVG charts: take-home income, effective deduction rate, and
  the ratio with a reference line at 1.0.
- Audit view exposing every formula, its inputs and a link to each parameter's
  source.
- Methodology page, with a source list generated from the parameters so it
  cannot drift out of date.
- Assumptions panel with guardrails and resets, named scenario presets, and
  shareable links that reproduce an exact scenario.
- `tools/source.sh` for fetching authoritative source pages, and
  `tools/screenshot.sh` for regenerating the README screenshot.

### Notes

- Uses 14% as the lowest federal rate for 2026, reflecting the 2025 rate cut.
- Uses 5.06% for the first British Columbia bracket, per the Government of
  British Columbia and CRA's T4127 payroll formulas. CRA's public tax brackets
  page shows 5.6%, which appears to be a typo.
