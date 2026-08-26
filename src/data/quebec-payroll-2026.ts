/**
 * Quebec payroll contribution parameters, tax year 2026.
 *
 * Quebec runs its own plans, so almost nothing here matches the rest of the
 * country:
 *
 * - QPP instead of CPP, at 6.30% rather than 5.95%, with a 5.30% base portion
 * - QPIP, which has no equivalent elsewhere in Canada
 * - a reduced EI rate of 1.30% rather than 1.63%, because QPIP covers part of
 *   what EI covers elsewhere
 *
 * QPP2 is the one piece that is identical to the rest of the country.
 */

import type { PayrollParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const QUEBEC_PAYROLL_2026: PayrollParameters = {
  cpp: {
    maximumPensionableEarnings: {
      value: 74_600,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.3. QPP shares the YMPE with CPP.',
    },
    basicExemption: {
      value: 3_500,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.3, same exemption as CPP.',
    },
    rate: {
      value: 0.063,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.3, QPP employee rate. Higher than the 5.95% CPP rate.',
    },
    baseRate: {
      value: 0.053,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.4, QPP base rate. Creditable portion.',
    },
    firstAdditionalRate: {
      value: 0.01,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.5, same as CPP. Deductible portion.',
    },
    maximumContribution: {
      value: 4_479.3,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.3, maximum annual employee QPP contribution.',
    },
  },

  cpp2: {
    additionalMaximumPensionableEarnings: {
      value: 85_000,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.6, identical to CPP2.',
    },
    rate: {
      value: 0.04,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.6, identical to CPP2.',
    },
    maximumContribution: {
      value: 416,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.6, identical to CPP2.',
    },
  },

  ei: {
    maximumInsurableEarnings: {
      value: 68_900,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.7, same insurable maximum as the rest of Canada.',
    },
    rate: {
      value: 0.013,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.7, Quebec rate. Reduced because QPIP covers part of what EI covers elsewhere.',
    },
    maximumPremium: {
      value: 895.7,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.7, maximum annual employee premium in Quebec.',
    },
  },

  qpip: {
    maximumInsurableEarnings: {
      value: 103_000,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.8. A much higher ceiling than EI.',
    },
    rate: {
      value: 0.0043,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.8, employee rate.',
    },
    maximumPremium: {
      value: 442.9,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.8, maximum annual employee premium.',
    },
  },

  employer: {
    eiRate: {
      value: 0.0182,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.7, Quebec employer rate: 1.4 times the reduced employee rate.',
    },
    eiMaximumPremium: {
      value: 1_253.98,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.7, maximum annual employer premium in Quebec.',
    },
    qpipRate: {
      value: 0.00602,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.8, employer rate. Higher than the employee rate.',
    },
    qpipMaximumPremium: {
      value: 620.06,
      source: CRA_T4127,
      retrieved: RETRIEVED,
      note: 'Table 8.8, maximum annual employer premium.',
    },
  },
};
