/**
 * Ontario income tax parameters, tax year 2026.
 *
 * The most complicated jurisdiction in the model, and the reason the province
 * lookup carries optional surtax and health premium fields:
 *
 * - a two-tier surtax charged on provincial tax already payable, not on income
 * - a stepped health premium charged on taxable income, which the tax
 *   reduction explicitly does not reduce
 * - a low-income tax reduction shaped differently from British Columbia's
 *
 * Treating Ontario as a plain bracket table would understate tax at middle
 * incomes (the surtax) and omit the premium entirely.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const ONTARIO_2026: ProvincialParameters = {
  code: 'ON',
  name: 'Ontario',

  brackets: {
    value: [
      { from: 0, to: 53_891, rate: 0.0505 },
      { from: 53_891, to: 107_785, rate: 0.0915 },
      { from: 107_785, to: 150_000, rate: 0.1116 },
      { from: 150_000, to: 220_000, rate: 0.1216 },
      { from: 220_000, to: null, rate: 0.1316 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.1, Ontario rates (V) and thresholds (A).',
  },

  creditRate: {
    value: 0.0505,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Lowest Ontario bracket rate.',
  },

  basicPersonalAmount: {
    value: 12_989,
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Table 8.18, Ontario claim code 1. Published K1P of 655.94 equals this at 5.05%.',
  },

  taxReduction: {
    kind: 'doubleBase',
    baseAmount: {
      value: 300,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Factor S: the lesser of the tax and twice this amount less the tax. Dependant amounts of 554 each are not modelled, since the baseline has no dependants.',
    },
  },

  surtax: {
    value: [
      { over: 5_818, rate: 0.2 },
      { over: 7_446, rate: 0.36 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Factor V1. The tiers stack, so tax above 7,446 attracts both, an effective 56%.',
  },

  healthPremium: {
    value: [
      { from: 0, upTo: 20_000, base: 0, rate: 0, maximum: 0 },
      { from: 20_000, upTo: 36_000, base: 0, rate: 0.06, maximum: 300 },
      { from: 36_000, upTo: 48_000, base: 300, rate: 0.06, maximum: 450 },
      { from: 48_000, upTo: 72_000, base: 450, rate: 0.25, maximum: 600 },
      { from: 72_000, upTo: 200_000, base: 600, rate: 0.25, maximum: 750 },
      { from: 200_000, upTo: null, base: 750, rate: 0.25, maximum: 900 },
    ],
    source: CRA_T4127,
    retrieved: RETRIEVED,
    note: 'Factor V2, the Ontario Health Premium. Charged on taxable income and not reduced by factor S.',
  },
};
