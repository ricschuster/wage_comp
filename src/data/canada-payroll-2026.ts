/**
 * Canadian payroll contribution parameters, tax year 2026.
 *
 * CPP, the second additional CPP contribution (CPP2), and EI.
 *
 * The tax treatment split matters and is not cosmetic. Of the 5.95% employee
 * CPP rate, the 4.95% base portion produces a non-refundable credit while the
 * 1.00% first additional portion is deducted from income. CPP2 is deducted in
 * full. EI produces a credit. See T4127 formulas F5 and K2.
 */

import type { Sourced } from '../engine/types.ts';

/** CRA, "CPP contribution rates, maximums and exemptions". */
const CRA_CPP =
  'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html';

/** CRA, "Second additional CPP contribution (CPP2) rates and maximums". */
const CRA_CPP2 =
  'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/calculating-deductions/making-deductions/second-additional-cpp-contribution-rates-maximums.html';

/** CRA, "EI premium rates and maximums". */
const CRA_EI =
  'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-24';

export interface CppParameters {
  readonly maximumPensionableEarnings: Sourced<number>;
  readonly basicExemption: Sourced<number>;
  /** Total employee rate: base plus first additional. */
  readonly rate: Sourced<number>;
  /** Base portion, which produces a non-refundable credit. */
  readonly baseRate: Sourced<number>;
  /** First additional portion, which is deducted from income. */
  readonly firstAdditionalRate: Sourced<number>;
  readonly maximumContribution: Sourced<number>;
}

export interface Cpp2Parameters {
  /** Year's additional maximum pensionable earnings. */
  readonly additionalMaximumPensionableEarnings: Sourced<number>;
  readonly rate: Sourced<number>;
  readonly maximumContribution: Sourced<number>;
}

export interface EiParameters {
  readonly maximumInsurableEarnings: Sourced<number>;
  readonly rate: Sourced<number>;
  readonly maximumPremium: Sourced<number>;
}

export interface PayrollParameters {
  readonly cpp: CppParameters;
  readonly cpp2: Cpp2Parameters;
  readonly ei: EiParameters;
}

export const CANADA_PAYROLL_2026: PayrollParameters = {
  cpp: {
    maximumPensionableEarnings: {
      value: 74_600,
      source: CRA_CPP,
      retrieved: RETRIEVED,
      note: "Year's maximum pensionable earnings (YMPE).",
    },
    basicExemption: {
      value: 3_500,
      source: CRA_CPP,
      retrieved: RETRIEVED,
      note: 'Annual basic exemption, unchanged since 2019.',
    },
    rate: {
      value: 0.0595,
      source: CRA_CPP,
      retrieved: RETRIEVED,
      note: 'Employee and employer rate. Maximum contributory earnings 71,100.',
    },
    baseRate: {
      value: 0.0495,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Creditable base portion, per formula K2. Announced to fall to 4.75% for 2027.',
    },
    firstAdditionalRate: {
      value: 0.01,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Deductible enhancement, per formula F5. Maximum deduction 711.00.',
    },
    maximumContribution: {
      value: 4_230.45,
      source: CRA_CPP,
      retrieved: RETRIEVED,
      note: 'Maximum annual employee contribution.',
    },
  },

  cpp2: {
    additionalMaximumPensionableEarnings: {
      value: 85_000,
      source: CRA_CPP2,
      retrieved: RETRIEVED,
      note: "Year's additional maximum pensionable earnings (YAMPE).",
    },
    rate: {
      value: 0.04,
      source: CRA_CPP2,
      retrieved: RETRIEVED,
      note: 'Applies to earnings between YMPE and YAMPE. Fully deductible.',
    },
    maximumContribution: {
      value: 416,
      source: CRA_CPP2,
      retrieved: RETRIEVED,
      note: 'Maximum annual employee contribution.',
    },
  },

  ei: {
    maximumInsurableEarnings: {
      value: 68_900,
      source: CRA_EI,
      retrieved: RETRIEVED,
      note: 'Federal table, outside Quebec.',
    },
    rate: {
      value: 0.0163,
      source: CRA_EI,
      retrieved: RETRIEVED,
      note: 'Federal employee rate. Quebec has a reduced 1.30% rate, handled by the Quebec module.',
    },
    maximumPremium: {
      value: 1_123.07,
      source: CRA_EI,
      retrieved: RETRIEVED,
      note: 'Maximum annual employee premium, federal table.',
    },
  },
};
