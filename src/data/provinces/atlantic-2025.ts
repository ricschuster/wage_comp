/**
 * Atlantic province income tax parameters, tax year 2025.
 *
 * New Brunswick, Newfoundland and Labrador, Nova Scotia and Prince Edward
 * Island. All four are plain: brackets and a flat basic personal amount, with
 * no surtax, no premium, no low-income reduction and no income testing.
 *
 * Nova Scotia is the one worth explaining. Its basic personal amount was
 * income-tested until 2025, when the announcement of 2025-02-18 set it at the
 * maximum regardless of taxable income. That applies to the whole of the 2025
 * tax year, so 2025 is already flat and no taper is modelled. Payroll
 * withholding needed a prorated formula for the second half of 2025 to make up
 * for the tested amounts used in the first half.
 *
 * Prince Edward Island is the other exception: it does not index, so its 2025
 * basic personal amount of 14,650 moved only when the province legislated an
 * increase to 15,000 for 2026.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

/** CRA, "Payroll Deductions Formulas", 121st edition, effective 2025-07-01. */
const CRA_T4127_2025_JUL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jul-121st-edition-effective-july-1-2025/t4127-jul-payroll-deductions-formulas.html';

const RETRIEVED = '2026-08-25';

export const NEW_BRUNSWICK_2025: ProvincialParameters = {
  code: 'NB',
  name: 'New Brunswick',
  brackets: {
    value: [
      { from: 0, to: 51_306, rate: 0.094 },
      { from: 51_306, to: 102_614, rate: 0.14 },
      { from: 102_614, to: 190_060, rate: 0.16 },
      { from: 190_060, to: null, rate: 0.195 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, New Brunswick, 2025.',
  },
  creditRate: {
    value: 0.094,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest New Brunswick bracket rate.',
  },
  basicPersonalAmount: {
    value: 13_396,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, New Brunswick basic amount for 2025. Indexed by 2.7%.',
  },
};

export const NEWFOUNDLAND_2025: ProvincialParameters = {
  code: 'NL',
  name: 'Newfoundland and Labrador',
  brackets: {
    value: [
      { from: 0, to: 44_192, rate: 0.087 },
      { from: 44_192, to: 88_382, rate: 0.145 },
      { from: 88_382, to: 157_792, rate: 0.158 },
      { from: 157_792, to: 220_910, rate: 0.178 },
      { from: 220_910, to: 282_214, rate: 0.198 },
      { from: 282_214, to: 564_429, rate: 0.208 },
      { from: 564_429, to: 1_128_858, rate: 0.213 },
      { from: 1_128_858, to: null, rate: 0.218 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, 2025. Eight bands, the most of any jurisdiction in the model.',
  },
  creditRate: {
    value: 0.087,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Newfoundland and Labrador bracket rate.',
  },
  basicPersonalAmount: {
    value: 11_067,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, 2025. The smallest in the model, indexed by only 2.3%.',
  },
};

export const NOVA_SCOTIA_2025: ProvincialParameters = {
  code: 'NS',
  name: 'Nova Scotia',
  brackets: {
    value: [
      { from: 0, to: 30_507, rate: 0.0879 },
      { from: 30_507, to: 61_015, rate: 0.1495 },
      { from: 61_015, to: 95_883, rate: 0.1667 },
      { from: 95_883, to: 154_650, rate: 0.175 },
      { from: 154_650, to: null, rate: 0.21 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, Nova Scotia, 2025. Indexed by 3.1%, the largest provincial indexation that year.',
  },
  creditRate: {
    value: 0.0879,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Nova Scotia bracket rate.',
  },
  basicPersonalAmount: {
    value: 11_744,
    source: CRA_T4127_2025_JUL,
    retrieved: RETRIEVED,
    note: 'Flat for 2025: the announcement of 2025-02-18 set BPANS at the maximum of 11,744 regardless of taxable income, ending the income test.',
  },
};

export const PRINCE_EDWARD_ISLAND_2025: ProvincialParameters = {
  code: 'PE',
  name: 'Prince Edward Island',
  brackets: {
    value: [
      { from: 0, to: 33_328, rate: 0.095 },
      { from: 33_328, to: 64_656, rate: 0.1347 },
      { from: 64_656, to: 105_000, rate: 0.166 },
      { from: 105_000, to: 140_000, rate: 0.1762 },
      { from: 140_000, to: null, rate: 0.19 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, Prince Edward Island, 2025.',
  },
  creditRate: {
    value: 0.095,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Prince Edward Island bracket rate.',
  },
  basicPersonalAmount: {
    value: 14_650,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, 2025. The index rate column is blank because the province does not index; it legislated 15,000 for 2026 instead. The surtax column is blank, so no surtax is modelled.',
  },
};
