/**
 * Manitoba income tax parameters, tax year 2026.
 *
 * Manitoba is one of only two jurisdictions whose basic personal amount is
 * income-tested. It tapers to nothing between 200,000 and 400,000, so a high
 * earner gets no personal amount at all.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const MANITOBA_2026: ProvincialParameters = {
  code: 'MB',
  name: 'Manitoba',

  brackets: {
    value: [
      { from: 0, to: 47_000, rate: 0.108 },
      { from: 47_000, to: 100_000, rate: 0.1275 },
      { from: 100_000, to: null, rate: 0.174 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1, Manitoba rates (V) and thresholds (A).',
  },

  creditRate: {
    value: 0.108,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Manitoba bracket rate.',
  },

  basicPersonalAmount: {
    value: 15_780,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'BPAMB formula: the full amount at or below 200,000 of net income.',
  },

  basicPersonalAmountPhaseOut: {
    minimum: {
      value: 0,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'BPAMB is zero at and above 400,000, unlike the federal taper which stops at a floor.',
    },
    start: {
      value: 200_000,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Net income above which BPAMB starts to taper.',
    },
    end: {
      value: 400_000,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Net income at which BPAMB reaches zero.',
    },
  },
};
