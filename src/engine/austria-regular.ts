/**
 * Austrian tax and social insurance on regular salary (laufende Bezüge).
 *
 * Regular salary is the 6/7 portion of annual gross. Special payments carry
 * their own rates, ceilings and tax bands and are handled separately.
 *
 * Ordering matters: social insurance is deducted before income tax is
 * computed, so the two cannot be evaluated independently.
 */

import { taxFromBrackets } from './brackets.ts';
import { capAt, clampToZero, roundToCents } from './money.ts';
import type {
  AustrianParameters,
  AustrianSocialInsurance,
  UnemploymentBand,
} from '../data/types.ts';

export interface RegularSocialInsuranceBreakdown {
  /** Monthly contribution basis after the ceiling. */
  readonly monthlyBasis: number;
  /** Annual basis actually charged, after the ceiling. */
  readonly annualBasis: number;
  readonly unemploymentRate: number;
  readonly totalRate: number;
  readonly contribution: number;
}

export interface AustriaRegularBreakdown {
  readonly regularGross: number;
  readonly socialInsurance: RegularSocialInsuranceBreakdown;
  readonly employmentExpenseAllowance: number;
  /** Gross less social insurance less the flat employment expense allowance. */
  readonly taxableIncome: number;
  readonly taxBeforeCredits: number;
  readonly commutingCredit: number;
  readonly commutingCreditSupplement: number;
  readonly totalCredits: number;
  /** Tax after credits, which may be negative before the refund rule applies. */
  readonly taxAfterCredits: number;
  /** Negative tax paid out under EStG 33(8), zero where it does not apply. */
  readonly socialInsuranceRefund: number;
  /** Final tax. Negative means a refund is due. */
  readonly incomeTax: number;
  readonly netIncome: number;
}

/**
 * Employee unemployment rate at a monthly contribution basis.
 *
 * Reduced at low pay under section 2a AMPFG. Bands resolve upward, matching
 * the "über X bis Y" wording of the published table.
 */
export function unemploymentRate(
  monthlyBasis: number,
  scale: readonly UnemploymentBand[],
): number {
  for (const band of scale) {
    if (band.upTo === null || monthlyBasis <= band.upTo) {
      return band.rate;
    }
  }
  return scale[scale.length - 1]?.rate ?? 0;
}

/** Employee social insurance on regular salary. */
export function regularSocialInsurance(
  regularGross: number,
  parameters: AustrianSocialInsurance,
): RegularSocialInsuranceBreakdown {
  const monthlyBasis = capAt(
    clampToZero(regularGross) / 12,
    parameters.monthlyCeiling.value,
  );
  const annualBasis = monthlyBasis * 12;

  const unemployment = unemploymentRate(
    monthlyBasis,
    parameters.unemploymentScale.value,
  );

  const totalRate =
    parameters.healthRate.value +
    parameters.pensionRate.value +
    parameters.chamberRate.value +
    parameters.housingRate.value +
    unemployment;

  return {
    monthlyBasis: roundToCents(monthlyBasis),
    annualBasis: roundToCents(annualBasis),
    unemploymentRate: unemployment,
    totalRate,
    contribution: roundToCents(annualBasis * totalRate),
  };
}

/**
 * The supplement to the commuting credit at a given taxable income.
 *
 * Phases evenly to zero across its range.
 */
export function commutingCreditSupplement(
  taxableIncome: number,
  parameters: AustrianParameters,
): number {
  const maximum = parameters.commutingCreditSupplement.value;
  const start = parameters.commutingCreditSupplementPhaseOutStart.value;
  const end = parameters.commutingCreditSupplementPhaseOutEnd.value;

  if (taxableIncome <= start) {
    return maximum;
  }
  if (taxableIncome >= end) {
    return 0;
  }
  return maximum * ((end - taxableIncome) / (end - start));
}

/**
 * Tax, social insurance and net pay on the regular salary portion.
 *
 * `additionalTaxableIncome` carries any special payment above the fixed-rate
 * ceiling, which EStG 67(10) taxes at the ordinary tariff alongside regular
 * pay. It is zero for every income the model is aimed at.
 */
export function computeAustriaRegular(
  regularGross: number,
  parameters: AustrianParameters,
  additionalTaxableIncome = 0,
): AustriaRegularBreakdown {
  const gross = clampToZero(regularGross);
  const socialInsurance = regularSocialInsurance(gross, parameters.socialInsurance);

  // The flat allowance may not create a loss from employment.
  const afterInsurance = clampToZero(gross - socialInsurance.contribution);
  const allowance = capAt(parameters.employmentExpenseAllowance.value, afterInsurance);
  const taxableIncome =
    afterInsurance - allowance + clampToZero(additionalTaxableIncome);

  const taxBeforeCredits = taxFromBrackets(taxableIncome, parameters.brackets.value);

  const credit = parameters.commutingCredit.value;
  const supplement = commutingCreditSupplement(taxableIncome, parameters);
  const totalCredits = credit + supplement;
  const taxAfterCredits = taxBeforeCredits - totalCredits;

  // EStG 33(8): where tax falls below zero, a share of social insurance is
  // refunded. This is a genuine negative tax, so it is not clamped to zero.
  let refund = 0;
  if (taxAfterCredits < 0) {
    const cap =
      parameters.socialInsuranceRefundMaximum.value +
      (supplement > 0 ? parameters.socialInsuranceRefundBonus.value : 0);
    refund = capAt(
      socialInsurance.contribution * parameters.socialInsuranceRefundRate.value,
      cap,
    );
  }

  const incomeTax = taxAfterCredits < 0 ? -refund : taxAfterCredits;

  return {
    regularGross: gross,
    socialInsurance,
    employmentExpenseAllowance: roundToCents(allowance),
    taxableIncome: roundToCents(taxableIncome),
    taxBeforeCredits: roundToCents(taxBeforeCredits),
    commutingCredit: roundToCents(credit),
    commutingCreditSupplement: roundToCents(supplement),
    totalCredits: roundToCents(totalCredits),
    taxAfterCredits: roundToCents(taxAfterCredits),
    socialInsuranceRefund: roundToCents(refund),
    incomeTax: roundToCents(incomeTax),
    netIncome: roundToCents(gross - socialInsurance.contribution - incomeTax),
  };
}
