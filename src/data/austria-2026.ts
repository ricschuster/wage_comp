/**
 * Austrian income tax and social insurance parameters, tax year 2026.
 *
 * Rates are the employee share (Dienstnehmeranteil) for Angestellte, except in
 * the `employer` block, which carries the employer side.
 */

import type { BracketTable, Sourced } from '../engine/types.ts';

/** BMF, "Steuertarif und Steuerabsetzbeträge". */
const BMF_TARIF =
  'https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/steuertarif-steuerabsetzbetraege.html';

/** BMF, "Übersicht Steuerabsetzbeträge". */
const BMF_ABSETZ =
  'https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/uebersicht-steuerabsetzbetraege.html';

/** Dachverband der österreichischen Sozialversicherungen, "Beitragsrechtliche Werte 2026". */
const SV_WERTE =
  'https://www.sozialversicherung.at/cdscontent/load?contentid=10008.806858';

/** RIS, Einkommensteuergesetz 1988. */
const RIS_ESTG_16 =
  'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=16';
const RIS_ESTG_33 =
  'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=33';
const RIS_ESTG_67 =
  'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=67';

/** WKO, "Dienstgeberbeitrag zum Familienlastenausgleichsfonds". */
const WKO_DB =
  'https://www.wko.at/lohnverrechnung/dienstgeberbeitrag-familienlastenausgleichsfonds';

/** WKO, "Zuschlag zum Dienstgeberbeitrag". */
const WKO_DZ = 'https://www.wko.at/lohnverrechnung/zuschlag-dienstgeberbeitrag';

/** Unternehmensserviceportal, "Bemessungsgrundlage und Steuersatz der Kommunalsteuer". */
const USP_KOMMST =
  'https://www.usp.gv.at/themen/steuern-finanzen/kommunalsteuer/bemessungsgrundlage-und-steuersatz-der-kommunalsteuer.html';

const RETRIEVED = '2026-08-24';

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

