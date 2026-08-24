/**
 * Progressive rate schedules.
 *
 * Shared by Canadian federal and provincial income tax, Austrian income tax,
 * and the Austrian Jahressechstel bands applied to special payments. Keeping
 * one implementation means a bracket bug is a bug in one place, and the
 * validation below runs against every table that ships.
 */

import type { Bracket, BracketTable } from './types.ts';

/**
 * Tax payable on `income` under a progressive schedule.
 *
 * Each band's rate applies only to the portion of income falling inside it.
 * Income at or below zero produces zero.
 */
export function taxFromBrackets(income: number, table: BracketTable): number {
  if (!Number.isFinite(income)) {
    throw new RangeError(`taxFromBrackets expects a finite income, got ${income}`);
  }
  if (income <= 0) {
    return 0;
  }

  let tax = 0;
  for (const band of table) {
    if (income <= band.from) {
      break;
    }
    const upper = band.to === null ? income : Math.min(income, band.to);
    tax += (upper - band.from) * band.rate;
  }
  return tax;
}

/**
 * The marginal rate that applies to the next dollar earned at `income`.
 *
 * Boundaries resolve upward: income exactly at a band's `to` sits in the band
 * above, matching how `taxFromBrackets` treats the same dollar.
 */
export function marginalRateAt(income: number, table: BracketTable): number {
  if (!Number.isFinite(income)) {
    throw new RangeError(`marginalRateAt expects a finite income, got ${income}`);
  }

  const clamped = income > 0 ? income : 0;
  for (const band of table) {
    if (band.to === null || clamped < band.to) {
      return band.rate;
    }
  }
  return table.length > 0 ? (table[table.length - 1] as Bracket).rate : 0;
}

/**
 * Structural problems with a bracket table, as human-readable strings.
 *
 * Returns an empty array for a valid table. Every shipped table is asserted
 * clean by its jurisdiction's test suite, which catches transcription errors
 * such as a gap between bands or a rate entered as 15 instead of 0.15.
 */
export function validateBracketTable(table: BracketTable): string[] {
  const problems: string[] = [];

  if (table.length === 0) {
    return ['table is empty'];
  }

  const first = table[0] as Bracket;
  if (first.from !== 0) {
    problems.push(`first band starts at ${first.from}, expected 0`);
  }

  const last = table[table.length - 1] as Bracket;
  if (last.to !== null) {
    problems.push(`top band ends at ${last.to}, expected null for an open top band`);
  }

  table.forEach((band, index) => {
    if (band.rate < 0 || band.rate > 1) {
      problems.push(
        `band ${index} has rate ${band.rate}, expected a fraction between 0 and 1`,
      );
    }
    if (band.to !== null && band.to <= band.from) {
      problems.push(
        `band ${index} ends at ${band.to}, which is not above ${band.from}`,
      );
    }
    if (index > 0) {
      const previous = table[index - 1] as Bracket;
      if (previous.to !== band.from) {
        problems.push(
          `band ${index} starts at ${band.from}, but band ${index - 1} ends at ${previous.to}`,
        );
      }
      if (band.rate < previous.rate) {
        problems.push(
          `band ${index} has rate ${band.rate}, below band ${index - 1} at ${previous.rate}`,
        );
      }
    }
  });

  return problems;
}
