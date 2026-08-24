import { describe, expect, it } from 'vitest';
import {
  computePayroll,
  cpp2Contribution,
  cppContribution,
  eiPremium,
} from './canada-payroll.ts';
import { CANADA_PAYROLL_2026 as P } from '../data/canada-payroll-2026.ts';
import type { Sourced } from './types.ts';

describe('2026 payroll parameters', () => {
  it('splits the CPP rate into base plus first additional', () => {
    expect(P.cpp.baseRate.value + P.cpp.firstAdditionalRate.value).toBeCloseTo(
      P.cpp.rate.value,
      10,
    );
  });

  it('derives the published CPP maximum from earnings and rate', () => {
    const contributory =
      P.cpp.maximumPensionableEarnings.value - P.cpp.basicExemption.value;
    expect(contributory).toBe(71_100);
    expect(contributory * P.cpp.rate.value).toBeCloseTo(
      P.cpp.maximumContribution.value,
      2,
    );
  });

  it('derives the published CPP2 maximum from the earnings band and rate', () => {
    const band =
      P.cpp2.additionalMaximumPensionableEarnings.value -
      P.cpp.maximumPensionableEarnings.value;
    expect(band).toBe(10_400);
    expect(band * P.cpp2.rate.value).toBeCloseTo(P.cpp2.maximumContribution.value, 2);
  });

  it('derives the published EI maximum from insurable earnings and rate', () => {
    expect(P.ei.maximumInsurableEarnings.value * P.ei.rate.value).toBeCloseTo(
      P.ei.maximumPremium.value,
      2,
    );
  });

  it('matches the T4127 maximum deductible and creditable CPP amounts', () => {
    const contributory =
      P.cpp.maximumPensionableEarnings.value - P.cpp.basicExemption.value;
    // T4127 formula F5 caps the enhanced deduction at 711.00.
    expect(contributory * P.cpp.firstAdditionalRate.value).toBeCloseTo(711, 2);
    // T4127 formula K2 caps the creditable base amount at 3,519.45.
    expect(contributory * P.cpp.baseRate.value).toBeCloseTo(3_519.45, 2);
  });

  it('carries provenance on every value', () => {
    const groups = Object.values(P) as Record<string, Sourced<number>>[];
    for (const group of groups) {
      for (const [name, entry] of Object.entries(group)) {
        expect(entry.source, `${name} source`).toMatch(/^https:\/\/www\.canada\.ca\//);
        expect(entry.retrieved, `${name} retrieved`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});

describe('cppContribution', () => {
  it('is zero at or below the basic exemption', () => {
    expect(cppContribution(3_500, P)).toBe(0);
    expect(cppContribution(0, P)).toBe(0);
    expect(cppContribution(-100, P)).toBe(0);
  });

  it('applies the rate to earnings above the exemption', () => {
    expect(cppContribution(40_000, P)).toBeCloseTo((40_000 - 3_500) * 0.0595, 2);
  });

  it('plateaus at the maximum from the YMPE upward', () => {
    expect(cppContribution(74_600, P)).toBeCloseTo(4_230.45, 2);
    expect(cppContribution(300_000, P)).toBeCloseTo(4_230.45, 2);
  });

  it('is continuous at the ceiling', () => {
    expect(cppContribution(74_599, P)).toBeLessThan(cppContribution(74_600, P));
    expect(cppContribution(74_601, P)).toBeCloseTo(cppContribution(74_600, P), 6);
  });
});

describe('cpp2Contribution', () => {
  it('is zero at or below the YMPE', () => {
    expect(cpp2Contribution(74_600, P)).toBe(0);
    expect(cpp2Contribution(50_000, P)).toBe(0);
  });

  it('applies within the band above the YMPE', () => {
    expect(cpp2Contribution(80_000, P)).toBeCloseTo((80_000 - 74_600) * 0.04, 2);
  });

  it('plateaus at the maximum from the YAMPE upward', () => {
    expect(cpp2Contribution(85_000, P)).toBeCloseTo(416, 2);
    expect(cpp2Contribution(300_000, P)).toBeCloseTo(416, 2);
  });
});

describe('eiPremium', () => {
  it('applies the rate below the maximum insurable earnings', () => {
    expect(eiPremium(40_000, P)).toBeCloseTo(40_000 * 0.0163, 2);
  });

  it('plateaus at the maximum premium', () => {
    expect(eiPremium(68_900, P)).toBeCloseTo(1_123.07, 2);
    expect(eiPremium(300_000, P)).toBeCloseTo(1_123.07, 2);
  });

  it('has no exemption, unlike CPP', () => {
    expect(eiPremium(1_000, P)).toBeCloseTo(16.3, 2);
  });
});

describe('computePayroll', () => {
  it('splits CPP into a deductible and a creditable portion that sum to the whole', () => {
    for (const income of [10_000, 40_000, 74_600, 100_000, 300_000]) {
      const result = computePayroll(income, P);
      const cppParts =
        result.deductibleAmount -
        result.cpp2Contribution +
        (result.creditableAmount - result.eiPremium);
      expect(cppParts).toBeCloseTo(result.cppContribution, 2);
    }
  });

  it('reaches the T4127 maximum deduction and credit at high income', () => {
    const result = computePayroll(300_000, P);
    // Enhanced CPP 711.00 plus CPP2 416.00.
    expect(result.deductibleAmount).toBeCloseTo(711 + 416, 2);
    // Base CPP 3,519.45 plus EI 1,123.07.
    expect(result.creditableAmount).toBeCloseTo(3_519.45 + 1_123.07, 2);
  });

  it('totals the three contributions', () => {
    const result = computePayroll(60_000, P);
    expect(result.totalContributions).toBeCloseTo(
      result.cppContribution + result.cpp2Contribution + result.eiPremium,
      2,
    );
  });

  it('never decreases as income rises', () => {
    let previous = -1;
    for (let income = 0; income <= 300_000; income += 2_500) {
      const { totalContributions } = computePayroll(income, P);
      expect(totalContributions).toBeGreaterThanOrEqual(previous);
      previous = totalContributions;
    }
  });

  it('caps total contributions across the whole range', () => {
    const maximum = 4_230.45 + 416 + 1_123.07;
    expect(computePayroll(1_000_000, P).totalContributions).toBeCloseTo(maximum, 2);
  });
});
