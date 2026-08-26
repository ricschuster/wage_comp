/**
 * Manitoba income tax parameters, tax year 2025.
 *
 * 2025 is the year Manitoba stopped indexing. The province had already
 * published an indexed basic personal amount of 15,969 and indexed thresholds
 * when the budget of 2025-03-20 froze both for 2025 and subsequent years, so
 * the annual amount reverts to 15,780 and the thresholds stay at 47,000 and
 * 100,000. Payroll withholding used a prorated 15,591 for the second half of
 * the year to work off the over-claim; this file models the annual return, so
 * it carries 15,780.
 *
 * Manitoba is one of only two jurisdictions whose basic personal amount is
 * income-tested, and its taper reaches zero rather than a floor.
 */

import type { ProvincialParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

/** CRA, "Payroll Deductions Formulas", 121st edition, effective 2025-07-01. */
const CRA_T4127_2025_JUL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jul-121st-edition-effective-july-1-2025/t4127-jul-payroll-deductions-formulas.html';

const RETRIEVED = '2026-08-25';

export const MANITOBA_2025: ProvincialParameters = {
  code: 'MB',
  name: 'Manitoba',

  brackets: {
    value: [
      { from: 0, to: 47_000, rate: 0.108 },
      { from: 47_000, to: 100_000, rate: 0.1275 },
      { from: 100_000, to: null, rate: 0.174 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, Manitoba rates (V) and thresholds (A) for 2025. Unchanged for 2026 because indexation is paused.',
  },

  creditRate: {
    value: 0.108,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest Manitoba bracket rate.',
  },

  basicPersonalAmount: {
    value: 15_780,
    source: CRA_T4127_2025_JUL,
    retrieved: RETRIEVED,
    note: 'Stated directly: "The BPAMB for 2025 is $15,780." The indexed 15,969 used until June was withdrawn by the 2025-03-20 budget.',
  },

  basicPersonalAmountPhaseOut: {
    minimum: {
      value: 0,
      source: CRA_T4127_2025_JUL,
      retrieved: RETRIEVED,
      note: 'BPAMB is zero at and above 400,000, unlike the federal taper which stops at a floor.',
    },
    start: {
      value: 200_000,
      source: CRA_T4127_2025_JUL,
      retrieved: RETRIEVED,
      note: 'Net income above which BPAMB starts to taper.',
    },
    end: {
      value: 400_000,
      source: CRA_T4127_2025_JUL,
      retrieved: RETRIEVED,
      note: 'Net income at which BPAMB reaches zero.',
    },
  },
};
