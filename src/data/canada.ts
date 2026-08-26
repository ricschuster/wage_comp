/**
 * Assembles the Canadian parameter set for a province and a tax year.
 *
 * This exists so the payroll parameters and the province can never be
 * mismatched. Pairing Quebec with CPP rates, or Ontario with QPP, would
 * produce plausible numbers that are simply wrong, and nothing in the type
 * system would catch it. One function, one place, one test.
 *
 * The year defaults to the current one, so callers that do not care about a
 * year never have to name it.
 */

import type { ProvinceCode } from './provinces/index.ts';
import type { PayrollParameters } from './types.ts';
import { CURRENT_TAX_YEAR, parametersForYear } from './years.ts';
import type { CanadaParameters } from '../engine/index.ts';

/** The payroll plans that apply in a province: QPP and QPIP in Quebec, CPP elsewhere. */
export function payrollFor(
  code: ProvinceCode,
  year: number = CURRENT_TAX_YEAR,
): PayrollParameters {
  const parameters = parametersForYear(year);
  return code === 'QC' ? parameters.quebecPayroll : parameters.payroll;
}

/** Federal, payroll and provincial parameters that belong together. */
export function canadaParametersFor(
  code: ProvinceCode,
  year: number = CURRENT_TAX_YEAR,
): CanadaParameters {
  const parameters = parametersForYear(year);
  return {
    federal: parameters.federal,
    payroll: payrollFor(code, year),
    province: parameters.provinces[code],
  };
}
