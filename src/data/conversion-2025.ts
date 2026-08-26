/**
 * Currency and price-level conversion parameters for tax year 2025.
 *
 * One deliberate difference from the 2026 file. 2026 is not over, so its
 * exchange rate default is a recent daily reference rate. 2025 is complete, so
 * its default is the ECB **annual average** for the year, which is the right
 * companion to a full year of tax. Both remain user inputs; the default only
 * has to be defensible and dated.
 *
 * The PPP reference year trails the tax year by one, as it does for 2026: the
 * World Bank factors for a year are published well after it ends.
 */

import type { ConversionParameters } from './types.ts';

/** ECB, annual average euro reference exchange rate, Canadian dollar. */
const ECB_ANNUAL =
  'https://data-api.ecb.europa.eu/service/data/EXR/A.CAD.EUR.SP00.A?format=csvdata';

/** World Bank, PPP conversion factor, private consumption (LCU per international $). */
const WB_CONSUMPTION =
  'https://api.worldbank.org/v2/country/CAN;AUT/indicator/PA.NUS.PRVT.PP?format=json';

/** World Bank, PPP conversion factor, GDP (LCU per international $). */
const WB_GDP =
  'https://api.worldbank.org/v2/country/CAN;AUT/indicator/PA.NUS.PPP?format=json';

const RETRIEVED = '2026-08-25';

export const CONVERSION_2025: ConversionParameters = {
  exchangeRate: {
    value: 1.5787,
    source: ECB_ANNUAL,
    retrieved: RETRIEVED,
    note: 'ECB annual average for 2025, 1.578726 before rounding. Editable in the app; this is only the default.',
  },

  householdPpp: {
    referenceYear: 2024,
    canada: {
      value: 1.240903,
      source: WB_CONSUMPTION,
      retrieved: RETRIEVED,
      note: 'Canadian dollars per international dollar, private consumption basis, 2024.',
    },
    austria: {
      value: 0.720487,
      source: WB_CONSUMPTION,
      retrieved: RETRIEVED,
      note: 'Euro per international dollar, private consumption basis, 2024.',
    },
  },

  gdpPpp: {
    referenceYear: 2024,
    canada: {
      value: 1.150472,
      source: WB_GDP,
      retrieved: RETRIEVED,
      note: 'Canadian dollars per international dollar, GDP basis, 2024.',
    },
    austria: {
      value: 0.710451,
      source: WB_GDP,
      retrieved: RETRIEVED,
      note: 'Euro per international dollar, GDP basis, 2024.',
    },
  },
};
