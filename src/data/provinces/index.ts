/**
 * Province lookup.
 *
 * One entry today. The lookup ships now anyway: retrofitting it after the
 * formulas harden is expensive, and with it in place adding a province is a
 * parameter file plus tests rather than a change to `src/engine/`.
 */

import { BRITISH_COLUMBIA_2026 } from './bc-2026.ts';
import type { ProvinceCode, ProvincialParameters } from './types.ts';

export type { ProvinceCode, ProvincialParameters, TaxReduction } from './types.ts';

const PROVINCES_2026: Readonly<Record<ProvinceCode, ProvincialParameters>> = {
  BC: BRITISH_COLUMBIA_2026,
};

/** Province codes the model supports, for populating a selector. */
export const SUPPORTED_PROVINCES = Object.keys(PROVINCES_2026) as ProvinceCode[];

/** Parameters for a supported province. */
export function getProvince(code: ProvinceCode): ProvincialParameters {
  return PROVINCES_2026[code];
}
