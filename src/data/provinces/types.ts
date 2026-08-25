/**
 * Shape every province's parameter file conforms to.
 *
 * The lookup exists from the first province so that adding one is a parameter
 * file plus tests rather than a code change. Provinces are not uniform though:
 * Ontario adds a surtax and a health premium, and its low-income reduction has
 * a different shape from British Columbia's. Those are optional and typed, not
 * bolted on with conditionals in the engine.
 *
 * Quebec does not fit this shape at all (QPP instead of CPP, QPIP, and the
 * federal abatement) and is deliberately absent rather than approximated.
 */

import type { BracketTable, Sourced } from '../../engine/types.ts';

/** Provinces and territories the model supports. */
export type ProvinceCode = 'AB' | 'BC' | 'ON';

/**
 * A low-income tax reduction. Two provinces have one, and they differ.
 *
 * `phaseOut` shrinks a fixed maximum as income rises, which is British
 * Columbia's form. `doubleBase` is Ontario's: the reduction is the lesser of
 * the tax itself and twice a base amount less the tax, so it tapers to nothing
 * once tax reaches that base.
 */
export type TaxReduction =
  | {
      readonly kind: 'phaseOut';
      readonly maximumReduction: Sourced<number>;
      readonly phaseOutStart: Sourced<number>;
      readonly phaseOutRate: Sourced<number>;
    }
  | {
      readonly kind: 'doubleBase';
      /** Personal amount of the reduction, before dependants. */
      readonly baseAmount: Sourced<number>;
    };

/** One tier of a surtax charged on tax already payable. */
export interface SurtaxTier {
  /** Tax above this amount attracts the rate. */
  readonly over: number;
  readonly rate: number;
}

/** One band of a stepped health premium charged on taxable income. */
export interface HealthPremiumBand {
  readonly from: number;
  /** Upper bound, `null` for the top band. */
  readonly upTo: number | null;
  /** Amount carried in from the bands below. */
  readonly base: number;
  readonly rate: number;
  /** Cap for this band. */
  readonly maximum: number;
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
  /** Ontario only: a surtax charged on provincial tax already payable. */
  readonly surtax?: Sourced<readonly SurtaxTier[]>;
  /**
   * Ontario only: a separate premium on taxable income.
   *
   * It sits outside the tax reduction, so it is added after the reduction is
   * applied rather than being reduced by it.
   */
  readonly healthPremium?: Sourced<readonly HealthPremiumBand[]>;
}
