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
