import { describe, expect, it } from 'vitest';
import { taxFromBrackets } from './brackets.ts';
import { computeCanada, type CanadaParameters } from './canada.ts';
import { CANADA_FEDERAL_2026 } from '../data/canada-federal-2026.ts';
import { CANADA_PAYROLL_2026 } from '../data/canada-payroll-2026.ts';
import { getProvince } from '../data/provinces/index.ts';
import type { BracketTable } from './types.ts';

const P: CanadaParameters = {
  federal: CANADA_FEDERAL_2026,
  payroll: CANADA_PAYROLL_2026,
  province: getProvince('BC'),
};

/**
 * CRA publishes, in T4127 Table 8.1, a constant per bracket such that
 *
 *   tax = rate x income - constant
 *
 * holds anywhere inside that bracket. The constants are derived from the rate
 * table, so reproducing them checks our brackets against CRA's own arithmetic
 * rather than against the page the rates were transcribed from.
 *
 * This is the check that catches the CRA brackets page typo: with BC's first
 * rate at the published 5.6%, the second constant computes to about 1,058
 * instead of the 1,330 CRA publishes. At 5.06% it lands on 1,330 exactly.
 */
function bracketConstants(table: BracketTable): number[] {
  return table.map((band) =>
    Math.round(band.rate * band.from - taxFromBrackets(band.from, table)),
  );
}

describe('T4127 Table 8.1 bracket constants', () => {
  it('reproduces the federal constants K', () => {
    expect(bracketConstants(CANADA_FEDERAL_2026.brackets.value)).toEqual([
      0, 3_804, 10_241, 15_685, 26_024,
    ]);
  });

  it('reproduces the British Columbia constants KP', () => {
    expect(bracketConstants(getProvince('BC').brackets.value)).toEqual([
      0, 1_330, 4_150, 6_220, 9_604, 13_603, 23_428,
    ]);
  });

  it('would not reproduce KP if the CRA brackets page 5.6% were used', () => {
    const wrong = getProvince('BC').brackets.value.map((band, index) =>
      index === 0 ? { ...band, rate: 0.056 } : band,
    );
    expect(bracketConstants(wrong)[1]).not.toBe(1_330);
  });
});

describe('computeCanada', () => {
  it('deducts the deductible payroll portion before computing tax', () => {
    const result = computeCanada(100_000, P);
    expect(result.taxableIncome).toBeCloseTo(
      100_000 - result.payroll.deductibleAmount,
      2,
    );
    // Maximum enhanced CPP 711.00 plus CPP2 416.00.
    expect(result.payroll.deductibleAmount).toBeCloseTo(1_127, 2);
  });

  it('matches a hand calculation at 100,000 gross in BC', () => {
    const result = computeCanada(100_000, P);

    expect(result.payroll.cppContribution).toBeCloseTo(4_230.45, 2);
    expect(result.payroll.cpp2Contribution).toBeCloseTo(416, 2);
    expect(result.payroll.eiPremium).toBeCloseTo(1_123.07, 2);
    expect(result.taxableIncome).toBeCloseTo(98_873, 2);

    // Federal: 58,523 at 14% plus 40,350 at 20.5%, less credits on
    // BPA 16,452 + CEA 1,501 + creditable payroll 4,642.52, at 14%.
    expect(result.federal.taxPayable).toBeCloseTo(13_301.6, 2);

    // BC: 50,363 at 5.06% plus 48,510 at 7.7%, less credits on
    // BPA 13,216 + creditable payroll 4,642.52, at 5.06%.
    expect(result.provincial.taxPayable).toBeCloseTo(5_380, 2);

    expect(result.netIncome).toBeCloseTo(75_548.88, 2);
  });

  it('grants both governments the credit on the same payroll amounts', () => {
    const result = computeCanada(100_000, P);
    expect(result.federal.additionalCreditAmounts).toBeCloseTo(
      result.provincial.additionalCreditAmounts,
      2,
    );
    // CPP base 3,519.45 plus EI 1,123.07.
    expect(result.federal.additionalCreditAmounts).toBeCloseTo(4_642.52, 2);
  });

  it('reconciles net income against gross less tax and contributions', () => {
    for (const gross of [40_000, 60_000, 100_000, 200_000, 300_000]) {
      const r = computeCanada(gross, P);
      expect(r.netIncome).toBeCloseTo(
        gross -
          r.federal.taxPayable -
          r.provincial.taxPayable -
          r.payroll.totalContributions,
        2,
      );
      expect(r.totalDeductions).toBeCloseTo(gross - r.netIncome, 2);
    }
  });

  it('leaves net income rising with gross across the modelled range', () => {
    let previous = -1;
    for (let gross = 0; gross <= 300_000; gross += 2_500) {
      const { netIncome } = computeCanada(gross, P);
      expect(netIncome).toBeGreaterThan(previous);
      previous = netIncome;
    }
  });

  it('keeps the effective deduction rate rising and bounded', () => {
    let previous = -1;
    for (let gross = 20_000; gross <= 300_000; gross += 10_000) {
      const { effectiveDeductionRate } = computeCanada(gross, P);
      expect(effectiveDeductionRate).toBeGreaterThan(0);
      expect(effectiveDeductionRate).toBeLessThan(0.535);
      expect(effectiveDeductionRate).toBeGreaterThan(previous);
      previous = effectiveDeductionRate;
    }
  });

  it('produces no tax at all at very low income', () => {
    const result = computeCanada(12_000, P);
    expect(result.federal.taxPayable).toBe(0);
    expect(result.provincial.taxPayable).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it('handles zero and negative gross without dividing by zero', () => {
    expect(computeCanada(0, P).effectiveDeductionRate).toBe(0);
    expect(computeCanada(-1_000, P).netIncome).toBe(0);
  });
});
