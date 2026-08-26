/**
 * Austrian income tax and social insurance parameters, tax year 2025.
 *
 * Rates are the employee share (Dienstnehmeranteil) for Angestellte, except in
 * the `employer` block, which carries the employer side.
 *
 * 2025 is the year the tariff bands moved furthest. Austria adjusts them for
 * cold progression by two thirds of the computed inflation rate, and for 2025
 * that computation gave 5.0%, plus a discretionary half point, for 3.8333%
 * against 1.733% in 2026.
 *
 * The RIS citations are pinned to the version in force on 2025-12-31 with
 * `FassungVom`, because the amounts in the Einkommensteuergesetz are restated
 * every year by regulation and the unpinned page shows the current year.
 *
 * The shape lives in `types.ts`, shared with every other tax year.
 */

import type { AustrianParameters } from './types.ts';

/** BMF, "Steuertarif und Steuerabsetzbeträge", which tabulates 2022 onward. */
const BMF_TARIF =
  'https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/steuertarif-steuerabsetzbetraege.html';

/** BMF, "Übersicht Steuerabsetzbeträge", which lists each amount by year. */
const BMF_ABSETZ =
  'https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/uebersicht-steuerabsetzbetraege.html';

/** Dachverband der österreichischen Sozialversicherungen, "Beitragsrechtliche Werte 2025". */
const SV_WERTE =
  'https://www.sozialversicherung.at/cdscontent/load?contentid=10008.797715';

/** RIS, Einkommensteuergesetz 1988, as in force on 2025-12-31. */
const RIS_ESTG_16 =
  'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=16&FassungVom=2025-12-31';
const RIS_ESTG_33 =
  'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=33&FassungVom=2025-12-31';
const RIS_ESTG_67 =
  'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=67&FassungVom=2025-12-31';

/** WKO, "Dienstgeberbeitrag zum Familienlastenausgleichsfonds". */
const WKO_DB =
  'https://www.wko.at/lohnverrechnung/dienstgeberbeitrag-familienlastenausgleichsfonds';

/** WKO, "Zuschlag zum Dienstgeberbeitrag", which tabulates 2023 through 2026. */
const WKO_DZ = 'https://www.wko.at/lohnverrechnung/zuschlag-dienstgeberbeitrag';

/** Unternehmensserviceportal, "Bemessungsgrundlage und Steuersatz der Kommunalsteuer". */
const USP_KOMMST =
  'https://www.usp.gv.at/themen/steuern-finanzen/kommunalsteuer/bemessungsgrundlage-und-steuersatz-der-kommunalsteuer.html';

const RETRIEVED = '2026-08-25';

export const AUSTRIA_2025: AustrianParameters = {
  brackets: {
    value: [
      { from: 0, to: 13_308, rate: 0 },
      { from: 13_308, to: 21_617, rate: 0.2 },
      { from: 21_617, to: 35_836, rate: 0.3 },
      { from: 35_836, to: 69_166, rate: 0.4 },
      { from: 69_166, to: 103_072, rate: 0.48 },
      { from: 103_072, to: 1_000_000, rate: 0.5 },
      { from: 1_000_000, to: null, rate: 0.55 },
    ],
    source: BMF_TARIF,
    retrieved: RETRIEVED,
    note: 'Tarifstufen 2025. The 55% top band is temporary, in force 2016 through 2029.',
  },

  indexationFactor: {
    value: 0.038333,
    source: BMF_TARIF,
    retrieved: RETRIEVED,
    note: 'Two thirds of the computed 5.0% inflation rate plus 0.5 points. Applied to every band except the top one.',
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
      note: 'Wohnbauförderungsbeitrag, half of the 1.0% total. The Vienna increase to 1.5% took effect only from 2026. Not levied on special payments.',
    },
    unemploymentScale: {
      value: [
        { upTo: 2_074, rate: 0 },
        { upTo: 2_262, rate: 0.01 },
        { upTo: 2_451, rate: 0.02 },
        { upTo: null, rate: 0.0295 },
      ],
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Versichertenanteil am AV-Beitrag bei geringem Einkommen, section 2a AMPFG. Bands are monthly.',
    },
    monthlyCeiling: {
      value: 6_450,
      source: SV_WERTE,
      retrieved: RETRIEVED,
      note: 'Monthly Höchstbeitragsgrundlage. Daily equivalent 215.00.',
    },
  },

  employmentExpenseAllowance: {
    value: 132,
    source: RIS_ESTG_16,
    retrieved: RETRIEVED,
    note: 'Werbungskostenpauschbetrag, EStG section 16(3). Not indexed.',
  },

  commutingCredit: {
    value: 487,
    source: BMF_ABSETZ,
    retrieved: RETRIEVED,
    note: 'Verkehrsabsetzbetrag for 2025. The higher rate of 838 requires a Pendlerpauschale, which is not modelled.',
  },

  commutingCreditSupplement: {
    value: 790,
    source: BMF_ABSETZ,
    retrieved: RETRIEVED,
    note: 'Zuschlag zum Verkehrsabsetzbetrag for 2025, granted on assessment.',
  },

  commutingCreditSupplementPhaseOutStart: {
    value: 19_424,
    source: RIS_ESTG_33,
    retrieved: RETRIEVED,
    note: 'EStG section 33(5) Z 3: income up to which the full supplement applies in 2025.',
  },

  commutingCreditSupplementPhaseOutEnd: {
    value: 29_743,
    source: RIS_ESTG_33,
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
    value: 487,
    source: RIS_ESTG_33,
    retrieved: RETRIEVED,
    note: 'Annual cap for 2025 without a Pendlerpauschale. With one the cap is 737, which is not modelled.',
  },

  socialInsuranceRefundBonus: {
    value: 790,
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
    note: 'EStG section 67(1): first 620 free, next 24,380 at 6%, next 25,000 at 27%, next 33,333 at 35.75%. Not indexed.',
  },

  specialPaymentBandCeiling: {
    value: 83_333,
    source: RIS_ESTG_67,
    retrieved: RETRIEVED,
    note: 'EStG section 67(2): amounts above this are taxed under section 67(10) at the ordinary tariff.',
  },

  specialPaymentExemptionLimit: {
    value: 2_570,
    source: RIS_ESTG_67,
    retrieved: RETRIEVED,
    note: 'Freigrenze for 2025. Where the Jahressechstel is at most this, the fixed rates do not apply at all.',
  },

  specialPaymentInsuranceCeiling: {
    value: 12_900,
    source: SV_WERTE,
    retrieved: RETRIEVED,
    note: 'Annual Höchstbeitragsgrundlage for special payments, exactly twice the monthly ceiling on regular pay.',
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
      note: 'Dienstgeberbeitrag, reduced from 3.9% to 3.7% for 2025. Uncapped.',
    },
    familyFundSurchargeRate: {
      value: 0.0036,
      source: WKO_DZ,
      retrieved: RETRIEVED,
      note: 'Zuschlag zum Dienstgeberbeitrag for Vienna in 2025, unchanged in 2026. It varies by state, from 0.31% in Upper Austria to 0.40% in Burgenland.',
    },
    municipalTaxRate: {
      value: 0.03,
      source: USP_KOMMST,
      retrieved: RETRIEVED,
      note: 'Kommunalsteuer, uniform across Austria. The monthly allowance below a small-payroll threshold is not modelled.',
    },
  },
};
