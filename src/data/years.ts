/**
 * Tax year registry.
 *
 * One year today. The registry exists anyway, for the same reason the province
 * lookup shipped with one entry: it makes adding a year a data change rather
 * than a code change, and it gives the annual refresh a single obvious place
 * to start.
 *
 * If adding a year ever requires touching `src/engine/`, the parameter
 * abstraction has leaked and that is the bug to fix first. A test in
 * `years.test.ts` guards the shape.
 *
 * See `docs/ANNUAL_UPDATE.md` for the refresh procedure.
 */

import { AUSTRIA_2026 } from './austria-2026.ts';
import { CANADA_FEDERAL_2026 } from './canada-federal-2026.ts';
import { CANADA_PAYROLL_2026 } from './canada-payroll-2026.ts';
import { CONVERSION_2026 } from './conversion-2026.ts';
import { QUEBEC_PAYROLL_2026 } from './quebec-payroll-2026.ts';
import { PROVINCES_2026 } from './provinces/index.ts';
import type { AustrianParameters } from './austria-2026.ts';
import type { FederalParameters } from './canada-federal-2026.ts';
import type { PayrollParameters } from './canada-payroll-2026.ts';
import type { ConversionParameters } from './conversion-2026.ts';
import type { ProvinceCode, ProvincialParameters } from './provinces/index.ts';

/** Everything the model needs for one tax year. */
export interface TaxYearParameters {
  readonly year: number;
  readonly federal: FederalParameters;
  readonly payroll: PayrollParameters;
  readonly quebecPayroll: PayrollParameters;
  readonly provinces: Readonly<Record<ProvinceCode, ProvincialParameters>>;
  readonly austria: AustrianParameters;
  readonly conversion: ConversionParameters;
}

const YEARS: Readonly<Record<number, TaxYearParameters>> = {
  2026: {
    year: 2026,
    federal: CANADA_FEDERAL_2026,
    payroll: CANADA_PAYROLL_2026,
    quebecPayroll: QUEBEC_PAYROLL_2026,
    provinces: PROVINCES_2026,
    austria: AUSTRIA_2026,
    conversion: CONVERSION_2026,
  },
};

/** Tax years the model supports, newest first. */
export const TAX_YEARS: readonly number[] = Object.keys(YEARS)
  .map(Number)
  .sort((a, b) => b - a);

/** The year used when none is chosen. */
export const CURRENT_TAX_YEAR = TAX_YEARS[0] as number;

/** Parameters for a supported tax year. */
export function parametersForYear(year: number): TaxYearParameters {
  const parameters = YEARS[year];
  if (!parameters) {
    throw new RangeError(
      `No parameters for tax year ${year}. Supported: ${TAX_YEARS.join(', ')}.`,
    );
  }
  return parameters;
}
