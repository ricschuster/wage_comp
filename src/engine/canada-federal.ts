/**
 * Canadian federal income tax.
 *
 * Pure. No React, and no tax values inline: everything comes from the
 * parameter object passed in, so a new tax year is a new parameter file.
 */

import { taxFromBrackets } from './brackets.ts';
import { clampToZero, roundToCents } from './money.ts';
import type { FederalParameters } from '../data/types.ts';

export interface FederalTaxInput {
  /** Income subject to federal tax, after any deductions. */
  readonly taxableIncome: number;
  /** Employment income, which caps the Canada Employment Amount. */
  readonly employmentIncome: number;
  /**
   * Credit amounts from other slices, notably CPP, CPP2 and EI contributions.
   * Passed in rather than computed here so the payroll slice owns its own
   * rules. These are amounts, not tax reductions: they are multiplied by the
   * credit rate along with the rest.
   */
  readonly additionalCreditAmounts?: number;
}

export interface FederalTaxBreakdown {
  readonly taxableIncome: number;
  /** Tax from the bracket table, before any non-refundable credits. */
  readonly taxBeforeCredits: number;
  readonly basicPersonalAmount: number;
  readonly canadaEmploymentAmount: number;
  readonly additionalCreditAmounts: number;
  /** Sum of the credit amounts above. */
  readonly totalCreditAmounts: number;
  /** The tax reduction those amounts produce, at the credit rate. */
  readonly creditValue: number;
  /** Tax after credits, floored at zero. */
  readonly taxPayable: number;
}

/**
 * The basic personal amount at a given net income.
 *
 * The enhancement phases out linearly between the 29% and 33% bracket
 * thresholds, so the amount runs from base plus supplement down to base.
 */
export function basicPersonalAmount(
  netIncome: number,
  parameters: FederalParameters,
): number {
  const base = parameters.basicPersonalAmountBase.value;
  const supplement = parameters.basicPersonalAmountSupplement.value;
  const start = parameters.basicPersonalAmountPhaseOutStart.value;
  const end = parameters.basicPersonalAmountPhaseOutEnd.value;

  if (netIncome <= start) {
    return base + supplement;
  }
  if (netIncome >= end) {
    return base;
  }

  const remaining = (end - netIncome) / (end - start);
  return base + supplement * remaining;
}

/** The claimable Canada Employment Amount: the lesser of the cap and employment income. */
export function canadaEmploymentAmount(
  employmentIncome: number,
  parameters: FederalParameters,
): number {
  const cap = parameters.canadaEmploymentAmount.value;
  const eligible = clampToZero(employmentIncome);
  return eligible < cap ? eligible : cap;
}

/** Federal tax payable, with the breakdown the audit view renders. */
export function computeFederalTax(
  input: FederalTaxInput,
  parameters: FederalParameters,
): FederalTaxBreakdown {
  const taxableIncome = clampToZero(input.taxableIncome);
  const taxBeforeCredits = taxFromBrackets(taxableIncome, parameters.brackets.value);

  const bpa = basicPersonalAmount(taxableIncome, parameters);
  const cea = canadaEmploymentAmount(input.employmentIncome, parameters);
  const additional = clampToZero(input.additionalCreditAmounts ?? 0);

  const totalCreditAmounts = bpa + cea + additional;
  const creditValue = totalCreditAmounts * parameters.creditRate.value;
  const taxPayable = clampToZero(taxBeforeCredits - creditValue);

  return {
    taxableIncome,
    taxBeforeCredits: roundToCents(taxBeforeCredits),
    basicPersonalAmount: roundToCents(bpa),
    canadaEmploymentAmount: roundToCents(cea),
    additionalCreditAmounts: roundToCents(additional),
    totalCreditAmounts: roundToCents(totalCreditAmounts),
    creditValue: roundToCents(creditValue),
    taxPayable: roundToCents(taxPayable),
  };
}
