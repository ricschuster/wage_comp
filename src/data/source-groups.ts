/**
 * Every parameter group in the model, for the citation list.
 *
 * Provinces are enumerated from the lookup rather than listed by hand, so a
 * jurisdiction added later cannot quietly fail to appear in the citations. A
 * provenance commitment with a stale citation list is worth very little, and
 * the same argument applies to tax years: `sourceGroupsForYear` exists so the
 * provenance test can walk every year, not just the one on screen.
 */

import { CURRENT_TAX_YEAR, parametersForYear } from './years.ts';
import { SUPPORTED_PROVINCES } from './provinces/index.ts';

export interface SourceGroup {
  readonly label: string;
  readonly parameters: unknown;
}

/** Parameter groups for one tax year. */
export function sourceGroupsForYear(year: number): readonly SourceGroup[] {
  const p = parametersForYear(year);
  return [
    { label: 'Canada federal', parameters: p.federal },
    { label: 'Canada payroll', parameters: p.payroll },
    { label: 'Quebec payroll', parameters: p.quebecPayroll },
    ...SUPPORTED_PROVINCES.map((code) => ({
      label: p.provinces[code].name,
      parameters: p.provinces[code] as unknown,
    })),
    { label: 'Austria', parameters: p.austria },
    { label: 'Conversion', parameters: p.conversion },
  ];
}

/** The groups shown on the methodology page: the current tax year. */
export const SOURCE_GROUPS: readonly SourceGroup[] =
  sourceGroupsForYear(CURRENT_TAX_YEAR);
