/**
 * Shape every tax year's parameter files conform to.
 *
 * These interfaces are deliberately year-agnostic and live apart from any
 * year's values. Before this module existed the engine imported its parameter
 * shapes from `canada-federal-2026.ts` and friends, which meant a second tax
 * year had to import its own types from the first year's file. Adding a year is
 * supposed to be a data change; the shapes belong somewhere no year owns.
 *
 * The province shape lives in `provinces/types.ts` for the same reason.
 *
 * Values, with their sources, live in the `*-<year>.ts` files.
 */

import type { BracketTable, Sourced } from '../engine/types.ts';

// ---------------------------------------------------------------------------
// Canada, federal
// ---------------------------------------------------------------------------

export interface FederalParameters {
  readonly brackets: Sourced<BracketTable>;
  /**
   * The rate at which non-refundable credit amounts convert into a tax
   * reduction. This is the lowest bracket rate, which fell from 15% to 14%
   * with the 2025 rate cut, so it is read from the bracket table's first band
   * rather than hardcoded separately.
   */
  readonly creditRate: Sourced<number>;
  /** Basic personal amount for incomes at or above the 33% bracket threshold. */
  readonly basicPersonalAmountBase: Sourced<number>;
  /** Maximum enhancement added to the base amount at lower incomes. */
  readonly basicPersonalAmountSupplement: Sourced<number>;
  /** Income at which the enhancement starts to phase out (29% bracket start). */
  readonly basicPersonalAmountPhaseOutStart: Sourced<number>;
  /** Income at which the enhancement is fully phased out (33% bracket start). */
  readonly basicPersonalAmountPhaseOutEnd: Sourced<number>;
  readonly canadaEmploymentAmount: Sourced<number>;
  /** Published indexation factor, kept for provenance and year-over-year checks. */
  readonly indexationFactor: Sourced<number>;
}

// ---------------------------------------------------------------------------
// Canada, payroll contributions
// ---------------------------------------------------------------------------

export interface CppParameters {
  readonly maximumPensionableEarnings: Sourced<number>;
  readonly basicExemption: Sourced<number>;
  /** Total employee rate: base plus first additional. */
  readonly rate: Sourced<number>;
  /** Base portion, which produces a non-refundable credit. */
  readonly baseRate: Sourced<number>;
  /** First additional portion, which is deducted from income. */
  readonly firstAdditionalRate: Sourced<number>;
  readonly maximumContribution: Sourced<number>;
}

export interface Cpp2Parameters {
  /** Year's additional maximum pensionable earnings. */
  readonly additionalMaximumPensionableEarnings: Sourced<number>;
  readonly rate: Sourced<number>;
  readonly maximumContribution: Sourced<number>;
}

export interface EiParameters {
  readonly maximumInsurableEarnings: Sourced<number>;
  readonly rate: Sourced<number>;
  readonly maximumPremium: Sourced<number>;
}

/**
 * Quebec parental insurance plan. No equivalent exists elsewhere in Canada,
 * so this is absent outside Quebec.
 */
export interface QpipParameters {
  readonly maximumInsurableEarnings: Sourced<number>;
  readonly rate: Sourced<number>;
  readonly maximumPremium: Sourced<number>;
}

/**
 * Employer-side rates.
 *
 * CPP, QPP and CPP2 are matched by the employer exactly, so only the rates
 * that differ are listed here. EI is the notable one: employers pay 1.4 times
 * the employee rate.
 */
export interface EmployerParameters {
  readonly eiRate: Sourced<number>;
  readonly eiMaximumPremium: Sourced<number>;
  readonly qpipRate?: Sourced<number>;
  readonly qpipMaximumPremium?: Sourced<number>;
}

export interface PayrollParameters {
  /** CPP outside Quebec, QPP inside it. Same shape, different rates. */
  readonly cpp: CppParameters;
  readonly cpp2: Cpp2Parameters;
  readonly ei: EiParameters;
  /** Quebec only. */
  readonly qpip?: QpipParameters;
  readonly employer: EmployerParameters;
}

// ---------------------------------------------------------------------------
// Austria
// ---------------------------------------------------------------------------

/** One band of the reduced unemployment contribution scale, on monthly pay. */
export interface UnemploymentBand {
  /** Upper bound of monthly contribution basis, `null` for the top band. */
  readonly upTo: number | null;
  readonly rate: number;
}

