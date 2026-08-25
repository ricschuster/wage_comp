/**
 * Yukon income tax parameters, tax year 2026.
 *
 * Yukon's basic personal amount mirrors the federal one, taper and all, which
 * T4127 states explicitly: BPAYT = BPAF. The values are therefore the federal
 * ones, repeated here so the province file stays self-contained and the
 * federal module does not have to know about Yukon.
 *
 * Its bracket thresholds also track the federal ones up to 500,000, where it
 * adds a top band of its own.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const YUKON_2026: ProvincialParameters = {
  code: 'YT',
  name: 'Yukon',

  brackets: {
    value: [
      { from: 0, to: 58_523, rate: 0.064 },
      { from: 58_523, to: 117_045, rate: 0.09 },
      { from: 117_045, to: 181_440, rate: 0.109 },
      { from: 181_440, to: 500_000, rate: 0.128 },
      { from: 500_000, to: null, rate: 0.15 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1. The first four thresholds match the federal ones; the 500,000 band is Yukon-specific.',
  },

  creditRate: {
    value: 0.064,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Yukon bracket rate.',
  },

  basicPersonalAmount: {
    value: 16_452,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'BPAYT mirrors the federal BPAF, so this is the federal maximum.',
  },

  basicPersonalAmountPhaseOut: {
    minimum: {
      value: 14_829,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Federal base amount, which the taper floors at rather than reaching zero.',
    },
    start: {
      value: 181_440,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Federal 29% bracket threshold.',
    },
    end: {
      value: 258_482,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Federal 33% bracket threshold.',
    },
  },
};
