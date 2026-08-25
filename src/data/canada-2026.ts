/**
 * Assembles the Canadian parameter set for a given province.
 *
 * This exists so the payroll parameters and the province can never be
 * mismatched. Pairing Quebec with CPP rates, or Ontario with QPP, would
 * produce plausible numbers that are simply wrong, and nothing in the type
 * system would catch it. One function, one place, one test.
 */

import { CANADA_FEDERAL_2026 } from './canada-federal-2026.ts';
import { CANADA_PAYROLL_2026 } from './canada-payroll-2026.ts';
import type { PayrollParameters } from './canada-payroll-2026.ts';
import { QUEBEC_PAYROLL_2026 } from './quebec-payroll-2026.ts';
import { getProvince, type ProvinceCode } from './provinces/index.ts';
import type { CanadaParameters } from '../engine/index.ts';

/** The payroll plans that apply in a province: QPP and QPIP in Quebec, CPP elsewhere. */
export function payrollFor(code: ProvinceCode): PayrollParameters {
  return code === 'QC' ? QUEBEC_PAYROLL_2026 : CANADA_PAYROLL_2026;
}

/** Federal, payroll and provincial parameters that belong together. */
export function canadaParametersFor(code: ProvinceCode): CanadaParameters {
  return {
    federal: CANADA_FEDERAL_2026,
    payroll: payrollFor(code),
    province: getProvince(code),
  };
}
