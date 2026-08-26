/**
 * Alberta income tax parameters, tax year 2025.
 *
 * 2025 is the year Alberta's new 8% first bracket arrived. It applies to the
 * whole of 2025 for the annual return; payroll withholding used a prorated 6%
 * for the second half of the year to offset the 10% charged in the first half.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const ALBERTA_2025: ProvincialParameters = {
  code: 'AB',
  name: 'Alberta',

  brackets: {
    value: [
      { from: 0, to: 60_000, rate: 0.08 },
      { from: 60_000, to: 151_234, rate: 0.1 },
      { from: 151_234, to: 181_481, rate: 0.12 },
      { from: 181_481, to: 241_974, rate: 0.13 },
      { from: 241_974, to: 362_961, rate: 0.14 },
      { from: 362_961, to: null, rate: 0.15 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, Alberta rates (V) and thresholds (A) for 2025.',
  },

  creditRate: {
    value: 0.08,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Alberta bracket rate, new for 2025.',
  },

  basicPersonalAmount: {
    value: 22_323,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, Alberta basic amount for 2025. Indexed by 2.0%.',
  },
};
