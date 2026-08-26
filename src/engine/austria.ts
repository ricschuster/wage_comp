/**
 * Austrian net employment income: regular salary and special payments
 * composed into one annual result.
 *
 * The composition is where the 6/7 and 1/7 split lives. Every figure below
 * derives from a single annual gross, so special payments can never be added
 * on top of it.
 */

import {
  computeAustriaRegular,
  type AustriaRegularBreakdown,
} from './austria-regular.ts';
import {
  computeAustriaSpecial,
  splitAnnualGross,
  type AustriaSpecialBreakdown,
} from './austria-special.ts';
import { clampToZero, roundToCents } from './money.ts';
import type { AustrianParameters } from '../data/types.ts';

export interface AustriaOptions {
  /**
   * Whether annual gross is paid over 14 instalments, two of which are taxed
   * as special payments.
   *
   * Turning this off treats the whole amount as regular salary. That is not
   * the Austrian norm; it exists so the effect of the special payment regime
   * is visible rather than assumed.
   */
  readonly specialPayments: boolean;
}

export interface AustriaResult {
  readonly grossIncome: number;
  readonly regularGross: number;
  readonly specialGross: number;
  readonly regular: AustriaRegularBreakdown;
  /** Absent when special payments are turned off. */
  readonly special: AustriaSpecialBreakdown | null;
  readonly totalSocialInsurance: number;
  readonly totalTax: number;
  readonly totalDeductions: number;
  readonly netIncome: number;
  readonly effectiveDeductionRate: number;
}

/** Net employment income in Austria for a single employee. */
export function computeAustria(
  annualGross: number,
  parameters: AustrianParameters,
  options: AustriaOptions = { specialPayments: true },
): AustriaResult {
  const gross = clampToZero(annualGross);

  const { regular: regularGross, special: specialGross } = options.specialPayments
    ? splitAnnualGross(gross)
    : { regular: gross, special: 0 };

  // The unemployment band is set by monthly regular pay, and the special
  // payment follows whatever band that lands in.
  const monthlyRegularBasis = regularGross / 12;

  const special = options.specialPayments
    ? computeAustriaSpecial(specialGross, monthlyRegularBasis, parameters)
    : null;

  const regular = computeAustriaRegular(
    regularGross,
    parameters,
    special?.amountAboveCeiling ?? 0,
  );

  const totalSocialInsurance =
    regular.socialInsurance.contribution + (special?.socialInsurance.contribution ?? 0);
  const totalTax = regular.incomeTax + (special?.incomeTax ?? 0);
  const totalDeductions = totalSocialInsurance + totalTax;

  return {
    grossIncome: gross,
    regularGross: roundToCents(regularGross),
    specialGross: roundToCents(specialGross),
    regular,
    special,
    totalSocialInsurance: roundToCents(totalSocialInsurance),
    totalTax: roundToCents(totalTax),
    totalDeductions: roundToCents(totalDeductions),
    netIncome: roundToCents(gross - totalDeductions),
    effectiveDeductionRate: gross > 0 ? totalDeductions / gross : 0,
  };
}
