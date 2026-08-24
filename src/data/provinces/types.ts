/**
 * Shape every province's parameter file conforms to.
 *
 * The lookup exists from the first province so that adding Alberta or Ontario
 * later is a parameter file plus tests rather than a code change. Quebec does
 * not fit this shape (QPP instead of CPP, QPIP, and the federal abatement) and
 * is deliberately absent rather than approximated.
 */

import type { BracketTable, Sourced } from '../../engine/types.ts';

/** Provinces and territories the model supports. */
export type ProvinceCode = 'BC';

/**
 * A low-income tax reduction that reduces provincial tax after credits.
 *
 * Only British Columbia and Ontario have one. It is a reduction of tax, not a
 * credit amount, so it is applied after the bracket-and-credit calculation.
 */
export interface TaxReduction {
  /** Maximum reduction, available up to the phase-out start. */
  readonly maximumReduction: Sourced<number>;
  /** Income above which the reduction starts to shrink. */
  readonly phaseOutStart: Sourced<number>;
  /** Rate at which it shrinks per dollar of income above the start. */
  readonly phaseOutRate: Sourced<number>;
}

export interface ProvincialParameters {
  readonly code: ProvinceCode;
  readonly name: string;
  readonly brackets: Sourced<BracketTable>;
  /**
   * Rate converting credit amounts into a tax reduction: the lowest bracket
   * rate, read from the bracket table rather than stored separately.
   */
  readonly creditRate: Sourced<number>;
  readonly basicPersonalAmount: Sourced<number>;
  /** Absent for provinces that have no low-income tax reduction. */
  readonly taxReduction?: TaxReduction;
}
