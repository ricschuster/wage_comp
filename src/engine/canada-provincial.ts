/**
 * Provincial income tax.
 *
 * Pure, and province-agnostic: everything specific to a province arrives in
 * the parameter object. Provinces have no equivalent of the federal Canada
 * Employment Amount, so provincial credits are the basic personal amount plus
 * whatever payroll amounts the caller passes in.
 */

import { taxFromBrackets } from './brackets.ts';
import { clampToZero, roundToCents } from './money.ts';
import type { ProvincialParameters, TaxReduction } from '../data/provinces/index.ts';

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
  /** Tax after credits, before any low-income reduction. */
  readonly taxAfterCredits: number;
  /** The low-income tax reduction applied, zero where the province has none. */
  readonly taxReduction: number;
  readonly taxPayable: number;
}

/**
 * The low-income tax reduction at a given income, before it is limited to the
 * tax actually payable.
 *
 * Shrinks linearly above the phase-out start and floors at zero.
 */
export function taxReductionAmount(income: number, reduction: TaxReduction): number {
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

  const bpa = parameters.basicPersonalAmount.value;
  const additional = clampToZero(input.additionalCreditAmounts ?? 0);

  const totalCreditAmounts = bpa + additional;
  const creditValue = totalCreditAmounts * parameters.creditRate.value;
  const taxAfterCredits = clampToZero(taxBeforeCredits - creditValue);

  // The reduction cannot create a refund: it is limited to the tax payable.
  const available = parameters.taxReduction
    ? taxReductionAmount(taxableIncome, parameters.taxReduction)
    : 0;
  const reduction = available < taxAfterCredits ? available : taxAfterCredits;

  return {
    taxableIncome,
    taxBeforeCredits: roundToCents(taxBeforeCredits),
    basicPersonalAmount: roundToCents(bpa),
    additionalCreditAmounts: roundToCents(additional),
    totalCreditAmounts: roundToCents(totalCreditAmounts),
    creditValue: roundToCents(creditValue),
    taxAfterCredits: roundToCents(taxAfterCredits),
    taxReduction: roundToCents(reduction),
    taxPayable: roundToCents(taxAfterCredits - reduction),
  };
}
