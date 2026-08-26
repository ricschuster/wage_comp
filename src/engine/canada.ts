/**
 * Canadian net employment income: federal tax, provincial tax and payroll
 * contributions composed into one result.
 *
 * Ordering matters and is not arbitrary:
 *
 * 1. Payroll contributions are computed on gross employment income.
 * 2. The deductible part of those contributions (the CPP enhancement and all
 *    of CPP2) reduces taxable income.
 * 3. Federal and provincial tax are computed on that reduced taxable income,
 *    each granting a credit for the creditable part (the CPP base portion and
 *    EI) at its own lowest rate.
 * 4. Net income is gross less both taxes and all contributions.
 *
 * Computing tax before the deduction, or granting the credit on the full
 * contribution, would overstate tax at every income above the exemption.
 */

import { computeFederalTax, type FederalTaxBreakdown } from './canada-federal.ts';
import { computePayroll, type PayrollBreakdown } from './canada-payroll.ts';
import {
  computeProvincialTax,
  type ProvincialTaxBreakdown,
} from './canada-provincial.ts';
import { clampToZero, roundToCents } from './money.ts';
import type { FederalParameters, PayrollParameters } from '../data/types.ts';
import type { ProvincialParameters } from '../data/provinces/index.ts';

export interface CanadaParameters {
  readonly federal: FederalParameters;
  readonly payroll: PayrollParameters;
  readonly province: ProvincialParameters;
}

export interface CanadaResult {
  readonly grossIncome: number;
  /** Gross less the deductible part of payroll contributions. */
  readonly taxableIncome: number;
  readonly payroll: PayrollBreakdown;
  readonly federal: FederalTaxBreakdown;
  /** Quebec abatement of federal tax, zero elsewhere. */
  readonly federalAbatement: number;
  /** Federal tax actually payable, after any abatement. */
  readonly federalTaxAfterAbatement: number;
  readonly provincial: ProvincialTaxBreakdown;
  readonly totalTax: number;
  /** Tax plus contributions. */
  readonly totalDeductions: number;
  readonly netIncome: number;
  /** Total deductions as a share of gross, zero at zero income. */
  readonly effectiveDeductionRate: number;
}

/** Net employment income in Canada for a single taxpayer. */
export function computeCanada(
  grossIncome: number,
  parameters: CanadaParameters,
): CanadaResult {
  const gross = clampToZero(grossIncome);
  const payroll = computePayroll(gross, parameters.payroll);

  const taxableIncome = clampToZero(gross - payroll.deductibleAmount);

  const federal = computeFederalTax(
    {
      taxableIncome,
      employmentIncome: gross,
      additionalCreditAmounts: payroll.creditableAmount,
    },
    parameters.federal,
  );

  const provincial = computeProvincialTax(
    {
      taxableIncome,
      employmentIncome: gross,
      additionalCreditAmounts: payroll.creditableAmount,
    },
    parameters.province,
  );

  // A Quebec resident's federal tax is reduced by the abatement, because
  // Quebec runs programs the federal government runs elsewhere. Omitting it
  // would overstate their total tax substantially.
  const abatementRate = parameters.province.federalAbatementRate?.value ?? 0;
  const federalAbatement = federal.taxPayable * abatementRate;
  const federalTaxAfterAbatement = federal.taxPayable - federalAbatement;

  const totalTax = federalTaxAfterAbatement + provincial.taxPayable;
  const totalDeductions = totalTax + payroll.totalContributions;

  return {
    grossIncome: gross,
    taxableIncome: roundToCents(taxableIncome),
    payroll,
    federal,
    federalAbatement: roundToCents(federalAbatement),
    federalTaxAfterAbatement: roundToCents(federalTaxAfterAbatement),
    provincial,
    totalTax: roundToCents(totalTax),
    totalDeductions: roundToCents(totalDeductions),
    netIncome: roundToCents(gross - totalDeductions),
    effectiveDeductionRate: gross > 0 ? totalDeductions / gross : 0,
  };
}
