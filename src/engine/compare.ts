/**
 * The comparison layer: one gross income, both countries, a common yardstick.
 *
 * How a comparison is framed here, because it is easy to frame it wrongly:
 *
 * - The input is a gross income in Canadian dollars.
 * - The Austrian gross is that amount converted to euro at the chosen rate,
 *   so both sides represent the same real starting compensation rather than
 *   the same nominal number in two different currencies.
 * - Each country's net is computed under its own rules.
 * - Both nets are expressed in Canadian dollars at the same rate, so the ratio
 *   is a like-for-like comparison of what the money buys.
 *
 * Every basis reduces to a single rate in Canadian dollars per euro, so the
 * arithmetic is identical whichever is chosen. Only the rate differs.
 *
 * What this does NOT do: correct for the fact that the same person is not
 * offered the same gross in both countries. That is what the equivalence
 * solver is for.
 */

import { computeAustria, type AustriaOptions, type AustriaResult } from './austria.ts';
import { computeCanada, type CanadaParameters, type CanadaResult } from './canada.ts';
import {
  austriaEmployerCost,
  canadaEmployerCost,
  type EmployerCost,
} from './employer.ts';
import { roundToCents } from './money.ts';
import type {
  AustrianParameters,
  ComparisonBasis,
  ConversionParameters,
  PppBasis,
} from '../data/types.ts';
import type { Sourced } from './types.ts';

export interface ComparisonOptions {
  readonly basis: ComparisonBasis;
  readonly pppBasis: PppBasis;
  readonly specialPayments: boolean;
}

export const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
};

export interface ComparisonParameters {
  readonly canada: CanadaParameters;
  readonly austria: AustrianParameters;
  readonly conversion: ConversionParameters;
}

/** One step of the calculation, for the audit view to render. */
export interface TraceEntry {
  readonly label: string;
  /** Human-readable formula, with the numbers substituted in. */
  readonly formula: string;
  readonly value: number;
  /** Parameters the step relied on, each carrying its own citation. */
  readonly sources: readonly Sourced<number>[];
}

export interface ComparisonResult {
  readonly grossIncomeCad: number;
  readonly grossIncomeEur: number;
  /** Canadian dollars per euro under the chosen basis. */
  readonly rate: number;
  readonly basis: ComparisonBasis;
  /** The PPP basis actually used, or null when comparing on FX. */
  readonly pppBasis: PppBasis | null;
  /** Reference year of the PPP factors, or null when comparing on FX. */
  readonly referenceYear: number | null;
  readonly canada: CanadaResult;
  readonly austria: AustriaResult;
  /** Canadian net, in Canadian dollars. */
  readonly canadaNetCommon: number;
  /** Austrian net converted to Canadian dollars at the chosen rate. */
  readonly austriaNetCommon: number;
  /**
   * Austria divided by Canada. Above 1 the Austrian position is ahead, below 1
   * the Canadian position is ahead.
   */
  readonly ratio: number;
  readonly canadaEffectiveRate: number;
  readonly austriaEffectiveRate: number;
  /** What the job costs the employer, not what the employee receives. */
  readonly canadaEmployer: EmployerCost;
  readonly austriaEmployer: EmployerCost;
  /** Austrian employer cost converted to Canadian dollars. */
  readonly austriaEmployerCostCommon: number;
  readonly trace: readonly TraceEntry[];
}

/**
 * The conversion rate in Canadian dollars per euro, under a given basis.
 *
 * For PPP this is the ratio of the two countries' conversion factors: the
 * exchange rate at which a basket costs the same in both places.
 */
export function conversionRate(
  options: Pick<ComparisonOptions, 'basis' | 'pppBasis'>,
  conversion: ConversionParameters,
): { rate: number; sources: Sourced<number>[]; referenceYear: number | null } {
  if (options.basis === 'fx') {
    return {
      rate: conversion.exchangeRate.value,
      sources: [conversion.exchangeRate],
      referenceYear: null,
    };
  }

  const pair = options.pppBasis === 'gdp' ? conversion.gdpPpp : conversion.householdPpp;

  return {
    rate: pair.canada.value / pair.austria.value,
    sources: [pair.canada, pair.austria],
    referenceYear: pair.referenceYear,
  };
}

