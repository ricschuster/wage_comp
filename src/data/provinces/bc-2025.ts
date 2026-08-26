/**
 * British Columbia income tax parameters, tax year 2025.
 *
 * Bracket thresholds were indexed by BC CPI of 2.8% for 2025, the last full
 * indexation before the 2026 amounts. The tax reduction credit shrinks from a
 * fixed maximum as income rises, which is BC's own shape and not Ontario's.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

/** CRA, "Payroll Deductions Formulas", 120th edition, effective 2025-01-01. */
const CRA_T4127_2025 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jan-120th-edition-effective-january-1-2025/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const BRITISH_COLUMBIA_2025: ProvincialParameters = {
  code: 'BC',
  name: 'British Columbia',

  brackets: {
    value: [
      { from: 0, to: 49_279, rate: 0.0506 },
      { from: 49_279, to: 98_560, rate: 0.077 },
      { from: 98_560, to: 113_158, rate: 0.105 },
      { from: 113_158, to: 137_407, rate: 0.1229 },
      { from: 137_407, to: 186_306, rate: 0.147 },
      { from: 186_306, to: 259_829, rate: 0.168 },
      { from: 259_829, to: null, rate: 0.205 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, British Columbia rates (V) and thresholds (A) for 2025.',
  },

  creditRate: {
    value: 0.0506,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest British Columbia bracket rate.',
  },

  basicPersonalAmount: {
    value: 12_932,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, British Columbia basic amount for 2025. Indexed by 2.8%.',
  },

  taxReduction: {
    kind: 'phaseOut',
    maximumReduction: {
      value: 562,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.23, factor S2 for 2025.',
    },
    phaseOutStart: {
      value: 25_020,
      source: CRA_T4127_2025,
      retrieved: RETRIEVED,
      note: 'Factor S: income above which the reduction shrinks.',
    },
    phaseOutRate: {
      value: 0.0356,
      source: CRA_T4127_2025,
      retrieved: RETRIEVED,
      note: 'Factor S. The reduction reaches zero at 40,807, which is 25,020 plus 562 divided by this rate.',
    },
  },
};
