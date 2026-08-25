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

/** Provinces and territories the model supports. Quebec is deliberately absent. */
export type ProvinceCode =
  | 'AB'
  | 'BC'
  | 'MB'
  | 'NB'
  | 'NL'
  | 'NS'
  | 'NT'
  | 'NU'
  | 'ON'
  | 'PE'
  | 'QC'
  | 'SK'
  | 'YT';

/**
 * Quebec's deduction for workers.
 *
 * A percentage of employment income, capped, deducted from Quebec taxable
 * income. It replaces the contribution credits the rest of Canada grants,
 * which is why Revenu Québec's formula has no QPP, EI or QPIP credit term.
 */
export interface WorkerDeduction {
  readonly rate: Sourced<number>;
  readonly maximum: Sourced<number>;
}

/**
 * An income-tested basic personal amount.
 *
 * Manitoba tapers its amount to nothing between 200,000 and 400,000. Yukon
 * mirrors the federal amount, which tapers to a floor rather than to zero.
 * Every other jurisdiction has a flat amount and omits this.
 */
export interface BasicPersonalAmountPhaseOut {
  /** Amount remaining at and above the end of the taper. */
  readonly minimum: Sourced<number>;
  readonly start: Sourced<number>;
  readonly end: Sourced<number>;
}

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
  /** The flat amount, or the maximum where the amount is income-tested. */
  readonly basicPersonalAmount: Sourced<number>;
  /** Present only where the basic personal amount is income-tested. */
  readonly basicPersonalAmountPhaseOut?: BasicPersonalAmountPhaseOut;
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
  /** Quebec only: a deduction from provincial taxable income. */
  readonly workerDeduction?: WorkerDeduction;
  /**
   * Whether the province grants a credit for payroll contributions.
   *
   * Every province does except Quebec, which replaced those credits with the
   * deduction for workers. Granting both would double count the relief, so
   * this defaults to true and Quebec sets it false.
   */
  readonly grantsContributionCredits?: boolean;
  /**
   * Quebec only: the share by which a resident's FEDERAL tax is reduced.
   *
   * Quebec runs programs the federal government runs elsewhere, and the
   * abatement compensates for it. Omitting it would overstate a Quebec
   * resident's total tax substantially.
   */
  readonly federalAbatementRate?: Sourced<number>;
}
