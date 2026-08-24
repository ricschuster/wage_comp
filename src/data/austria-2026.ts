/**
 * Austrian income tax and social insurance parameters, tax year 2026.
 *
 * Rates are the employee share (Dienstnehmeranteil) for Angestellte. The
 * employer share is not modelled: see issue on employer-side total cost.
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
};
