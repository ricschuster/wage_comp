/**
 * Canadian federal income tax parameters, tax year 2025.
 *
 * 2025 is the awkward year, because the lowest rate changed mid-year. The
 * Notice of Ways and Means Motion of 2025-05-27 cut it from 15% to 14%
 * effective 2025-07-01, so **the full-year rate for 2025 is 14.5%** and
 * payroll withholding used a prorated 14% for the second half. This file models
 * the annual return, so it carries 14.5% and ignores the proration.
 *
 * The values come from the 122nd edition of T4127, which publishes the final
 * 2025 rates, thresholds and constants alongside the 2026 ones (Tables 8.22 and
 * 8.23), and from the 120th edition for the basic personal amount formula.
 *
 * The shape lives in `types.ts`, shared with every other tax year.
 */

import type { FederalParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

/** CRA, "Payroll Deductions Formulas", 120th edition, effective 2025-01-01. */
const CRA_T4127_2025 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jan-120th-edition-effective-january-1-2025/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const CANADA_FEDERAL_2025: FederalParameters = {
  brackets: {
    value: [
      { from: 0, to: 57_375, rate: 0.145 },
      { from: 57_375, to: 114_750, rate: 0.205 },
      { from: 114_750, to: 177_882, rate: 0.26 },
      { from: 177_882, to: 253_414, rate: 0.29 },
      { from: 253_414, to: null, rate: 0.33 },
    ],
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.22, federal thresholds (A) and rates (R) for 2025. The 14.5% first rate is the full-year rate after the mid-year cut from 15% to 14%.',
  },

  creditRate: {
    value: 0.145,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Lowest federal bracket rate for 2025. Corroborated by the 121st edition, where K1 = 0.1450 x TC.',
  },

  basicPersonalAmountBase: {
    value: 14_538,
    source: CRA_T4127_2025,
    retrieved: RETRIEVED,
    note: 'BPAF formula: the amount for net income at or above 253,414.',
  },

  basicPersonalAmountSupplement: {
    value: 1_591,
    source: CRA_T4127_2025,
    retrieved: RETRIEVED,
    note: 'BPAF formula: the enhancement, published as 1,591 over a 75,532 span. Base plus supplement equals the published maximum of 16,129.',
  },

  basicPersonalAmountPhaseOutStart: {
    value: 177_882,
    source: CRA_T4127_2025,
    retrieved: RETRIEVED,
    note: 'Net income above which the enhancement tapers, equal to the 29% bracket threshold.',
  },

  basicPersonalAmountPhaseOutEnd: {
    value: 253_414,
    source: CRA_T4127_2025,
    retrieved: RETRIEVED,
    note: 'Net income at which the enhancement is exhausted, equal to the 33% bracket threshold.',
  },

  canadaEmploymentAmount: {
    value: 1_471,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, federal CEA for 2025. Claimable amount is the lesser of this and employment income.',
  },

  indexationFactor: {
    value: 0.027,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, federal index rate for 2025.',
  },
};

/**
 * The published maximum basic personal amount for 2025.
 *
 * Derived rather than stored, for the same reason as the 2026 equivalent: the
 * base, the supplement and the maximum are published separately and must not be
 * allowed to drift apart.
 */
export const CANADA_FEDERAL_2025_BPA_MAX =
  CANADA_FEDERAL_2025.basicPersonalAmountBase.value +
  CANADA_FEDERAL_2025.basicPersonalAmountSupplement.value;
