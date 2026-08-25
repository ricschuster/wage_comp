/**
 * Province lookup.
 *
 * Adding a province is a parameter file plus tests, not a change to
 * `src/engine/`. Ontario stretched that claim, since it needed a surtax and a
 * health premium, but those live in the typed shape rather than in engine
 * conditionals.
 */

import { ALBERTA_2026 } from './ab-2026.ts';
import { BRITISH_COLUMBIA_2026 } from './bc-2026.ts';
import { ONTARIO_2026 } from './on-2026.ts';
import type { ProvinceCode, ProvincialParameters } from './types.ts';

export type {
  HealthPremiumBand,
  ProvinceCode,
  ProvincialParameters,
  SurtaxTier,
  TaxReduction,
} from './types.ts';

const PROVINCES_2026: Readonly<Record<ProvinceCode, ProvincialParameters>> = {
  AB: ALBERTA_2026,
  BC: BRITISH_COLUMBIA_2026,
  ON: ONTARIO_2026,
};

/** Province codes the model supports, for populating a selector. */
export const SUPPORTED_PROVINCES = Object.keys(PROVINCES_2026) as ProvinceCode[];

/** Parameters for a supported province. */
export function getProvince(code: ProvinceCode): ProvincialParameters {
  return PROVINCES_2026[code];
}
