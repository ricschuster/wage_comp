/**
 * Alberta income tax parameters, tax year 2026.
 *
 * Alberta has no surtax, no health premium and no low-income tax reduction, so
 * it is the simplest jurisdiction in the model: brackets and a basic personal
 * amount. Note the new 8% first bracket, which is recent.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const ALBERTA_2026: ProvincialParameters = {
  code: 'AB',
  name: 'Alberta',

  brackets: {
    value: [
      { from: 0, to: 61_200, rate: 0.08 },
      { from: 61_200, to: 154_259, rate: 0.1 },
      { from: 154_259, to: 185_111, rate: 0.12 },
      { from: 185_111, to: 246_813, rate: 0.13 },
      { from: 246_813, to: 370_220, rate: 0.14 },
      { from: 370_220, to: null, rate: 0.15 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1, Alberta rates (V) and thresholds (A). Corroborated by the CRA brackets page.',
  },

  creditRate: {
    value: 0.08,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Alberta bracket rate.',
  },

  basicPersonalAmount: {
    value: 22_769,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.10, Alberta claim code 1. Much larger than other provinces.',
  },
};
