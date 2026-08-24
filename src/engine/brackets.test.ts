import { describe, expect, it } from 'vitest';
import { marginalRateAt, taxFromBrackets, validateBracketTable } from './brackets.ts';
import type { BracketTable } from './types.ts';

/** A three band schedule with round numbers, so expected values stay obvious. */
const TABLE: BracketTable = [
  { from: 0, to: 10_000, rate: 0.1 },
  { from: 10_000, to: 50_000, rate: 0.2 },
  { from: 50_000, to: null, rate: 0.3 },
];

describe('taxFromBrackets', () => {
  it('returns zero at and below zero income', () => {
    expect(taxFromBrackets(0, TABLE)).toBe(0);
    expect(taxFromBrackets(-5_000, TABLE)).toBe(0);
  });

  it('taxes income inside the first band at the first rate', () => {
    expect(taxFromBrackets(4_000, TABLE)).toBeCloseTo(400, 6);
  });

  it('applies each rate only to the portion inside its band', () => {
    // 10,000 at 10% plus 20,000 at 20%.
    expect(taxFromBrackets(30_000, TABLE)).toBeCloseTo(1_000 + 4_000, 6);
  });

  it('handles the open top band', () => {
    // 10,000 at 10%, 40,000 at 20%, 50,000 at 30%.
    expect(taxFromBrackets(100_000, TABLE)).toBeCloseTo(1_000 + 8_000 + 15_000, 6);
  });

  it('is continuous across a band boundary', () => {
    const below = taxFromBrackets(49_999, TABLE);
    const above = taxFromBrackets(50_001, TABLE);
    expect(above - below).toBeCloseTo(0.2 + 0.3, 6);
  });

  it('rejects non-finite income', () => {
    expect(() => taxFromBrackets(Number.NaN, TABLE)).toThrow(RangeError);
  });
});

describe('marginalRateAt', () => {
  it('reports the first rate at zero', () => {
    expect(marginalRateAt(0, TABLE)).toBe(0.1);
  });

  it('reports the rate of the band the income sits in', () => {
    expect(marginalRateAt(5_000, TABLE)).toBe(0.1);
    expect(marginalRateAt(30_000, TABLE)).toBe(0.2);
    expect(marginalRateAt(80_000, TABLE)).toBe(0.3);
  });

  it('resolves a boundary upward, matching taxFromBrackets', () => {
    expect(marginalRateAt(10_000, TABLE)).toBe(0.2);
    expect(marginalRateAt(50_000, TABLE)).toBe(0.3);
  });

  it('treats negative income as zero', () => {
    expect(marginalRateAt(-100, TABLE)).toBe(0.1);
  });

  it('rejects non-finite income', () => {
    expect(() => marginalRateAt(Number.NaN, TABLE)).toThrow(RangeError);
  });
});

describe('validateBracketTable', () => {
  it('accepts a well formed table', () => {
    expect(validateBracketTable(TABLE)).toEqual([]);
  });

  it('rejects an empty table', () => {
    expect(validateBracketTable([])).toHaveLength(1);
  });

  it('rejects a table that does not start at zero', () => {
    const problems = validateBracketTable([{ from: 1_000, to: null, rate: 0.1 }]);
    expect(problems.join(' ')).toContain('expected 0');
  });

  it('rejects a closed top band', () => {
    const problems = validateBracketTable([{ from: 0, to: 10_000, rate: 0.1 }]);
    expect(problems.join(' ')).toContain('open top band');
  });

  it('catches a gap between bands', () => {
    const problems = validateBracketTable([
      { from: 0, to: 10_000, rate: 0.1 },
      { from: 12_000, to: null, rate: 0.2 },
    ]);
    expect(problems.join(' ')).toContain('band 1 starts at 12000');
  });

  it('catches a rate entered as a percentage instead of a fraction', () => {
    const problems = validateBracketTable([
      { from: 0, to: 10_000, rate: 10 },
      { from: 10_000, to: null, rate: 20 },
    ]);
    expect(problems.join(' ')).toContain('expected a fraction');
  });

  it('catches a band that does not rise', () => {
    const problems = validateBracketTable([
      { from: 0, to: 10_000, rate: 0.1 },
      { from: 10_000, to: 5_000, rate: 0.2 },
    ]);
    expect(problems.join(' ')).toContain('not above');
  });

  it('catches a rate that falls below the band beneath it', () => {
    const problems = validateBracketTable([
      { from: 0, to: 10_000, rate: 0.3 },
      { from: 10_000, to: null, rate: 0.2 },
    ]);
    expect(problems.join(' ')).toContain('below band 0');
  });
});
