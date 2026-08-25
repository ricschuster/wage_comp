/**
 * Saskatchewan and the two remaining territories, tax year 2026.
 *
 * Saskatchewan, Northwest Territories and Nunavut. All plain: brackets and a
 * flat basic personal amount.
 *
 * The territories have unusually low rates and unusually large personal
 * amounts, which is why they come out well ahead of every province at low
 * incomes. Nunavut's first band is 4%, the lowest anywhere in Canada.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const SASKATCHEWAN_2026: ProvincialParameters = {
  code: 'SK',
  name: 'Saskatchewan',
  brackets: {
    value: [
      { from: 0, to: 54_532, rate: 0.105 },
      { from: 54_532, to: 155_805, rate: 0.125 },
      { from: 155_805, to: null, rate: 0.145 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1, Saskatchewan.',
  },
  creditRate: {
    value: 0.105,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Saskatchewan bracket rate.',
  },
  basicPersonalAmount: {
    value: 20_381,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.2, Saskatchewan basic amount.',
  },
};

export const NORTHWEST_TERRITORIES_2026: ProvincialParameters = {
  code: 'NT',
  name: 'Northwest Territories',
  brackets: {
    value: [
      { from: 0, to: 53_003, rate: 0.059 },
      { from: 53_003, to: 106_009, rate: 0.086 },
      { from: 106_009, to: 172_346, rate: 0.122 },
      { from: 172_346, to: null, rate: 0.1405 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1, Northwest Territories.',
  },
  creditRate: {
    value: 0.059,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Northwest Territories bracket rate.',
  },
  basicPersonalAmount: {
    value: 18_198,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.2, Northwest Territories basic amount.',
  },
};

export const NUNAVUT_2026: ProvincialParameters = {
  code: 'NU',
  name: 'Nunavut',
  brackets: {
    value: [
      { from: 0, to: 55_801, rate: 0.04 },
      { from: 55_801, to: 111_602, rate: 0.07 },
      { from: 111_602, to: 181_439, rate: 0.09 },
      { from: 181_439, to: null, rate: 0.115 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1. The 4% first band is the lowest in Canada.',
  },
  creditRate: {
    value: 0.04,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Nunavut bracket rate.',
  },
  basicPersonalAmount: {
    value: 19_659,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.2, Nunavut basic amount.',
  },
};
