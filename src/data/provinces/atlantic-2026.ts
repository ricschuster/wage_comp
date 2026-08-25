/**
 * Atlantic province income tax parameters, tax year 2026.
 *
 * New Brunswick, Newfoundland and Labrador, Nova Scotia and Prince Edward
 * Island. All four are plain: brackets and a flat basic personal amount, with
 * no surtax, no premium, no low-income reduction and no income testing.
 *
 * Two notes worth keeping:
 *
 * - Newfoundland and Labrador has eight bands, the most of any jurisdiction,
 *   reaching 21.8% above 1,141,275.
 * - Nova Scotia's basic personal amount used to be income-tested. T4127 states
 *   that for 2026 the formula is removed and the amount is flat, so it is
 *   modelled without a taper.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const NEW_BRUNSWICK_2026: ProvincialParameters = {
  code: 'NB',
  name: 'New Brunswick',
  brackets: {
    value: [
      { from: 0, to: 52_333, rate: 0.094 },
      { from: 52_333, to: 104_666, rate: 0.14 },
      { from: 104_666, to: 193_861, rate: 0.16 },
      { from: 193_861, to: null, rate: 0.195 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1, New Brunswick.',
  },
  creditRate: {
    value: 0.094,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest New Brunswick bracket rate.',
  },
  basicPersonalAmount: {
    value: 13_664,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.2, New Brunswick basic amount.',
  },
};

export const NEWFOUNDLAND_2026: ProvincialParameters = {
  code: 'NL',
  name: 'Newfoundland and Labrador',
  brackets: {
    value: [
      { from: 0, to: 44_678, rate: 0.087 },
      { from: 44_678, to: 89_354, rate: 0.145 },
      { from: 89_354, to: 159_528, rate: 0.158 },
      { from: 159_528, to: 223_340, rate: 0.178 },
      { from: 223_340, to: 285_319, rate: 0.198 },
      { from: 285_319, to: 570_638, rate: 0.208 },
      { from: 570_638, to: 1_141_275, rate: 0.213 },
      { from: 1_141_275, to: null, rate: 0.218 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1. Eight bands, the most of any jurisdiction in the model.',
  },
  creditRate: {
    value: 0.087,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Newfoundland and Labrador bracket rate.',
  },
  basicPersonalAmount: {
    value: 11_188,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.2, Newfoundland and Labrador basic amount. The smallest in the model.',
  },
};

export const NOVA_SCOTIA_2026: ProvincialParameters = {
  code: 'NS',
  name: 'Nova Scotia',
  brackets: {
    value: [
      { from: 0, to: 30_995, rate: 0.0879 },
      { from: 30_995, to: 61_991, rate: 0.1495 },
      { from: 61_991, to: 97_417, rate: 0.1667 },
      { from: 97_417, to: 157_124, rate: 0.175 },
      { from: 157_124, to: null, rate: 0.21 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1, Nova Scotia.',
  },
  creditRate: {
    value: 0.0879,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Nova Scotia bracket rate.',
  },
  basicPersonalAmount: {
    value: 11_932,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Flat for 2026: T4127 states the income-tested BPANS formula is removed.',
  },
};

export const PRINCE_EDWARD_ISLAND_2026: ProvincialParameters = {
  code: 'PE',
  name: 'Prince Edward Island',
  brackets: {
    value: [
      { from: 0, to: 33_928, rate: 0.095 },
      { from: 33_928, to: 65_820, rate: 0.1347 },
      { from: 65_820, to: 106_890, rate: 0.166 },
      { from: 106_890, to: 142_520, rate: 0.1762 },
      { from: 142_520, to: null, rate: 0.19 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1. The top threshold was updated in May 2026.',
  },
  creditRate: {
    value: 0.095,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Prince Edward Island bracket rate.',
  },
  basicPersonalAmount: {
    value: 15_000,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.2. The surtax column is blank for 2026, so no surtax is modelled.',
  },
};
