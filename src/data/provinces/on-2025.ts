/**
 * Ontario income tax parameters, tax year 2025.
 *
 * The same three complications as 2026:
 *
 * - a two-tier surtax charged on provincial tax already payable, not on income
 * - a stepped health premium charged on taxable income, which the tax
 *   reduction explicitly does not reduce
 * - a low-income tax reduction shaped differently from British Columbia's
 *
 * The health premium bands are the one part that does not move between years:
 * they have not been indexed since they were introduced.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

/** CRA, "Payroll Deductions Formulas", 120th edition, effective 2025-01-01. */
const CRA_T4127_2025 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jan-120th-edition-effective-january-1-2025/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const ONTARIO_2025: ProvincialParameters = {
  code: 'ON',
  name: 'Ontario',

  brackets: {
    value: [
      { from: 0, to: 52_886, rate: 0.0505 },
      { from: 52_886, to: 105_775, rate: 0.0915 },
      { from: 105_775, to: 150_000, rate: 0.1116 },
      { from: 150_000, to: 220_000, rate: 0.1216 },
      { from: 220_000, to: null, rate: 0.1316 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, Ontario rates (V) and thresholds (A) for 2025.',
  },

  creditRate: {
    value: 0.0505,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Ontario bracket rate.',
  },

  basicPersonalAmount: {
    value: 12_747,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, Ontario basic amount for 2025. Indexed by 2.8%.',
  },

  taxReduction: {
    kind: 'doubleBase',
    baseAmount: {
      value: 294,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.23, factor S2 for 2025: the lesser of the tax and twice this amount less the tax. Dependant amounts of 544 each are not modelled, since the baseline has no dependants.',
    },
  },

  surtax: {
    value: [
      { over: 5_710, rate: 0.2 },
      { over: 7_307, rate: 0.36 },
    ],
    source: CRA_T4127_2025,
    retrieved: RETRIEVED,
    note: 'Factor V1. The tiers stack, so tax above 7,307 attracts both, an effective 56%.',
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
    source: CRA_T4127_2025,
    retrieved: RETRIEVED,
    note: 'Factor V2, the Ontario Health Premium. Not indexed, so identical to 2026. Charged on taxable income and not reduced by factor S.',
  },
};
