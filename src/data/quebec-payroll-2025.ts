/**
 * Quebec payroll contribution parameters, tax year 2025.
 *
 * The same four structural differences as 2026:
 *
 * - QPP instead of CPP, at 6.40% rather than 5.95%, with a 5.40% base portion
 * - QPIP, which has no equivalent elsewhere in Canada
 * - a reduced EI rate of 1.31% rather than 1.64%, because QPIP covers part of
 *   what EI covers elsewhere
 * - QPP2, which is the one piece identical to the rest of the country
 *
 * Note that the QPP rate fell from 6.40% in 2025 to 6.30% in 2026, so Quebec's
 * payroll load moves in the opposite direction to the rest of Canada's.
 *
 * The shape lives in `types.ts`, shared with every other tax year.
 */

import type { PayrollParameters } from './types.ts';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const QUEBEC_PAYROLL_2025: PayrollParameters = {
  cpp: {
    maximumPensionableEarnings: {
      value: 71_300,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.24. QPP shares the YMPE with CPP.',
    },
    basicExemption: {
      value: 3_500,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.24, same exemption as CPP.',
    },
    rate: {
      value: 0.064,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.24, QPP employee rate. Higher than the 5.95% CPP rate, and reduced to 6.30% for 2026.',
    },
    baseRate: {
      value: 0.054,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.25, QPP base rate. Creditable portion, maximum 3,661.20.',
    },
    firstAdditionalRate: {
      value: 0.01,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.26, same as CPP. Deductible portion, maximum 678.00.',
    },
    maximumContribution: {
      value: 4_339.2,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.24, maximum annual employee QPP contribution.',
    },
  },

  cpp2: {
    additionalMaximumPensionableEarnings: {
      value: 81_200,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.27, identical to CPP2.',
    },
    rate: {
      value: 0.04,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.27, identical to CPP2.',
    },
    maximumContribution: {
      value: 396,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.27, identical to CPP2.',
    },
  },

  ei: {
    maximumInsurableEarnings: {
      value: 65_700,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, same insurable maximum as the rest of Canada.',
    },
    rate: {
      value: 0.0131,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, Quebec rate. Reduced because QPIP covers part of what EI covers elsewhere.',
    },
    maximumPremium: {
      value: 860.67,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, maximum annual employee premium in Quebec.',
    },
  },

  qpip: {
    maximumInsurableEarnings: {
      value: 98_000,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.29. A much higher ceiling than EI.',
    },
    rate: {
      value: 0.00494,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.29, employee rate.',
    },
    maximumPremium: {
      value: 484.12,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.29, maximum annual employee premium.',
    },
  },

  employer: {
    eiRate: {
      value: 0.01834,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, Quebec employer rate: 1.4 times the reduced employee rate.',
    },
    eiMaximumPremium: {
      value: 1_204.94,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.28, maximum annual employer premium in Quebec.',
    },
    qpipRate: {
      value: 0.00692,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.29, employer rate. Higher than the employee rate.',
    },
    qpipMaximumPremium: {
      value: 678.16,
      source: CRA_T4127_2026,
      retrieved: RETRIEVED,
      note: 'Table 8.29, maximum annual employer premium.',
    },
  },
};
