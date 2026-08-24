import { describe, expect, it } from 'vitest';
import { computeAustria } from './austria.ts';
import { EquivalenceError, solveEquivalentAustrianGross } from './solve.ts';
import type { ComparisonOptions, ComparisonParameters } from './compare.ts';
import { AUSTRIA_2026 } from '../data/austria-2026.ts';
import { CANADA_FEDERAL_2026 } from '../data/canada-federal-2026.ts';
import { CANADA_PAYROLL_2026 } from '../data/canada-payroll-2026.ts';
import { CONVERSION_2026 } from '../data/conversion-2026.ts';
import { getProvince } from '../data/provinces/index.ts';

const P: ComparisonParameters = {
  canada: {
    federal: CANADA_FEDERAL_2026,
    payroll: CANADA_PAYROLL_2026,
    province: getProvince('BC'),
  },
  austria: AUSTRIA_2026,
  conversion: CONVERSION_2026,
};

const HOUSEHOLD: ComparisonOptions = {
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
};
const FX: ComparisonOptions = {
  basis: 'fx',
  pppBasis: 'household',
  specialPayments: true,
};

describe('solveEquivalentAustrianGross', () => {
  it('round trips: the solved gross reproduces the Canadian net', () => {
    for (const gross of [40_000, 60_000, 100_000, 200_000, 300_000]) {
      const result = solveEquivalentAustrianGross(gross, P, HOUSEHOLD);
      const austria = computeAustria(result.austriaGrossEur, AUSTRIA_2026, {
        specialPayments: true,
      });
      // Austrian net, converted back, must match the Canadian net.
      expect(austria.netIncome * result.rate).toBeCloseTo(result.canadaNetCad, 1);
    }
  });

  it('converges across the whole modelled range on both bases', () => {
    for (const options of [FX, HOUSEHOLD]) {
      for (let gross = 40_000; gross <= 300_000; gross += 20_000) {
        const result = solveEquivalentAustrianGross(gross, P, options);
        expect(result.austriaGrossEur).toBeGreaterThan(0);
        expect(Number.isFinite(result.austriaGrossEur)).toBe(true);
      }
    }
  });

  it('needs more Austrian gross where Austria taxes more heavily', () => {
    // At 100,000 the ratio of nets is about 0.91, so Austria must pay a
    // higher gross to land the same net.
    const result = solveEquivalentAustrianGross(100_000, P, HOUSEHOLD);
    expect(result.grossRatio).toBeGreaterThan(1);
  });

  it('needs less Austrian gross at incomes where Austria is ahead', () => {
    // Below the crossover Austria nets more at the same gross, so it needs
    // less gross to match.
    const result = solveEquivalentAustrianGross(40_000, P, HOUSEHOLD);
    expect(result.grossRatio).toBeLessThan(1);
  });

  it('expresses the answer in both currencies consistently', () => {
    const result = solveEquivalentAustrianGross(100_000, P, HOUSEHOLD);
    expect(result.austriaGrossCad).toBeCloseTo(result.austriaGrossEur * result.rate, 1);
  });

  it('produces a monotonically rising solved gross', () => {
    let previous = -1;
    for (let gross = 40_000; gross <= 300_000; gross += 10_000) {
      const { austriaGrossEur } = solveEquivalentAustrianGross(gross, P, HOUSEHOLD);
      expect(austriaGrossEur).toBeGreaterThan(previous);
      previous = austriaGrossEur;
    }
  });

  it('converges in far fewer than the iteration cap', () => {
    const result = solveEquivalentAustrianGross(100_000, P, HOUSEHOLD);
    expect(result.iterations).toBeLessThan(100);
  });

  it('rejects a non-positive or non-finite gross rather than guessing', () => {
    expect(() => solveEquivalentAustrianGross(0, P, HOUSEHOLD)).toThrow(
      EquivalenceError,
    );
    expect(() => solveEquivalentAustrianGross(-1, P, HOUSEHOLD)).toThrow(
      EquivalenceError,
    );
    expect(() => solveEquivalentAustrianGross(Number.NaN, P, HOUSEHOLD)).toThrow(
      EquivalenceError,
    );
  });

  it('reports failure rather than returning a bound when unreachable', () => {
    // An Austrian net can never reach an arbitrarily large target, because the
    // top marginal rate is 55%. Ask for a Canadian package so large that no
    // Austrian gross under the search ceiling matches it.
    const absurd: ComparisonParameters = {
      ...P,
      austria: {
        ...AUSTRIA_2026,
        brackets: {
          ...AUSTRIA_2026.brackets,
          // A 100% top rate makes net income stop rising, so no gross reaches
          // a high target and the solver must say so.
          value: [
            { from: 0, to: 10_000, rate: 0 },
            { from: 10_000, to: null, rate: 1 },
          ],
        },
      },
    };
    expect(() => solveEquivalentAustrianGross(300_000, absurd, HOUSEHOLD)).toThrow(
      EquivalenceError,
    );
  });

  it('respects the special payments toggle', () => {
    const on = solveEquivalentAustrianGross(100_000, P, {
      ...HOUSEHOLD,
      specialPayments: true,
    });
    const off = solveEquivalentAustrianGross(100_000, P, {
      ...HOUSEHOLD,
      specialPayments: false,
    });
    // Without the favourable special payment regime, more gross is needed.
    expect(off.austriaGrossEur).toBeGreaterThan(on.austriaGrossEur);
  });
});