export interface AustrianSocialInsurance {
  /** Health insurance, employee share. */
  readonly healthRate: Sourced<number>;
  /** Pension insurance, employee share. */
  readonly pensionRate: Sourced<number>;
  /** Chamber of labour levy (Arbeiterkammerumlage). */
  readonly chamberRate: Sourced<number>;
  /**
   * Housing promotion levy (Wohnbauförderungsbeitrag), employee share.
   *
   * 0.5% nationally. Vienna raised its total to 1.5% from 2026-01-01, so a
   * Vienna employee pays 0.75%. The model uses the national rate; the Vienna
   * variant is a documented difference, not modelled.
   */
  readonly housingRate: Sourced<number>;
  /**
   * Unemployment insurance, employee share, reduced at low pay.
   *
   * Graduated on the monthly contribution basis per section 2a AMPFG.
   */
  readonly unemploymentScale: Sourced<readonly UnemploymentBand[]>;
  /** Monthly maximum contribution basis (Höchstbeitragsgrundlage). */
  readonly monthlyCeiling: Sourced<number>;
}

/**
 * Employer-side costs in Austria.
 *
 * Two groups, and the difference between them matters:
 *
 * - Social insurance, which is capped by the same Höchstbeitragsgrundlage as
 *   the employee side.
 * - The wage levies (DB, DZ, Kommunalsteuer) and the pension-fund
 *   contribution, which are **uncapped**. They keep accruing on every euro,
 *   which is why Austrian employer cost keeps rising at high salaries where
 *   the Canadian employer cost has long since plateaued.
 */
export interface AustrianEmployerParameters {
  /** Total employer social insurance rate, subject to the ceiling. */
  readonly socialInsuranceRate: Sourced<number>;
  /** Company pension contribution (Betriebliche Vorsorge). Uncapped. */
  readonly pensionFundRate: Sourced<number>;
  /** Family burden equalisation levy (Dienstgeberbeitrag). Uncapped. */
  readonly familyFundRate: Sourced<number>;
  /** Surcharge to the above (Zuschlag zum DB). Varies by state. Uncapped. */
  readonly familyFundSurchargeRate: Sourced<number>;
  /** Municipal payroll tax (Kommunalsteuer). Uncapped. */
  readonly municipalTaxRate: Sourced<number>;
}

export interface AustrianParameters {
  readonly brackets: Sourced<BracketTable>;
  readonly indexationFactor: Sourced<number>;
  readonly socialInsurance: AustrianSocialInsurance;
  /** Flat deduction for employment expenses (Werbungskostenpauschbetrag). */
  readonly employmentExpenseAllowance: Sourced<number>;
  /** Commuting tax credit (Verkehrsabsetzbetrag). */
  readonly commutingCredit: Sourced<number>;
  /** Supplement to the commuting credit at low income (Zuschlag). */
  readonly commutingCreditSupplement: Sourced<number>;
  readonly commutingCreditSupplementPhaseOutStart: Sourced<number>;
  readonly commutingCreditSupplementPhaseOutEnd: Sourced<number>;
  /** Share of social insurance refunded as negative tax (SV-Rückerstattung). */
  readonly socialInsuranceRefundRate: Sourced<number>;
  readonly socialInsuranceRefundMaximum: Sourced<number>;
  /** Extra refund available where the supplement applies (SV-Bonus). */
  readonly socialInsuranceRefundBonus: Sourced<number>;

  /**
   * Fixed-rate bands applied to special payments within the Jahressechstel,
   * after deducting their own social insurance.
   */
  readonly specialPaymentBands: Sourced<BracketTable>;
  /** Amount above which special payments leave the fixed-rate regime. */
  readonly specialPaymentBandCeiling: Sourced<number>;
  /** Jahressechstel at or below which the fixed rates do not apply at all. */
  readonly specialPaymentExemptionLimit: Sourced<number>;
  /** Annual ceiling for social insurance on special payments. */
  readonly specialPaymentInsuranceCeiling: Sourced<number>;

  readonly employer: AustrianEmployerParameters;
}

// ---------------------------------------------------------------------------
// Currency and price levels
// ---------------------------------------------------------------------------

/** Which conversion basis to compare on. */
export type ComparisonBasis = 'fx' | 'ppp';

/**
 * Which price-level basis to use when comparing on PPP.
 *
 * `household` is the default. GDP PPP is built from the whole basket of final
 * expenditure, including government consumption and capital formation, which
 * is the wrong basket for a question about what a person can buy. See
 * `docs/decisions/2026-08-24_ppp-basis.md`.
 */
export type PppBasis = 'household' | 'gdp';

/** A pair of PPP conversion factors, in local currency per international dollar. */
export interface PppPair {
  readonly canada: Sourced<number>;
  readonly austria: Sourced<number>;
  /** The year the factors describe, which normally trails the tax year. */
  readonly referenceYear: number;
}

export interface ConversionParameters {
  /** Market exchange rate, Canadian dollars per euro. */
  readonly exchangeRate: Sourced<number>;
  readonly householdPpp: PppPair;
  readonly gdpPpp: PppPair;
}
