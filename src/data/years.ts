/**
 * Tax year registry.
 *
 * Two years now: 2026, and 2025 backfilled behind it. The registry makes adding
 * a year a data change rather than a code change, and gives the annual refresh
 * a single obvious place to start.
 *
 * Adding 2025 needed no change to `src/engine/`, which is the property the
 * registry exists to protect. It did move the parameter interfaces out of the
 * 2026 files and into `types.ts`, because a second year should not have to
 * import its shape from the first year's file.
 *
 * See `docs/ANNUAL_UPDATE.md` for the refresh procedure.
 */

import { AUSTRIA_2025 } from './austria-2025.ts';
import { AUSTRIA_2026 } from './austria-2026.ts';
import { CANADA_FEDERAL_2025 } from './canada-federal-2025.ts';
import { CANADA_FEDERAL_2026 } from './canada-federal-2026.ts';
import { CANADA_PAYROLL_2025 } from './canada-payroll-2025.ts';
import { CANADA_PAYROLL_2026 } from './canada-payroll-2026.ts';
import { CONVERSION_2025 } from './conversion-2025.ts';
import { CONVERSION_2026 } from './conversion-2026.ts';
import { QUEBEC_PAYROLL_2025 } from './quebec-payroll-2025.ts';
import { QUEBEC_PAYROLL_2026 } from './quebec-payroll-2026.ts';
import { PROVINCES_2025, PROVINCES_2026 } from './provinces/index.ts';
import type { ProvinceCode, ProvincialParameters } from './provinces/index.ts';
import type {
  AustrianParameters,
  ConversionParameters,
  FederalParameters,
  PayrollParameters,
} from './types.ts';

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
  2025: {
    year: 2025,
    federal: CANADA_FEDERAL_2025,
    payroll: CANADA_PAYROLL_2025,
    quebecPayroll: QUEBEC_PAYROLL_2025,
    provinces: PROVINCES_2025,
    austria: AUSTRIA_2025,
    conversion: CONVERSION_2025,
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
