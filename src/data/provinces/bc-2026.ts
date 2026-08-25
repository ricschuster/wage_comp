/**
 * British Columbia income tax parameters, tax year 2026.
 *
 * Note on the lowest rate: CRA's public "tax rates and brackets" page shows
 * 5.6% for the first BC bracket. That is a typo. Both the Government of
 * British Columbia and CRA's own T4127 payroll formulas give 5.06%, and every
 * other rate on the two sources agrees exactly. The BC source is preferred
 * here because the province sets its own rates.
 */

import type { ProvincialParameters } from './types.ts';

/** Government of British Columbia, "Personal income tax rates". */
const BC_RATES =
  'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/tax-rates';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-24';

export const BRITISH_COLUMBIA_2026: ProvincialParameters = {
  code: 'BC',
  name: 'British Columbia',

  brackets: {
    value: [
      { from: 0, to: 50_363, rate: 0.0506 },
      { from: 50_363, to: 100_728, rate: 0.077 },
      { from: 100_728, to: 115_648, rate: 0.105 },
      { from: 115_648, to: 140_430, rate: 0.1229 },
      { from: 140_430, to: 190_405, rate: 0.147 },
      { from: 190_405, to: 265_545, rate: 0.168 },
      { from: 265_545, to: null, rate: 0.205 },
    ],
    source: BC_RATES,
    retrieved: RETRIEVED,
    note: 'Brackets indexed by BC CPI of 2.2% for 2026. Budget 2026 paused indexation for 2027 through 2030; it resumes for 2031.',
  },

  creditRate: {
    value: 0.0506,
    source: BC_RATES,
    retrieved: RETRIEVED,
    note: 'Lowest BC bracket rate. Corroborated by T4127 Table 8.1, which gives 0.0506.',
  },

  basicPersonalAmount: {
    value: 13_216,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.11, British Columbia claim code 1.',
  },

  taxReduction: {
    kind: 'phaseOut',
    maximumReduction: {
      value: 575,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'BC tax reduction, T4127 factor S.',
    },
    phaseOutStart: {
      value: 25_570,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Income above which the reduction shrinks.',
    },
    phaseOutRate: {
      value: 0.0356,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Reduction reaches zero at 41,722, which is 25,570 plus 575 divided by this rate.',
    },
  },
};
