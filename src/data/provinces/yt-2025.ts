/**
 * Yukon income tax parameters, tax year 2025.
 *
 * As in 2026, Yukon's basic personal amount mirrors the federal one, taper and
 * all: T4127 states BPAYT = BPAF. The federal values are repeated here so the
 * province file stays self-contained and the federal module does not have to
 * know about Yukon.
 *
 * Its bracket thresholds also track the federal ones up to 500,000, where it
 * adds a top band of its own. Note that the rates do not track the federal
 * ones: the 2025 federal cut to 14.5% has no Yukon equivalent.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

/** CRA, "Payroll Deductions Formulas", 120th edition, effective 2025-01-01. */
const CRA_T4127_2025 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jan-120th-edition-effective-january-1-2025/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const YUKON_2025: ProvincialParameters = {
  code: 'YT',
  name: 'Yukon',

  brackets: {
    value: [
      { from: 0, to: 57_375, rate: 0.064 },
      { from: 57_375, to: 114_750, rate: 0.09 },
      { from: 114_750, to: 177_882, rate: 0.109 },
      { from: 177_882, to: 500_000, rate: 0.128 },
      { from: 500_000, to: null, rate: 0.15 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, 2025. The first four thresholds match the federal ones; the 500,000 band is Yukon-specific.',
  },

  creditRate: {
    value: 0.064,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Yukon bracket rate.',
  },

  basicPersonalAmount: {
    value: 16_129,
    source: CRA_T4127_2025,
    retrieved: RETRIEVED,
    note: 'BPAYT mirrors the federal BPAF, so this is the federal 2025 maximum.',
  },

  basicPersonalAmountPhaseOut: {
    minimum: {
      value: 14_538,
      source: CRA_T4127_2025,
      retrieved: RETRIEVED,
      note: 'Federal base amount, which the taper floors at rather than reaching zero.',
    },
    start: {
      value: 177_882,
      source: CRA_T4127_2025,
      retrieved: RETRIEVED,
      note: 'Federal 29% bracket threshold for 2025.',
    },
    end: {
      value: 253_414,
      source: CRA_T4127_2025,
      retrieved: RETRIEVED,
      note: 'Federal 33% bracket threshold for 2025.',
    },
  },
};