/** Compare one gross income across both countries. */
export function compare(
  grossIncomeCad: number,
  parameters: ComparisonParameters,
  options: ComparisonOptions = DEFAULT_COMPARISON_OPTIONS,
): ComparisonResult {
  const { rate, sources, referenceYear } = conversionRate(
    options,
    parameters.conversion,
  );

  const grossIncomeEur = grossIncomeCad / rate;

  const canada = computeCanada(grossIncomeCad, parameters.canada);
  const austriaOptions: AustriaOptions = { specialPayments: options.specialPayments };
  const austria = computeAustria(grossIncomeEur, parameters.austria, austriaOptions);

  const canadaEmployer = canadaEmployerCost(grossIncomeCad, parameters.canada.payroll);
  const austriaEmployer = austriaEmployerCost(grossIncomeEur, parameters.austria, {
    specialPayments: options.specialPayments,
  });

  const canadaNetCommon = canada.netIncome;
  const austriaNetCommon = austria.netIncome * rate;
  const ratio = canadaNetCommon > 0 ? austriaNetCommon / canadaNetCommon : 0;

  const basisLabel =
    options.basis === 'fx'
      ? 'market exchange rate'
      : `${options.pppBasis === 'gdp' ? 'GDP' : 'household consumption'} PPP, ${referenceYear}`;

  const trace: TraceEntry[] = [
    {
      label: 'Conversion rate',
      formula:
        options.basis === 'fx'
          ? `ECB reference rate = ${rate.toFixed(4)} CAD per EUR`
          : `${(sources[0]?.value ?? 0).toFixed(6)} / ${(sources[1]?.value ?? 0).toFixed(6)} = ${rate.toFixed(4)} CAD per EUR`,
      value: rate,
      sources,
    },
    {
      label: 'Austrian gross',
      formula: `${grossIncomeCad.toFixed(2)} CAD / ${rate.toFixed(4)} = ${grossIncomeEur.toFixed(2)} EUR`,
      value: roundToCents(grossIncomeEur),
      sources,
    },
    {
      label: 'Austrian net in Canadian dollars',
      formula: `${austria.netIncome.toFixed(2)} EUR x ${rate.toFixed(4)} = ${austriaNetCommon.toFixed(2)} CAD`,
      value: roundToCents(austriaNetCommon),
      sources,
    },
    {
      label: `Ratio on ${basisLabel}`,
      formula: `${austriaNetCommon.toFixed(2)} / ${canadaNetCommon.toFixed(2)} = ${ratio.toFixed(4)}`,
      value: ratio,
      sources,
    },
  ];

  return {
    grossIncomeCad: roundToCents(grossIncomeCad),
    grossIncomeEur: roundToCents(grossIncomeEur),
    rate,
    basis: options.basis,
    pppBasis: options.basis === 'ppp' ? options.pppBasis : null,
    referenceYear,
    canada,
    austria,
    canadaNetCommon: roundToCents(canadaNetCommon),
    austriaNetCommon: roundToCents(austriaNetCommon),
    ratio,
    canadaEffectiveRate: canada.effectiveDeductionRate,
    austriaEffectiveRate: austria.effectiveDeductionRate,
    canadaEmployer,
    austriaEmployer,
    austriaEmployerCostCommon: roundToCents(austriaEmployer.totalCost * rate),
    trace,
  };
}

/** Compare across a range of incomes, for the table and the charts. */
export function compareRange(
  start: number,
  end: number,
  increment: number,
  parameters: ComparisonParameters,
  options: ComparisonOptions = DEFAULT_COMPARISON_OPTIONS,
): ComparisonResult[] {
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(increment)) {
    throw new RangeError('compareRange expects finite bounds');
  }
  if (increment <= 0) {
    throw new RangeError(`compareRange needs a positive increment, got ${increment}`);
  }
  if (end < start) {
    throw new RangeError(
      `compareRange needs end at or above start, got ${start} to ${end}`,
    );
  }

  // Guard against a tiny increment over a wide range producing a runaway list.
  const steps = Math.floor((end - start) / increment);
  if (steps > 10_000) {
    throw new RangeError(
      `compareRange would produce ${steps + 1} rows; use a larger increment`,
    );
  }

  const results: ComparisonResult[] = [];
  for (let index = 0; index <= steps; index += 1) {
    results.push(compare(start + index * increment, parameters, options));
  }
  return results;
}
