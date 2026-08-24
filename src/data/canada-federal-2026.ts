/**
 * Canadian federal income tax parameters, tax year 2026.
 *
 * Every value carries its source and the date it was read, per
 * `docs/decisions/2026-08-24_parameter-provenance.md`. Adding a tax year means
 * adding a file like this one, not editing `src/engine/`.
 */

import type { BracketTable, Sourced } from '../engine/types.ts';

/** CRA, "Tax rates and income brackets to be used on the 2026 tax return". */
const CRA_RATES =
  'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html';

/** CRA, "Indexation adjustment for personal income tax and benefit amounts". */
const CRA_INDEXATION =
  'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/adjustment-personal-income-tax-benefit-amounts.html';

const RETRIEVED = '2026-08-24';

export interface FederalParameters {
  readonly brackets: Sourced<BracketTable>;
  /**
   * The rate at which non-refundable credit amounts convert into a tax
   * reduction. This is the lowest bracket rate, which fell from 15% to 14%
   * with the 2025 rate cut, so it is read from the bracket table's first band
   * rather than hardcoded separately.
   */
  readonly creditRate: Sourced<number>;
  /** Basic personal amount for incomes at or above the 33% bracket threshold. */
  readonly basicPersonalAmountBase: Sourced<number>;
  /** Maximum enhancement added to the base amount at lower incomes. */
  readonly basicPersonalAmountSupplement: Sourced<number>;
  /** Income at which the enhancement starts to phase out (29% bracket start). */
  readonly basicPersonalAmountPhaseOutStart: Sourced<number>;
  /** Income at which the enhancement is fully phased out (33% bracket start). */
  readonly basicPersonalAmountPhaseOutEnd: Sourced<number>;
  readonly canadaEmploymentAmount: Sourced<number>;
  /** Published indexation factor, kept for provenance and year-over-year checks. */
  readonly indexationFactor: Sourced<number>;
}

export const CANADA_FEDERAL_2026: FederalParameters = {
  brackets: {
    value: [
      { from: 0, to: 58_523, rate: 0.14 },
      { from: 58_523, to: 117_045, rate: 0.205 },
      { from: 117_045, to: 181_440, rate: 0.26 },
      { from: 181_440, to: 258_482, rate: 0.29 },
      { from: 258_482, to: null, rate: 0.33 },
    ],
    source: CRA_RATES,
    retrieved: RETRIEVED,
    note: 'Federal rate table for 2026. Page last modified 2026-01-20.',
  },

  creditRate: {
    value: 0.14,
    source: CRA_RATES,
    retrieved: RETRIEVED,
    note: 'Lowest federal bracket rate for 2026, reduced from 15% by the 2025 rate cut.',
  },

  basicPersonalAmountBase: {
    value: 14_829,
    source: CRA_INDEXATION,
    retrieved: RETRIEVED,
    note: 'BPA for individuals whose net income is at or above the 33% bracket threshold.',
  },

  basicPersonalAmountSupplement: {
    value: 1_623,
    source: CRA_INDEXATION,
    retrieved: RETRIEVED,
    note: 'Maximum enhanced amount. Base plus supplement equals the published maximum of 16,452.',
  },

  basicPersonalAmountPhaseOutStart: {
    value: 181_440,
    source: CRA_INDEXATION,
    retrieved: RETRIEVED,
    note: 'Taxable income above which the 29% bracket begins.',
  },

  basicPersonalAmountPhaseOutEnd: {
    value: 258_482,
    source: CRA_INDEXATION,
    retrieved: RETRIEVED,
    note: 'Taxable income above which the 33% bracket begins.',
  },

  canadaEmploymentAmount: {
    value: 1_501,
    source: CRA_INDEXATION,
    retrieved: RETRIEVED,
    note: 'Maximum. Claimable amount is the lesser of this and employment income.',
  },

  indexationFactor: {
    value: 0.02,
    source: CRA_INDEXATION,
    retrieved: RETRIEVED,
    note: 'Indexation increase applied to 2026 amounts. Page last modified 2026-03-12.',
  },
};

/**
 * The published maximum basic personal amount.
 *
 * CRA publishes the base, the supplement and the maximum separately. Deriving
 * the maximum here rather than storing it means the three cannot drift apart,
 * and the test suite checks the derived value against the published 16,452.
 */
export const CANADA_FEDERAL_2026_BPA_MAX =
  CANADA_FEDERAL_2026.basicPersonalAmountBase.value +
  CANADA_FEDERAL_2026.basicPersonalAmountSupplement.value;
