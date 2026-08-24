import { describe, expect, it } from 'vitest';
import { validateBracketTable } from './brackets.ts';
import {
  basicPersonalAmount,
  canadaEmploymentAmount,
  computeFederalTax,
} from './canada-federal.ts';
import {
  CANADA_FEDERAL_2026 as P,
  CANADA_FEDERAL_2026_BPA_MAX,
} from '../data/canada-federal-2026.ts';

describe('2026 federal parameters', () => {
  it('has a structurally valid bracket table', () => {
    expect(validateBracketTable(P.brackets.value)).toEqual([]);
  });

  it('derives the published maximum basic personal amount', () => {
    // CRA publishes base, supplement and maximum separately. If any drifts,
    // this catches it.
    expect(CANADA_FEDERAL_2026_BPA_MAX).toBe(16_452);
  });

  it('uses the lowest bracket rate as the credit rate', () => {
    expect(P.creditRate.value).toBe(P.brackets.value[0]?.rate);
  });

  it('phases the basic personal amount out across the 29% to 33% span', () => {
    expect(P.basicPersonalAmountPhaseOutStart.value).toBe(P.brackets.value[3]?.from);
    expect(P.basicPersonalAmountPhaseOutEnd.value).toBe(P.brackets.value[4]?.from);
  });

  it('carries provenance on every value', () => {
    for (const [name, entry] of Object.entries(P)) {
      expect(entry.source, `${name} source`).toMatch(/^https:\/\/www\.canada\.ca\//);
      expect(entry.retrieved, `${name} retrieved`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('is consistent with the published indexation factor', () => {
    // 2026 thresholds are the 2025 thresholds indexed by 2%, rounded to the
    // nearest dollar per Income Tax Act section 117.1. If CRA revises either
    // the factor or a threshold, this disagreement surfaces here.
    const thresholds2025 = [57_375, 114_750, 177_882, 253_414];
    const factor = 1 + P.indexationFactor.value;
    const expected = thresholds2025.map((t) => Math.round(t * factor));
    const actual = P.brackets.value.slice(1).map((b) => b.from);
    expect(actual).toEqual(expected);
  });
});

describe('basicPersonalAmount', () => {
  it('is the maximum at and below the phase-out start', () => {
    expect(basicPersonalAmount(0, P)).toBe(16_452);
    expect(basicPersonalAmount(100_000, P)).toBe(16_452);
    expect(basicPersonalAmount(181_440, P)).toBe(16_452);
  });

  it('is the base amount at and above the phase-out end', () => {
    expect(basicPersonalAmount(258_482, P)).toBe(14_829);
    expect(basicPersonalAmount(500_000, P)).toBe(14_829);
  });

  it('sits at the midpoint halfway through the phase-out', () => {
    const midpoint = (181_440 + 258_482) / 2;
    expect(basicPersonalAmount(midpoint, P)).toBeCloseTo((16_452 + 14_829) / 2, 6);
  });

  it('is continuous at both ends of the phase-out', () => {
    expect(basicPersonalAmount(181_441, P)).toBeCloseTo(16_452, 1);
    expect(basicPersonalAmount(258_481, P)).toBeCloseTo(14_829, 1);
  });

  it('decreases monotonically across the phase-out', () => {
    let previous = Number.POSITIVE_INFINITY;
    for (let income = 181_000; income <= 259_000; income += 1_000) {
      const amount = basicPersonalAmount(income, P);
      expect(amount).toBeLessThanOrEqual(previous);
      previous = amount;
    }
  });
});

describe('canadaEmploymentAmount', () => {
  it('caps at the published maximum', () => {
    expect(canadaEmploymentAmount(80_000, P)).toBe(1_501);
  });

  it('is limited to employment income when that is lower', () => {
    expect(canadaEmploymentAmount(900, P)).toBe(900);
  });

  it('is zero without employment income', () => {
    expect(canadaEmploymentAmount(0, P)).toBe(0);
    expect(canadaEmploymentAmount(-100, P)).toBe(0);
  });
});

describe('computeFederalTax', () => {
  it('produces no tax at incomes covered by the credits', () => {
    const result = computeFederalTax(
      { taxableIncome: 15_000, employmentIncome: 15_000 },
      P,
    );
    expect(result.taxPayable).toBe(0);
  });

  it('never returns negative tax, since these credits are non-refundable', () => {
    const result = computeFederalTax(
      { taxableIncome: 1_000, employmentIncome: 1_000 },
      P,
    );
    expect(result.taxPayable).toBe(0);
  });

  it('applies bracket rates then subtracts credits at the credit rate', () => {
    const income = 80_000;
    const result = computeFederalTax(
      { taxableIncome: income, employmentIncome: income },
      P,
    );

    // 58,523 at 14% plus 21,477 at 20.5%.
    const expectedBeforeCredits = 58_523 * 0.14 + (80_000 - 58_523) * 0.205;
    expect(result.taxBeforeCredits).toBeCloseTo(expectedBeforeCredits, 2);

    const expectedCredits = (16_452 + 1_501) * 0.14;
    expect(result.creditValue).toBeCloseTo(expectedCredits, 2);
    expect(result.taxPayable).toBeCloseTo(expectedBeforeCredits - expectedCredits, 2);
  });

  it('passes additional credit amounts through at the credit rate', () => {
    const base = computeFederalTax(
      { taxableIncome: 80_000, employmentIncome: 80_000 },
      P,
    );
    const withPayroll = computeFederalTax(
      {
        taxableIncome: 80_000,
        employmentIncome: 80_000,
        additionalCreditAmounts: 4_000,
      },
      P,
    );
    expect(base.taxPayable - withPayroll.taxPayable).toBeCloseTo(4_000 * 0.14, 2);
  });

  it('rises monotonically with income across the modelled range', () => {
    let previous = -1;
    for (let income = 40_000; income <= 300_000; income += 5_000) {
      const { taxPayable } = computeFederalTax(
        { taxableIncome: income, employmentIncome: income },
        P,
      );
      expect(taxPayable).toBeGreaterThan(previous);
      previous = taxPayable;
    }
  });

  it('keeps the effective rate below the top marginal rate', () => {
    for (const income of [40_000, 100_000, 200_000, 300_000]) {
      const { taxPayable } = computeFederalTax(
        { taxableIncome: income, employmentIncome: income },
        P,
      );
      expect(taxPayable / income).toBeLessThan(0.33);
    }
  });
});
