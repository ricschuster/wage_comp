/**
 * Public surface of the tax engine.
 *
 * Everything here is pure and free of React. The UI imports from this barrel;
 * engine modules import each other directly.
 */

export type { Bracket, BracketTable, Country, Sourced, TaxYear } from './types.ts';
export { marginalRateAt, taxFromBrackets, validateBracketTable } from './brackets.ts';
export { capAt, clampToZero, roundToCents } from './money.ts';
export {
  basicPersonalAmount,
  canadaEmploymentAmount,
  computeFederalTax,
} from './canada-federal.ts';
export type { FederalTaxBreakdown, FederalTaxInput } from './canada-federal.ts';
export {
  computePayroll,
  cpp2Contribution,
  cppContribution,
  eiPremium,
} from './canada-payroll.ts';
export type { PayrollBreakdown } from './canada-payroll.ts';
export { computeProvincialTax, taxReductionAmount } from './canada-provincial.ts';
export type {
  ProvincialTaxBreakdown,
  ProvincialTaxInput,
} from './canada-provincial.ts';
export { computeCanada } from './canada.ts';
export type { CanadaParameters, CanadaResult } from './canada.ts';
export {
  commutingCreditSupplement,
  computeAustriaRegular,
  regularSocialInsurance,
  unemploymentRate,
} from './austria-regular.ts';
export type {
  AustriaRegularBreakdown,
  RegularSocialInsuranceBreakdown,
} from './austria-regular.ts';
