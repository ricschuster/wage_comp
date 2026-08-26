/**
 * Quebec income tax parameters, tax year 2025.
 *
 * The same four structural differences from every other jurisdiction as in
 * 2026:
 *
 * 1. **QPP instead of CPP**, and **QPIP**. Those live in
 *    `quebec-payroll-2025.ts`, and note the QPP rate was 6.40% in 2025 against
 *    6.30% in 2026.
 * 2. **The federal abatement.** A Quebec resident's federal tax is reduced by
 *    16.5%.
 * 3. **The deduction for workers.** 6% of employment income up to 1,420 in
 *    2025, deducted from Quebec taxable income. It replaces the contribution
 *    credits the rest of Canada grants, which is why Revenu Québec's own
 *    formula has no QPP, EI or QPIP credit term.
 * 4. **Its own tax administration.** These rates come from Revenu Québec and
 *    the Ministère des Finances, not from CRA.
 */

import type { ProvincialParameters } from './types.ts';

/** Revenu Québec, "Income tax rates", which publishes 2025 beside 2026. */
const RQ_RATES =
  'https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/';

/** Revenu Québec, TP-1015.F-V, "Formulas to Calculate Source Deductions", 2025-01. */
const RQ_FORMULAS =
  'https://www.revenuquebec.ca/documents/en/formulaires/tp/TP-1015.F-V(2025-01).pdf';

/**
 * Ministère des Finances du Québec, "Parameters of the Personal Income Tax
 * System for 2026", whose Table 3 carries the 2025 column beside the 2026 one.
 */
const MFQ_PARAMETERS =
  'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTEN_IncomeTax2026.pdf';

/** CRA, "Payroll Deductions Formulas", 122nd edition, effective 2026-01-01. */
const CRA_T4127_2026 =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html';

const RETRIEVED = '2026-08-25';

export const QUEBEC_2025: ProvincialParameters = {
  code: 'QC',
  name: 'Quebec',

  brackets: {
    value: [
      { from: 0, to: 53_255, rate: 0.14 },
      { from: 53_255, to: 106_495, rate: 0.19 },
      { from: 106_495, to: 129_590, rate: 0.24 },
      { from: 129_590, to: null, rate: 0.2575 },
    ],
    source: RQ_RATES,
    retrieved: RETRIEVED,
    note: 'Income tax rates for 2025. Thresholds corroborated by the Ministère des Finances parameter tables, Table 3.',
  },

  creditRate: {
    value: 0.14,
    source: RQ_RATES,
    retrieved: RETRIEVED,
    note: 'Personal credits convert at 14%, which is also the lowest bracket rate.',
  },

  basicPersonalAmount: {
    value: 18_571,
    source: MFQ_PARAMETERS,
    retrieved: RETRIEVED,
    note: 'Table 3, 2025 column. Indexed by 2.05% to 18,952 for 2026. The largest personal amount in Canada.',
  },

  // Revenu Québec's own annual formula has no QPP, EI or QPIP credit term:
  // the deduction for workers replaced them. Granting both would double count.
  grantsContributionCredits: false,

  workerDeduction: {
    rate: {
      value: 0.06,
      source: RQ_FORMULAS,
      retrieved: RETRIEVED,
      note: 'Factor H: 6% of employment income, deducted from Quebec taxable income.',
    },
    maximum: {
      value: 1_420,
      source: MFQ_PARAMETERS,
      retrieved: RETRIEVED,
      note: 'Table 3, 2025 column, maximum amount of the deduction for workers.',
    },
  },

  federalAbatementRate: {
    value: 0.165,
    source: CRA_T4127_2026,
    retrieved: RETRIEVED,
    note: 'Table 8.23, Quebec abatement for 2025. Federal tax for a Quebec resident is reduced by this.',
  },
};
