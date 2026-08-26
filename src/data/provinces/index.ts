/**
 * Province lookup, per tax year.
 *
 * All thirteen jurisdictions. Adding one is a parameter file plus tests, not a
 * change to `src/engine/`, though two stretched that: Ontario needed a surtax
 * and a health premium, and Manitoba and Yukon needed an income-tested basic
 * personal amount. Those live in the typed shape rather than in engine
 * conditionals.
 *
 * Quebec is present but does not fit the shape on its own: it needs QPP instead
 * of CPP, QPIP, and the federal abatement, which is why the payroll parameters
 * are chosen alongside the province in `canada.ts`.
 *
 * `getProvince` resolves against the current tax year. For an earlier year, go
 * through `parametersForYear(year).provinces`.
 */

import { ALBERTA_2025 } from './ab-2025.ts';
import { ALBERTA_2026 } from './ab-2026.ts';
import {
  NEWFOUNDLAND_2025,
  NEW_BRUNSWICK_2025,
  NOVA_SCOTIA_2025,
  PRINCE_EDWARD_ISLAND_2025,
} from './atlantic-2025.ts';
import {
  NEWFOUNDLAND_2026,
  NEW_BRUNSWICK_2026,
  NOVA_SCOTIA_2026,
  PRINCE_EDWARD_ISLAND_2026,
} from './atlantic-2026.ts';
import { BRITISH_COLUMBIA_2025 } from './bc-2025.ts';
import { BRITISH_COLUMBIA_2026 } from './bc-2026.ts';
import { MANITOBA_2025 } from './mb-2025.ts';
import { MANITOBA_2026 } from './mb-2026.ts';
import { ONTARIO_2025 } from './on-2025.ts';
import { ONTARIO_2026 } from './on-2026.ts';
import {
  NORTHWEST_TERRITORIES_2025,
  NUNAVUT_2025,
  SASKATCHEWAN_2025,
} from './prairies-north-2025.ts';
import {
  NORTHWEST_TERRITORIES_2026,
  NUNAVUT_2026,
  SASKATCHEWAN_2026,
} from './prairies-north-2026.ts';
import { QUEBEC_2025 } from './qc-2025.ts';
import { QUEBEC_2026 } from './qc-2026.ts';
import { YUKON_2025 } from './yt-2025.ts';
import { YUKON_2026 } from './yt-2026.ts';
import type { ProvinceCode, ProvincialParameters } from './types.ts';

export type {
  BasicPersonalAmountPhaseOut,
  HealthPremiumBand,
  ProvinceCode,
  ProvincialParameters,
  SurtaxTier,
  TaxReduction,
  WorkerDeduction,
} from './types.ts';

/** Ordered west to east, then the territories, as Canadians usually list them. */
export const PROVINCES_2026: Readonly<Record<ProvinceCode, ProvincialParameters>> = {
  BC: BRITISH_COLUMBIA_2026,
  AB: ALBERTA_2026,
  SK: SASKATCHEWAN_2026,
  MB: MANITOBA_2026,
  ON: ONTARIO_2026,
  QC: QUEBEC_2026,
  NB: NEW_BRUNSWICK_2026,
  NS: NOVA_SCOTIA_2026,
  PE: PRINCE_EDWARD_ISLAND_2026,
  NL: NEWFOUNDLAND_2026,
  YT: YUKON_2026,
  NT: NORTHWEST_TERRITORIES_2026,
  NU: NUNAVUT_2026,
};

/** Same order, tax year 2025. */
export const PROVINCES_2025: Readonly<Record<ProvinceCode, ProvincialParameters>> = {
  BC: BRITISH_COLUMBIA_2025,
  AB: ALBERTA_2025,
  SK: SASKATCHEWAN_2025,
  MB: MANITOBA_2025,
  ON: ONTARIO_2025,
  QC: QUEBEC_2025,
  NB: NEW_BRUNSWICK_2025,
  NS: NOVA_SCOTIA_2025,
  PE: PRINCE_EDWARD_ISLAND_2025,
  NL: NEWFOUNDLAND_2025,
  YT: YUKON_2025,
  NT: NORTHWEST_TERRITORIES_2025,
  NU: NUNAVUT_2025,
};

/** Province codes the model supports, for populating a selector. */
export const SUPPORTED_PROVINCES = Object.keys(PROVINCES_2026) as ProvinceCode[];

/** Parameters for a supported province, in the current tax year. */
export function getProvince(code: ProvinceCode): ProvincialParameters {
  return PROVINCES_2026[code];
}