export const AUSTRIA_2026: AustrianParameters = {
  brackets: {
    value: [
      { from: 0, to: 13_539, rate: 0 },
      { from: 13_539, to: 21_992, rate: 0.2 },
      { from: 21_992, to: 36_458, rate: 0.3 },
      { from: 36_458, to: 70_365, rate: 0.4 },
      { from: 70_365, to: 104_859, rate: 0.48 },
      { from: 104_859, to: 1_000_000, rate: 0.5 },
      { from: 1_000_000, to: null, rate: 0.55 },
    ],
    source: BMF_TARIF,
    retrieved: RETRIEVED,
    note: 'The 55% top band is temporary, in force 2016 through 2029, reverting to 50% after.',
  },

  indexationFactor: {
    value: 0.01733,
    source: BMF_TARIF,
    retrieved: RETRIEVED,
    note: 'Two thirds of the computed 2.6% inflation rate. Applied to every band except the top one.',
  },

  socialInsurance: {
    healthRate: {
      value: 0.0387,
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Krankenversicherung, Angestellte, Dienstnehmeranteil. Total rate 7.65%.',
    },
    pensionRate: {
      value: 0.1025,
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Pensionsversicherung, Angestellte, Dienstnehmeranteil. Total rate 22.80%.',
    },
    chamberRate: {
      value: 0.005,
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Arbeiterkammerumlage, employee only. Not levied on special payments.',
    },
    housingRate: {
      value: 0.005,
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Wohnbauförderungsbeitrag, half of the 1.0% total. Vienna is 1.5% total from 2026, so 0.75% for a Vienna employee. Not levied on special payments.',
    },
    unemploymentScale: {
      value: [
        { upTo: 2_225, rate: 0 },
        { upTo: 2_427, rate: 0.01 },
        { upTo: 2_630, rate: 0.02 },
        { upTo: null, rate: 0.0295 },
      ],
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Versichertenanteil am AV-Beitrag bei geringem Einkommen, section 2a AMPFG. Bands are monthly.',
    },
    monthlyCeiling: {
      value: 6_930,
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Monthly Höchstbeitragsgrundlage. Daily equivalent 231.00.',
    },
  },

  employmentExpenseAllowance: {
    value: 132,
    source: RIS_ESTG_16,
    retrieved: RETRIEVED,
    note: 'Werbungskostenpauschbetrag, EStG section 16(3). The Sonderausgabenpauschbetrag no longer exists in current section 18.',
  },

  commutingCredit: {
    value: 496,
    source: BMF_ABSETZ,
    retrieved: RETRIEVED,
    note: 'Verkehrsabsetzbetrag. The higher rate of 853 requires a Pendlerpauschale, which is not modelled.',
  },

  commutingCreditSupplement: {
    value: 804,
    source: BMF_ABSETZ,
    retrieved: RETRIEVED,
    note: 'Zuschlag zum Verkehrsabsetzbetrag, granted on assessment.',
  },

  commutingCreditSupplementPhaseOutStart: {
    value: 19_761,
    source: BMF_ABSETZ,
    retrieved: RETRIEVED,
    note: 'Income up to which the full supplement applies.',
  },

  commutingCreditSupplementPhaseOutEnd: {
    value: 30_259,
    source: BMF_ABSETZ,
    retrieved: RETRIEVED,
    note: 'Income at which the supplement reaches zero, phasing evenly.',
  },

  socialInsuranceRefundRate: {
    value: 0.55,
    source: RIS_ESTG_33,
    retrieved: RETRIEVED,
    note: 'EStG section 33(8): 55% of qualifying contributions refunded when tax falls below zero.',
  },

  socialInsuranceRefundMaximum: {
    value: 496,
    source: RIS_ESTG_33,
    retrieved: RETRIEVED,
    note: 'Annual cap without a Pendlerpauschale. With one the cap is 750, which is not modelled.',
  },

  socialInsuranceRefundBonus: {
    value: 804,
    source: RIS_ESTG_33,
    retrieved: RETRIEVED,
    note: 'SV-Bonus: the cap rises by this much where the supplement applies.',
  },

  specialPaymentBands: {
    value: [
      { from: 0, to: 620, rate: 0 },
      { from: 620, to: 25_000, rate: 0.06 },
      { from: 25_000, to: 50_000, rate: 0.27 },
      { from: 50_000, to: null, rate: 0.3575 },
    ],
    source: RIS_ESTG_67,
    retrieved: RETRIEVED,
    note: 'EStG section 67(1): first 620 free, next 24,380 at 6%, next 25,000 at 27%, next 33,333 at 35.75%.',
  },

  specialPaymentBandCeiling: {
    value: 83_333,
    source: RIS_ESTG_67,
    retrieved: RETRIEVED,
    note: 'EStG section 67(2): amounts above this are taxed under section 67(10) at the ordinary tariff.',
  },

  specialPaymentExemptionLimit: {
    value: 2_615,
    source: RIS_ESTG_67,
    retrieved: RETRIEVED,
    note: 'Freigrenze. Where the Jahressechstel is at most this, the fixed rates do not apply at all.',
  },

  specialPaymentInsuranceCeiling: {
    value: 13_860,
    source: SV_WERTE,
    retrieved: RETRIEVED,
    note: 'Annual Höchstbeitragsgrundlage for special payments, separate from the monthly ceiling on regular pay.',
  },

  employer: {
    socialInsuranceRate: {
      value: 0.2098,
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Angestellte employer share: health 3.78, accident 1.10, pension 12.55, unemployment 2.95, insolvency 0.10, housing 0.50.',
    },
    pensionFundRate: {
      value: 0.0153,
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Betriebliche Vorsorge. Neither the minimum-earnings threshold nor the contribution ceiling applies, so it is uncapped.',
    },
    familyFundRate: {
      value: 0.037,
      source: WKO_DB,
      retrieved: RETRIEVED,
      note: 'Dienstgeberbeitrag, 3.7% from 2025. Uncapped.',
    },
    familyFundSurchargeRate: {
      value: 0.0036,
      source: WKO_DZ,
      retrieved: RETRIEVED,
      note: 'Zuschlag zum Dienstgeberbeitrag for Vienna in 2026. It varies by state, from 0.31% in Upper Austria to 0.40% in Burgenland.',
    },
    municipalTaxRate: {
      value: 0.03,
      source: USP_KOMMST,
      retrieved: RETRIEVED,
      note: 'Kommunalsteuer, uniform across Austria. A monthly allowance of 1,095 applies below a 1,460 threshold and is not modelled.',
    },
  },
};
