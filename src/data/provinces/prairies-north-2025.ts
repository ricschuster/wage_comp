/**
 * Saskatchewan and the two remaining territories, tax year 2025.
 *
 * Saskatchewan, Northwest Territories and Nunavut. All plain: brackets and a
 * flat basic personal amount.
 *
 * Saskatchewan's basic personal amount rises faster than indexation alone: The
 * Saskatchewan Affordability Act adds 500 a year on top of indexation for four
 * years, which is why 19,491 in 2025 becomes 20,381 in 2026.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const SASKATCHEWAN_2025: ProvincialParameters = {
  code: 'SK',
  name: 'Saskatchewan',
  brackets: {
    value: [
      { from: 0, to: 53_463, rate: 0.105 },
      { from: 53_463, to: 152_750, rate: 0.125 },
      { from: 152_750, to: null, rate: 0.145 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, Saskatchewan, 2025.',
  },
  creditRate: {
    value: 0.105,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Saskatchewan bracket rate.',
  },
  basicPersonalAmount: {
    value: 19_491,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, Saskatchewan basic amount for 2025.',
  },
};

export const NORTHWEST_TERRITORIES_2025: ProvincialParameters = {
  code: 'NT',
  name: 'Northwest Territories',
  brackets: {
    value: [
      { from: 0, to: 51_964, rate: 0.059 },
      { from: 51_964, to: 103_930, rate: 0.086 },
      { from: 103_930, to: 168_967, rate: 0.122 },
      { from: 168_967, to: null, rate: 0.1405 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, Northwest Territories, 2025.',
  },
  creditRate: {
    value: 0.059,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Northwest Territories bracket rate.',
  },
  basicPersonalAmount: {
    value: 17_842,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, Northwest Territories basic amount for 2025.',
  },
};

export const NUNAVUT_2025: ProvincialParameters = {
  code: 'NU',
  name: 'Nunavut',
  brackets: {
    value: [
      { from: 0, to: 54_707, rate: 0.04 },
      { from: 54_707, to: 109_413, rate: 0.07 },
      { from: 109_413, to: 177_881, rate: 0.09 },
      { from: 177_881, to: null, rate: 0.115 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, 2025. The 4% first band is the lowest in Canada.',
  },
  creditRate: {
    value: 0.04,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Nunavut bracket rate.',
  },
  basicPersonalAmount: {
    value: 19_274,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, Nunavut basic amount for 2025.',
  },
};
