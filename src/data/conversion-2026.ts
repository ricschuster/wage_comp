/**
 * Currency and price-level conversion parameters.
 *
 * Three bases are offered. Each reduces to a single rate expressed as Canadian
 * dollars per euro, which keeps the comparison arithmetic identical whichever
 * basis is chosen.
 *
 * The exchange rate is a user input with the sourced default below rather than
 * a live fetch: the app is a static site with no backend, and a hardcoded rate
 * would go stale within days. The default carries its date so a stale value is
 * visible rather than silent.
 */

import type { Sourced } from '../engine/types.ts';

/** ECB euro foreign exchange reference rates. */
const ECB = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

/** World Bank, PPP conversion factor, private consumption (LCU per international $). */
const WB_CONSUMPTION =
  'https://api.worldbank.org/v2/country/CAN;AUT/indicator/PA.NUS.PRVT.PP?format=json';

/** World Bank, PPP conversion factor, GDP (LCU per international $). */
const WB_GDP =
  'https://api.worldbank.org/v2/country/CAN;AUT/indicator/PA.NUS.PPP?format=json';

const RETRIEVED = '2026-08-24';

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

export const CONVERSION_2026: ConversionParameters = {
  exchangeRate: {
    value: 1.6074,
    source: ECB,
    retrieved: RETRIEVED,
    note: 'ECB reference rate for 2026-08-21. Editable in the app; this is only the default.',
  },

  householdPpp: {
    referenceYear: 2025,
    canada: {
      value: 1.260483,
      source: WB_CONSUMPTION,
      retrieved: RETRIEVED,
      note: 'Canadian dollars per international dollar, private consumption basis, 2025.',
    },
    austria: {
      value: 0.750352,
      source: WB_CONSUMPTION,
      retrieved: RETRIEVED,
      note: 'Euro per international dollar, private consumption basis, 2025.',
    },
  },

  gdpPpp: {
    referenceYear: 2025,
    canada: {
      value: 1.166683,
      source: WB_GDP,
      retrieved: RETRIEVED,
      note: 'Canadian dollars per international dollar, GDP basis, 2025.',
    },
    austria: {
      value: 0.725357,
      source: WB_GDP,
      retrieved: RETRIEVED,
      note: 'Euro per international dollar, GDP basis, 2025.',
    },
  },
};
