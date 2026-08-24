/**
 * Core types shared by every jurisdiction module.
 *
 * Nothing in `src/engine/` may import React, and no tax value may be written
 * inline here. Values live in `src/data/`, keyed by tax year, wrapped in
 * `Sourced` so provenance travels with the number.
 */

/**
 * A parameter value together with where it came from.
 *
 * Every tax parameter in `src/data/` is wrapped in this. A number without a
 * source and a retrieval date does not ship: see
 * `docs/decisions/2026-08-24_parameter-provenance.md`.
 */
export interface Sourced<T> {
  readonly value: T;
  /** URL of the authoritative source. */
  readonly source: string;
  /** ISO date (YYYY-MM-DD) on which the value was read from that source. */
  readonly retrieved: string;
  /** Optional clarification, for example which table or line was used. */
  readonly note?: string;
}

/** One band of a progressive rate schedule. */
export interface Bracket {
  /** Lower bound of the band, inclusive. The lowest band starts at 0. */
  readonly from: number;
  /** Upper bound of the band, exclusive. `null` marks the top band. */
  readonly to: number | null;
  /** Marginal rate applied within the band, as a fraction (0.15, not 15). */
  readonly rate: number;
}

/**
 * A progressive rate schedule, ordered from the lowest band upward.
 *
 * Used for Canadian federal and provincial income tax, Austrian income tax, and
 * the Austrian Jahressechstel bands applied to special payments.
 */
export type BracketTable = readonly Bracket[];

/** The two countries compared. */
export type Country = 'CA' | 'AT';

/** Tax year the parameters describe. */
export type TaxYear = 2026;
