/**
 * Canadian payroll contribution parameters, tax year 2025.
 *
 * CPP, the second additional CPP contribution (CPP2), and EI.
 *
 * The tax treatment split is the same as 2026: of the 5.95% employee CPP rate,
 * the 4.95% base portion produces a non-refundable credit while the 1.00% first
 * additional portion is deducted from income. CPP2 is deducted in full. EI
 * produces a credit.
 *
 * Every value here comes from the 122nd edition of T4127, which publishes the
 * 2025 contribution tables (8.24 through 8.29) beside the 2026 ones.
 *
 * The shape lives in `types.ts`, shared with every other tax year.
 */

import type { PayrollParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const CANADA_PAYROLL_2025: PayrollParameters = {
  cpp: {
    maximumPensionableEarnings: {
      value: 71_300,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: "Table 8.24. Year's maximum pensionable earnings (YMPE), 71,343.40 before rounding.",
    },
    basicExemption: {
      value: 3_500,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.24. Annual basic exemption, unchanged since 2019.',
    },
    rate: {
      value: 0.0595,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.24, employee and employer rate. Maximum contributory earnings 67,800.',
    },
    baseRate: {
      value: 0.0495,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.25, creditable base portion. Maximum base contribution 3,356.10.',
    },
    firstAdditionalRate: {
      value: 0.01,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.26, deductible enhancement. Maximum deduction 678.00.',
    },
    maximumContribution: {
      value: 4_034.1,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.24, maximum annual employee contribution.',
    },
  },

  cpp2: {
    additionalMaximumPensionableEarnings: {
      value: 81_200,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: "Table 8.27. Year's additional maximum pensionable earnings (YAMPE).",
    },
    rate: {
      value: 0.04,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.27. Applies to the 9,900 between YMPE and YAMPE. Fully deductible.',
    },
    maximumContribution: {
      value: 396,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.27, maximum annual employee contribution.',
    },
  },

  ei: {
    maximumInsurableEarnings: {
      value: 65_700,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, Canada except Quebec.',
    },
    rate: {
      value: 0.0164,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, employee rate outside Quebec. Quebec has a reduced 1.31% rate, handled by the Quebec module.',
    },
    maximumPremium: {
      value: 1_077.48,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, maximum annual employee premium outside Quebec.',
    },
  },

  employer: {
    eiRate: {
      value: 0.02296,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28. Employers pay 1.4 times the employee rate. CPP and CPP2 are matched exactly.',
    },
    eiMaximumPremium: {
      value: 1_508.47,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, maximum annual employer premium outside Quebec.',
    },
  },
};
