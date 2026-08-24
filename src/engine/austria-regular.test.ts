import { describe, expect, it } from 'vitest';
import { validateBracketTable } from './brackets.ts';
import {
  commutingCreditSupplement,
  computeAustriaRegular,
  regularSocialInsurance,
  unemploymentRate,
} from './austria-regular.ts';
import { AUSTRIA_2026 as P } from '../data/austria-2026.ts';

const SI = P.socialInsurance;

describe('2026 Austrian parameters', () => {
  it('has a structurally valid bracket table', () => {
    expect(validateBracketTable(P.brackets.value)).toEqual([]);
  });

  it('starts with a zero-rate band, unlike the Canadian tables', () => {
    expect(P.brackets.value[0]?.rate).toBe(0);
    expect(P.brackets.value[0]?.to).toBe(13_539);
  });

  it('is consistent with the published indexation factor', () => {
    // 2026 bands are the 2025 bands raised by two thirds of the computed
    // inflation rate, which BMF states as 1.733%. This checks the
    // transcription independently of the page it was read from.
    //
    // Unlike the Canadian thresholds, the match is not exact to the dollar:
    // Austria enacts the amounts by regulation rather than deriving them
    // arithmetically, so two bands land one euro above the naive product. A
    // one euro tolerance still catches any transcription error of real size.
    const bands2025 = [13_308, 21_617, 35_836, 69_166, 103_072];
    const factor = 1 + P.indexationFactor.value;
    const actual = P.brackets.value.slice(1, 6).map((b) => b.from);

    actual.forEach((value, index) => {
      const naive = (bands2025[index] as number) * factor;
      expect(Math.abs(value - naive), `band ${index + 1}`).toBeLessThanOrEqual(1);
    });
  });

  it('keeps the temporary top band above the millionth euro', () => {
    const top = P.brackets.value[P.brackets.value.length - 1];
    expect(top?.from).toBe(1_000_000);
    expect(top?.rate).toBe(0.55);
  });

  it('sums the employee rates to the published 18.07%', () => {
    const top = SI.unemploymentScale.value[SI.unemploymentScale.value.length - 1];
    const total =
      SI.healthRate.value +
      SI.pensionRate.value +
      SI.chamberRate.value +
      SI.housingRate.value +
      (top?.rate ?? 0);
    expect(total).toBeCloseTo(0.1807, 10);
  });

  it('carries provenance on every value', () => {
    const entries = [
      P.brackets,
      P.indexationFactor,
      P.employmentExpenseAllowance,
      P.commutingCredit,
      P.commutingCreditSupplement,
      P.commutingCreditSupplementPhaseOutStart,
      P.commutingCreditSupplementPhaseOutEnd,
      P.socialInsuranceRefundRate,
      P.socialInsuranceRefundMaximum,
      P.socialInsuranceRefundBonus,
      SI.healthRate,
      SI.pensionRate,
      SI.chamberRate,
      SI.housingRate,
      SI.unemploymentScale,
      SI.monthlyCeiling,
    ];
    for (const entry of entries) {
      expect(entry.source).toMatch(/^https:\/\//);
      expect(entry.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('unemploymentRate', () => {
  const scale = SI.unemploymentScale.value;

  it('is zero at the lowest band', () => {
    expect(unemploymentRate(1_500, scale)).toBe(0);
    expect(unemploymentRate(2_225, scale)).toBe(0);
  });

  it('steps up through the graduated bands', () => {
    expect(unemploymentRate(2_226, scale)).toBe(0.01);
    expect(unemploymentRate(2_427, scale)).toBe(0.01);
    expect(unemploymentRate(2_428, scale)).toBe(0.02);
    expect(unemploymentRate(2_630, scale)).toBe(0.02);
  });

  it('reaches the full rate above the top band', () => {
    expect(unemploymentRate(2_631, scale)).toBe(0.0295);
    expect(unemploymentRate(10_000, scale)).toBe(0.0295);
  });

  it('never decreases as pay rises', () => {
    let previous = -1;
    for (let monthly = 0; monthly <= 8_000; monthly += 50) {
      const rate = unemploymentRate(monthly, scale);
      expect(rate).toBeGreaterThanOrEqual(previous);
      previous = rate;
    }
  });
});

describe('regularSocialInsurance', () => {
  it('applies the full 18.07% above the graduated bands', () => {
    const result = regularSocialInsurance(60_000, SI);
    expect(result.totalRate).toBeCloseTo(0.1807, 10);
    expect(result.contribution).toBeCloseTo(60_000 * 0.1807, 2);
  });

  it('caps the basis at the monthly ceiling', () => {
    const ceiling = SI.monthlyCeiling.value * 12;
    const result = regularSocialInsurance(300_000, SI);
    expect(result.annualBasis).toBeCloseTo(ceiling, 2);
    expect(result.contribution).toBeCloseTo(ceiling * 0.1807, 2);
  });

  it('plateaus once the ceiling binds', () => {
    const atCeiling = regularSocialInsurance(83_160, SI).contribution;
    expect(regularSocialInsurance(200_000, SI).contribution).toBeCloseTo(atCeiling, 2);
  });

  it('drops the unemployment component at low pay', () => {
    // 24,000 a year is 2,000 a month, inside the zero band.
    const result = regularSocialInsurance(24_000, SI);
    expect(result.unemploymentRate).toBe(0);
    expect(result.totalRate).toBeCloseTo(0.1512, 10);
  });
});

describe('commutingCreditSupplement', () => {
  it('is the full amount up to the phase-out start', () => {
    expect(commutingCreditSupplement(0, P)).toBe(804);
    expect(commutingCreditSupplement(19_761, P)).toBe(804);
  });

  it('is zero at and above the phase-out end', () => {
    expect(commutingCreditSupplement(30_259, P)).toBe(0);
    expect(commutingCreditSupplement(50_000, P)).toBe(0);
  });

  it('is half the amount at the midpoint', () => {
    const midpoint = (19_761 + 30_259) / 2;
    expect(commutingCreditSupplement(midpoint, P)).toBeCloseTo(402, 6);
  });

  it('decreases monotonically', () => {
    let previous = Number.POSITIVE_INFINITY;
    for (let income = 19_000; income <= 31_000; income += 250) {
      const amount = commutingCreditSupplement(income, P);
      expect(amount).toBeLessThanOrEqual(previous);
      previous = amount;
    }
  });
});

describe('computeAustriaRegular', () => {
  it('deducts social insurance before computing tax', () => {
    const result = computeAustriaRegular(60_000, P);
    expect(result.taxableIncome).toBeCloseTo(
      60_000 - result.socialInsurance.contribution - 132,
      2,
    );
  });

  it('matches a hand calculation at 60,000 regular gross', () => {
    const result = computeAustriaRegular(60_000, P);

    const si = 60_000 * 0.1807;
    expect(result.socialInsurance.contribution).toBeCloseTo(si, 2);

    const taxable = 60_000 - si - 132;
    expect(result.taxableIncome).toBeCloseTo(taxable, 2);

    // Bands: 13,539 free, then 20%, 30%, 40%.
    const expectedTax =
      (21_992 - 13_539) * 0.2 + (36_458 - 21_992) * 0.3 + (taxable - 36_458) * 0.4;
    expect(result.taxBeforeCredits).toBeCloseTo(expectedTax, 2);

    // Above the supplement phase-out, so only the base credit applies.
    expect(result.commutingCreditSupplement).toBe(0);
    expect(result.incomeTax).toBeCloseTo(expectedTax - 496, 2);
  });

  it('produces a negative tax refund at low income', () => {
    const result = computeAustriaRegular(14_000, P);
    expect(result.taxAfterCredits).toBeLessThan(0);
    expect(result.socialInsuranceRefund).toBeGreaterThan(0);
    expect(result.incomeTax).toBeLessThan(0);
    // Net pay exceeds gross less contributions, because tax is negative.
    expect(result.netIncome).toBeGreaterThan(
      14_000 - result.socialInsurance.contribution,
    );
  });

  it('caps the refund at the statutory maximum plus the bonus', () => {
    const result = computeAustriaRegular(16_000, P);
    expect(result.socialInsuranceRefund).toBeLessThanOrEqual(496 + 804);
  });

  it('does not refund once tax is positive', () => {
    const result = computeAustriaRegular(40_000, P);
    expect(result.socialInsuranceRefund).toBe(0);
    expect(result.incomeTax).toBeGreaterThan(0);
  });

  it('never lets the flat allowance create a loss', () => {
    const result = computeAustriaRegular(100, P);
    expect(result.taxableIncome).toBeGreaterThanOrEqual(0);
  });

  it('leaves net income rising with gross across the modelled range', () => {
    let previous = -1;
    for (let gross = 0; gross <= 300_000; gross += 2_500) {
      const { netIncome } = computeAustriaRegular(gross, P);
      expect(netIncome).toBeGreaterThan(previous);
      previous = netIncome;
    }
  });

  it('keeps the effective rate below the top marginal rate', () => {
    for (const gross of [40_000, 100_000, 300_000]) {
      const result = computeAustriaRegular(gross, P);
      const deductions = result.socialInsurance.contribution + result.incomeTax;
      expect(deductions / gross).toBeLessThan(0.55);
    }
  });
});
