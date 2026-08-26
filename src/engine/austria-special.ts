/**
 * Austrian special payments (sonstige Bezüge, the 13th and 14th salaries).
 *
 * Two rules govern this module, and both exist because the spreadsheet this
 * project replaces got them wrong:
 *
 * 1. Special payments are a SPLIT of annual gross, not an addition to it.
 *    Annual gross divides 6/7 regular and 1/7 special, which is 12 and 2 of
 *    14 payments. Adding two months on top of an annual figure would inflate
 *    Austrian compensation by roughly a sixth.
 * 2. Social insurance on special payments is a SEPARATE regime. It carries its
 *    own annual ceiling, and the chamber and housing levies are not charged on
 *    it at all, so the rate is lower than on regular pay.
 *
 * Both are enforced by tests, not by comment.
 */

import { taxFromBrackets } from './brackets.ts';
import { capAt, clampToZero, roundToCents } from './money.ts';
import type { AustrianParameters } from '../data/types.ts';
import { unemploymentRate } from './austria-regular.ts';

/** Regular salary is 12 of 14 payments. */
export const REGULAR_SHARE = 6 / 7;
/** Special payments are 2 of 14 payments. */
export const SPECIAL_SHARE = 1 / 7;

export interface SpecialSocialInsuranceBreakdown {
  /** Basis actually charged, after the separate annual ceiling. */
  readonly basis: number;
  readonly unemploymentRate: number;
  /**
   * Total employee rate on special payments. Lower than the regular rate
   * because the chamber and housing levies are not charged here.
   */
  readonly totalRate: number;
  readonly contribution: number;
}

export interface AustriaSpecialBreakdown {
  readonly specialGross: number;
  readonly socialInsurance: SpecialSocialInsuranceBreakdown;
  /** Special pay after its own social insurance, the base for the fixed rates. */
  readonly taxableAmount: number;
  /** True where the Jahressechstel is small enough that no fixed rate applies. */
  readonly belowExemptionLimit: boolean;
  /** Tax at the fixed bands, on the portion within the ceiling. */
  readonly taxAtFixedRates: number;
  /** Portion above the ceiling, taxed at the ordinary tariff instead. */
  readonly amountAboveCeiling: number;
  readonly incomeTax: number;
  readonly netIncome: number;
}

/**
 * Splits annual gross into its regular and special portions.
 *
 * The two always sum to the input exactly, which is the invariant that keeps
 * special payments from being double counted.
 */
export function splitAnnualGross(annualGross: number): {
  regular: number;
  special: number;
} {
  const gross = clampToZero(annualGross);
  const special = gross * SPECIAL_SHARE;
  // Derive regular by subtraction so the two provably sum to gross, rather
  // than computing both from shares and hoping the rounding agrees.
  return { regular: gross - special, special };
}

/**
 * Employee social insurance on special payments.
 *
 * The unemployment rate follows the same graduated scale as regular pay, using
 * the monthly regular basis to decide the band.
 */
export function specialSocialInsurance(
  specialGross: number,
  monthlyRegularBasis: number,
  parameters: AustrianParameters,
): SpecialSocialInsuranceBreakdown {
  const si = parameters.socialInsurance;

  const basis = capAt(
    clampToZero(specialGross),
    parameters.specialPaymentInsuranceCeiling.value,
  );
  const unemployment = unemploymentRate(
    monthlyRegularBasis,
    si.unemploymentScale.value,
  );

  // Chamber and housing levies are deliberately absent: the published ceiling
  // table shows no special-payment basis for either.
  const totalRate = si.healthRate.value + si.pensionRate.value + unemployment;

  return {
    basis: roundToCents(basis),
    unemploymentRate: unemployment,
    totalRate,
    contribution: roundToCents(basis * totalRate),
  };
}

/** Tax and social insurance on the special payment portion. */
export function computeAustriaSpecial(
  specialGross: number,
  monthlyRegularBasis: number,
  parameters: AustrianParameters,
): AustriaSpecialBreakdown {
  const gross = clampToZero(specialGross);
  const socialInsurance = specialSocialInsurance(
    gross,
    monthlyRegularBasis,
    parameters,
  );

  const taxableAmount = clampToZero(gross - socialInsurance.contribution);

  // Freigrenze: where the Jahressechstel is at or below the limit, the fixed
  // rates do not apply at all.
  const belowExemptionLimit = gross <= parameters.specialPaymentExemptionLimit.value;

  const ceiling = parameters.specialPaymentBandCeiling.value;
  const withinCeiling = capAt(taxableAmount, ceiling);
  const amountAboveCeiling = clampToZero(taxableAmount - ceiling);

  const taxAtFixedRates = belowExemptionLimit
    ? 0
    : taxFromBrackets(withinCeiling, parameters.specialPaymentBands.value);

  return {
    specialGross: gross,
    socialInsurance,
    taxableAmount: roundToCents(taxableAmount),
    belowExemptionLimit,
    taxAtFixedRates: roundToCents(taxAtFixedRates),
    amountAboveCeiling: roundToCents(amountAboveCeiling),
    incomeTax: roundToCents(taxAtFixedRates),
    netIncome: roundToCents(gross - socialInsurance.contribution - taxAtFixedRates),
  };
}
