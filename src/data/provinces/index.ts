/**
 * Province lookup.
 *
 * All twelve jurisdictions outside Quebec. Adding one is a parameter file plus
 * tests, not a change to `src/engine/`, though two stretched that: Ontario
 * needed a surtax and a health premium, and Manitoba and Yukon needed an
 * income-tested basic personal amount. Those live in the typed shape rather
 * than in engine conditionals.
 *
 * Quebec is absent rather than approximated: it needs QPP instead of CPP,
 * QPIP, and the federal abatement.
 */

import { ALBERTA_2026 } from './ab-2026.ts';
import {
  NEWFOUNDLAND_2026,
  NEW_BRUNSWICK_2026,
  NOVA_SCOTIA_2026,
  PRINCE_EDWARD_ISLAND_2026,
} from './atlantic-2026.ts';
import { BRITISH_COLUMBIA_2026 } from './bc-2026.ts';
import { MANITOBA_2026 } from './mb-2026.ts';
import { ONTARIO_2026 } from './on-2026.ts';
import {
  NORTHWEST_TERRITORIES_2026,
  NUNAVUT_2026,
  SASKATCHEWAN_2026,
} from './prairies-north-2026.ts';
import { YUKON_2026 } from './yt-2026.ts';
import type { ProvinceCode, ProvincialParameters } from './types.ts';

export type {
  BasicPersonalAmountPhaseOut,
  HealthPremiumBand,
  ProvinceCode,
  ProvincialParameters,
  SurtaxTier,
  TaxReduction,
} from './types.ts';

/** Ordered west to east, then the territories, as Canadians usually list them. */
const PROVINCES_2026: Readonly<Record<ProvinceCode, ProvincialParameters>> = {
  BC: BRITISH_COLUMBIA_2026,
  AB: ALBERTA_2026,
  SK: SASKATCHEWAN_2026,
  MB: MANITOBA_2026,
  ON: ONTARIO_2026,
  NB: NEW_BRUNSWICK_2026,
  NS: NOVA_SCOTIA_2026,
  PE: PRINCE_EDWARD_ISLAND_2026,
  NL: NEWFOUNDLAND_2026,
  YT: YUKON_2026,
  NT: NORTHWEST_TERRITORIES_2026,
  NU: NUNAVUT_2026,
};

/** Province codes the model supports, for populating a selector. */
export const SUPPORTED_PROVINCES = Object.keys(PROVINCES_2026) as ProvinceCode[];

/** Parameters for a supported province. */
export function getProvince(code: ProvinceCode): ProvincialParameters {
  return PROVINCES_2026[code];
}
