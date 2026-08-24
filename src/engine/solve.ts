/**
 * The equivalence solver: inverts the model.
 *
 * Comparing both countries at the same gross assumes a labour market parity
 * that does not exist. Nobody is offered the same real gross in Vancouver and
 * Vienna, and Austrian nominal salaries for equivalent roles are typically
 * lower. The question people actually face is the inverse:
 *
 *   Given this Canadian package, what Austrian gross would match it?
 *
 * Austrian net income is strictly increasing in gross across the modelled
 * range, which is asserted by a test, so bisection is sufficient and needs no
 * derivative.
 */

import { computeAustria } from './austria.ts';
import { computeCanada } from './canada.ts';
import {
  conversionRate,
  type ComparisonOptions,
  type ComparisonParameters,
} from './compare.ts';
import { roundToCents } from './money.ts';

/** How close the solved net must be to the target, in currency units. */
const TOLERANCE = 0.01;
/** Bisection halves the interval each step, so this is far more than enough. */
const MAX_ITERATIONS = 200;
/** Refuse to search beyond this Austrian gross rather than looping forever. */
const SEARCH_CEILING = 100_000_000;

export interface EquivalenceResult {
  /** The Canadian package the solve targeted. */
  readonly canadaGrossCad: number;
  readonly canadaNetCad: number;
  /** Austrian gross whose net matches, in euro. */
  readonly austriaGrossEur: number;
  /** That gross expressed in Canadian dollars at the same rate. */
  readonly austriaGrossCad: number;
  readonly austriaNetEur: number;
  /** Conversion rate used, Canadian dollars per euro. */
  readonly rate: number;
  /**
   * Solved Austrian gross divided by the naive converted gross.
   *
   * Below 1 means Austria needs LESS gross to match, because its net is higher
   * at that income. Above 1 means it needs more.
   */
  readonly grossRatio: number;
  readonly iterations: number;
}

/** Thrown when the solve cannot bracket or converge on an answer. */
export class EquivalenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EquivalenceError';
  }
}

/**
 * The Austrian gross whose net matches a given Canadian package.
 *
 * Throws rather than returning a bound when the target is unreachable, so a
 * failed solve can never be mistaken for an answer.
 */
export function solveEquivalentAustrianGross(
  canadaGrossCad: number,
  parameters: ComparisonParameters,
  options: ComparisonOptions,
): EquivalenceResult {
  if (!Number.isFinite(canadaGrossCad) || canadaGrossCad <= 0) {
    throw new EquivalenceError(
      `solve needs a positive Canadian gross, got ${canadaGrossCad}`,
    );
  }

  const { rate } = conversionRate(options, parameters.conversion);
  const canada = computeCanada(canadaGrossCad, parameters.canada);

  // Work entirely in euro: the target is the Canadian net converted across.
  const targetNetEur = canada.netIncome / rate;

  const netAt = (grossEur: number): number =>
    computeAustria(grossEur, parameters.austria, {
      specialPayments: options.specialPayments,
    }).netIncome;

  // Bracket the answer. Austrian net is strictly increasing, so doubling the
  // upper bound until it clears the target is guaranteed to terminate unless
  // the target is genuinely unreachable.
  let low = 0;
  let high = Math.max(targetNetEur, 1_000);
  while (netAt(high) < targetNetEur) {
    high *= 2;
    if (high > SEARCH_CEILING) {
      throw new EquivalenceError(
        `no Austrian gross below ${SEARCH_CEILING} reaches a net of ${targetNetEur.toFixed(2)} EUR`,
      );
    }
  }

  let iterations = 0;
  let mid = (low + high) / 2;
  while (iterations < MAX_ITERATIONS) {
    iterations += 1;
    mid = (low + high) / 2;
    const net = netAt(mid);
    if (Math.abs(net - targetNetEur) <= TOLERANCE) {
      break;
    }
    if (net < targetNetEur) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const achieved = netAt(mid);
  if (Math.abs(achieved - targetNetEur) > TOLERANCE) {
    throw new EquivalenceError(
      `solve did not converge within ${MAX_ITERATIONS} iterations: reached ${achieved.toFixed(2)} against a target of ${targetNetEur.toFixed(2)} EUR`,
    );
  }

  const naiveGrossEur = canadaGrossCad / rate;

  return {
    canadaGrossCad: roundToCents(canadaGrossCad),
    canadaNetCad: canada.netIncome,
    austriaGrossEur: roundToCents(mid),
    austriaGrossCad: roundToCents(mid * rate),
    austriaNetEur: roundToCents(achieved),
    rate,
    grossRatio: mid / naiveGrossEur,
    iterations,
  };
}
