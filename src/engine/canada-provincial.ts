/**
 * Provincial income tax.
 *
 * Pure, and province-agnostic: everything specific to a province arrives in
 * the parameter object. Provinces have no equivalent of the federal Canada
 * Employment Amount, so provincial credits are the basic personal amount plus
 * whatever payroll amounts the caller passes in.
 *
 * Order of operations, which Ontario makes load bearing:
 *
 * 1. Bracket tax, less credits at the lowest provincial rate.
 * 2. Surtax, charged on that tax rather than on income.
 * 3. Low-income reduction, applied to tax plus surtax.
 * 4. Health premium, added afterwards, because the reduction explicitly does
 *    not reduce it.
 *
 * Applying the reduction after the premium, or the surtax to income rather
 * than to tax, would both be wrong.
 */

import { taxFromBrackets } from './brackets.ts';
import { capAt, clampToZero, roundToCents } from './money.ts';
import type {
  HealthPremiumBand,
  ProvincialParameters,
  SurtaxTier,
  TaxReduction,
} from '../data/provinces/index.ts';

export interface ProvincialTaxInput {
  readonly taxableIncome: number;
  /**
   * Credit amounts from the payroll slice: the CPP base portion plus EI. The
   * provincial credit uses the same amounts as the federal one, at the lowest
   * provincial rate. T4127 formula K2P.
   */
  readonly additionalCreditAmounts?: number;
}

export interface ProvincialTaxBreakdown {
  readonly taxableIncome: number;
  readonly taxBeforeCredits: number;
  readonly basicPersonalAmount: number;
  readonly additionalCreditAmounts: number;
  readonly totalCreditAmounts: number;
  readonly creditValue: number;
  /** Tax after credits, before surtax, reduction or premium. */
  readonly taxAfterCredits: number;
  /** Surtax on that tax, zero where the province has none. */
  readonly surtax: number;
  /** The low-income tax reduction applied, zero where the province has none. */
  readonly taxReduction: number;
  /** Health premium, zero where the province has none. */
  readonly healthPremium: number;
  readonly taxPayable: number;
}

/**
 * The basic personal amount at a given income.
 *
 * Flat for most jurisdictions. Manitoba tapers its amount to nothing between
 * 200,000 and 400,000, and Yukon mirrors the federal taper down to a floor.
 */
export function provincialBasicPersonalAmount(
  income: number,
  parameters: ProvincialParameters,
): number {
  const maximum = parameters.basicPersonalAmount.value;
  const taper = parameters.basicPersonalAmountPhaseOut;
  if (!taper) {
    return maximum;
  }

  const start = taper.start.value;
  const end = taper.end.value;
  const minimum = taper.minimum.value;

  if (income <= start) {
    return maximum;
  }
  if (income >= end) {
    return minimum;
  }
  return minimum + (maximum - minimum) * ((end - income) / (end - start));
}

/** Surtax charged on provincial tax already payable. Tiers stack. */
export function surtaxOn(tax: number, tiers: readonly SurtaxTier[]): number {
  return tiers.reduce(
    (total, tier) => total + clampToZero(tax - tier.over) * tier.rate,
    0,
  );
}

/** Stepped health premium on taxable income. */
export function healthPremiumOn(
  taxableIncome: number,
  bands: readonly HealthPremiumBand[],
): number {
  const income = clampToZero(taxableIncome);
  for (const band of bands) {
    if (band.upTo === null || income <= band.upTo) {
      return capAt(band.base + (income - band.from) * band.rate, band.maximum);
    }
  }
  return 0;
}

/**
 * The low-income tax reduction available, before it is limited to tax payable.
 *
 * `phaseOut` shrinks a maximum as income rises. `doubleBase` is Ontario's
 * form: the lesser of the tax and twice a base amount less the tax, which
 * reaches zero once tax passes twice the base.
 */
export function taxReductionAmount(
  income: number,
  tax: number,
  reduction: TaxReduction,
): number {
  if (reduction.kind === 'doubleBase') {
    const base = reduction.baseAmount.value;
    return clampToZero(Math.min(tax, 2 * base - tax));
  }

  const maximum = reduction.maximumReduction.value;
  const start = reduction.phaseOutStart.value;
  const rate = reduction.phaseOutRate.value;

  if (income <= start) {
    return maximum;
  }
  return clampToZero(maximum - (income - start) * rate);
}

/** Provincial tax payable, with the breakdown the audit view renders. */
export function computeProvincialTax(
  input: ProvincialTaxInput,
  parameters: ProvincialParameters,
): ProvincialTaxBreakdown {
  const taxableIncome = clampToZero(input.taxableIncome);
  const taxBeforeCredits = taxFromBrackets(taxableIncome, parameters.brackets.value);

  const bpa = provincialBasicPersonalAmount(taxableIncome, parameters);
  const additional = clampToZero(input.additionalCreditAmounts ?? 0);

  const totalCreditAmounts = bpa + additional;
  const creditValue = totalCreditAmounts * parameters.creditRate.value;
  const taxAfterCredits = clampToZero(taxBeforeCredits - creditValue);

  const surtax = parameters.surtax
    ? surtaxOn(taxAfterCredits, parameters.surtax.value)
    : 0;

  const beforeReduction = taxAfterCredits + surtax;

  // The reduction cannot create a refund: it is limited to the tax payable.
  const available = parameters.taxReduction
    ? taxReductionAmount(taxableIncome, beforeReduction, parameters.taxReduction)
    : 0;
  const reduction = capAt(available, beforeReduction);

  const healthPremium = parameters.healthPremium
    ? healthPremiumOn(taxableIncome, parameters.healthPremium.value)
    : 0;

  return {
    taxableIncome,
    taxBeforeCredits: roundToCents(taxBeforeCredits),
    basicPersonalAmount: roundToCents(bpa),
    additionalCreditAmounts: roundToCents(additional),
    totalCreditAmounts: roundToCents(totalCreditAmounts),
    creditValue: roundToCents(creditValue),
    taxAfterCredits: roundToCents(taxAfterCredits),
    surtax: roundToCents(surtax),
    taxReduction: roundToCents(reduction),
    healthPremium: roundToCents(healthPremium),
    taxPayable: roundToCents(beforeReduction - reduction + healthPremium),
  };
}
