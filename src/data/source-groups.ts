/**
 * Every parameter group in the model, for the citation list.
 *
 * Provinces are enumerated from the lookup rather than listed by hand, so a
 * jurisdiction added later cannot quietly fail to appear in the citations. A
 * provenance commitment with a stale citation list is worth very little.
 */

import { AUSTRIA_2026 } from './austria-2026.ts';
import { CANADA_FEDERAL_2026 } from './canada-federal-2026.ts';
import { CANADA_PAYROLL_2026 } from './canada-payroll-2026.ts';
import { CONVERSION_2026 } from './conversion-2026.ts';
import { QUEBEC_PAYROLL_2026 } from './quebec-payroll-2026.ts';
import { SUPPORTED_PROVINCES, getProvince } from './provinces/index.ts';

export const SOURCE_GROUPS: readonly { label: string; parameters: unknown }[] = [
  { label: 'Canada federal', parameters: CANADA_FEDERAL_2026 },
  { label: 'Canada payroll', parameters: CANADA_PAYROLL_2026 },
  { label: 'Quebec payroll', parameters: QUEBEC_PAYROLL_2026 },
  ...SUPPORTED_PROVINCES.map((code) => ({
    label: getProvince(code).name,
    parameters: getProvince(code) as unknown,
  })),
  { label: 'Austria', parameters: AUSTRIA_2026 },
  { label: 'Conversion', parameters: CONVERSION_2026 },
];
