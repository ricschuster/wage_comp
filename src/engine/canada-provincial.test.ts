import { describe, expect, it } from 'vitest';
import { validateBracketTable } from './brackets.ts';
import {
  computeProvincialTax,
  healthPremiumOn,
  surtaxOn,
  taxReductionAmount,
} from './canada-provincial.ts';
import {
  SUPPORTED_PROVINCES,
  getProvince,
  type ProvinceCode,
} from '../data/provinces/index.ts';

const AB = getProvince('AB');
const BC = getProvince('BC');
const ON = getProvince('ON');

describe('province lookup', () => {
  it('resolves each province by code rather than by a hardcoded branch', () => {
    expect(getProvince('AB').code).toBe('AB');
    expect(getProvince('BC').code).toBe('BC');
    expect(getProvince('ON').code).toBe('ON');
  });

  it('lists the supported provinces for a selector', () => {
    expect(SUPPORTED_PROVINCES).toEqual(['AB', 'BC', 'ON']);
  });

  it('gives every supported province a valid bracket table and a credit rate', () => {
    for (const code of SUPPORTED_PROVINCES) {
      const province = getProvince(code as ProvinceCode);
      expect(validateBracketTable(province.brackets.value), code).toEqual([]);
      expect(province.creditRate.value, code).toBe(province.brackets.value[0]?.rate);
    }
  });

  it('carries provenance on every province parameter', () => {
    for (const code of SUPPORTED_PROVINCES) {
      const p = getProvince(code as ProvinceCode);
      for (const entry of [p.brackets, p.creditRate, p.basicPersonalAmount]) {
        expect(entry.source, code).toMatch(/^https:\/\//);
        expect(entry.retrieved, code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('does not offer Quebec, which needs its own module', () => {
    expect(SUPPORTED_PROVINCES).not.toContain('QC');
  });
});

describe('published bracket constants', () => {
  // CRA publishes a constant KP per band such that tax = rate x income - KP.
  // Reproducing them checks each rate table against CRA's own arithmetic.
  const expected: Record<string, number[]> = {
    AB: [0, 1_224, 4_309, 6_160, 8_628, 12_331],
    BC: [0, 1_330, 4_150, 6_220, 9_604, 13_603, 23_428],
    ON: [0, 2_210, 4_376, 5_876, 8_076],
  };

  for (const code of SUPPORTED_PROVINCES) {
    it(`reproduces the constants for ${code}`, () => {
      const table = getProvince(code as ProvinceCode).brackets.value;
      const constants = table.map((band) => {
        let tax = 0;
        for (const lower of table) {
          if (band.from <= lower.from) break;
          const upper = lower.to === null ? band.from : Math.min(band.from, lower.to);
          tax += (upper - lower.from) * lower.rate;
        }
        return Math.round(band.rate * band.from - tax);
      });
      expect(constants).toEqual(expected[code]);
    });
  }
});

describe('2026 British Columbia parameters', () => {
  it('uses 5.06% as the lowest rate, not the 5.6% on the CRA brackets page', () => {
    expect(BC.brackets.value[0]?.rate).toBe(0.0506);
  });

  it('phases the tax reduction to exactly zero at the published income', () => {
    const r = BC.taxReduction;
    if (r?.kind !== 'phaseOut') throw new Error('BC should phase out');
    const zeroAt =
      r.phaseOutStart.value + r.maximumReduction.value / r.phaseOutRate.value;
    expect(zeroAt).toBeCloseTo(41_722, 0);
  });

  it('has no surtax or health premium', () => {
    expect(BC.surtax).toBeUndefined();
    expect(BC.healthPremium).toBeUndefined();
  });
});

describe('2026 Alberta parameters', () => {
  it('has the recent 8% first bracket', () => {
    expect(AB.brackets.value[0]?.rate).toBe(0.08);
  });

  it('has by far the largest basic personal amount', () => {
    expect(AB.basicPersonalAmount.value).toBe(22_769);
    expect(AB.basicPersonalAmount.value).toBeGreaterThan(BC.basicPersonalAmount.value);
    expect(AB.basicPersonalAmount.value).toBeGreaterThan(ON.basicPersonalAmount.value);
  });

  it('has no surtax, health premium or tax reduction', () => {
    expect(AB.surtax).toBeUndefined();
    expect(AB.healthPremium).toBeUndefined();
    expect(AB.taxReduction).toBeUndefined();
  });
});

describe('2026 Ontario parameters', () => {
  it('derives the published credit constant from the basic personal amount', () => {
    // T4127 publishes K1P of 655.94 for claim code 1.
    expect(ON.basicPersonalAmount.value * ON.creditRate.value).toBeCloseTo(655.94, 2);
  });

  it('has a two-tier surtax charged on tax, not income', () => {
    expect(ON.surtax?.value).toHaveLength(2);
    expect(ON.surtax?.value[0]?.over).toBe(5_818);
    expect(ON.surtax?.value[1]?.rate).toBe(0.36);
  });

  it('has a six-band health premium', () => {
    expect(ON.healthPremium?.value).toHaveLength(6);
  });
});

describe('surtaxOn', () => {
  const tiers = ON.surtax?.value ?? [];

  it('is zero below the first threshold', () => {
    expect(surtaxOn(0, tiers)).toBe(0);
    expect(surtaxOn(5_818, tiers)).toBe(0);
  });

  it('applies only the first tier between the thresholds', () => {
    expect(surtaxOn(7_000, tiers)).toBeCloseTo((7_000 - 5_818) * 0.2, 6);
  });

  it('stacks both tiers above the second threshold', () => {
    expect(surtaxOn(10_000, tiers)).toBeCloseTo(
      (10_000 - 5_818) * 0.2 + (10_000 - 7_446) * 0.36,
      6,
    );
  });

  it('never decreases as tax rises', () => {
    let previous = -1;
    for (let tax = 0; tax <= 40_000; tax += 250) {
      const value = surtaxOn(tax, tiers);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});

describe('healthPremiumOn', () => {
  const bands = ON.healthPremium?.value ?? [];

  it('is zero at or below the first threshold', () => {
    expect(healthPremiumOn(0, bands)).toBe(0);
    expect(healthPremiumOn(20_000, bands)).toBe(0);
  });

  it('caps each band at its published maximum', () => {
    expect(healthPremiumOn(36_000, bands)).toBe(300);
    expect(healthPremiumOn(48_000, bands)).toBe(450);
    expect(healthPremiumOn(72_000, bands)).toBe(600);
    expect(healthPremiumOn(200_000, bands)).toBe(750);
  });

  it('reaches the overall maximum at high income', () => {
    expect(healthPremiumOn(1_000_000, bands)).toBe(900);
  });

  it('never decreases as income rises', () => {
    let previous = -1;
    for (let income = 0; income <= 300_000; income += 1_000) {
      const value = healthPremiumOn(income, bands);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});

describe('taxReductionAmount', () => {
  it('shrinks with income under the phase-out form', () => {
    const r = BC.taxReduction;
    if (r?.kind !== 'phaseOut') throw new Error('BC should phase out');
    expect(taxReductionAmount(0, 5_000, r)).toBe(575);
    expect(taxReductionAmount(30_000, 5_000, r)).toBeCloseTo(
      575 - (30_000 - 25_570) * 0.0356,
      6,
    );
    expect(taxReductionAmount(60_000, 5_000, r)).toBe(0);
  });

  it('tapers with tax under the double-base form', () => {
    const r = ON.taxReduction;
    if (r?.kind !== 'doubleBase') throw new Error('ON should use double base');
    // Below the base, the whole tax is wiped out.
    expect(taxReductionAmount(0, 200, r)).toBe(200);
    // At the base it still covers the tax.
    expect(taxReductionAmount(0, 300, r)).toBe(300);
    // Beyond it, the reduction shrinks and reaches zero at twice the base.
    expect(taxReductionAmount(0, 500, r)).toBe(100);
    expect(taxReductionAmount(0, 600, r)).toBe(0);
    expect(taxReductionAmount(0, 5_000, r)).toBe(0);
  });
});

describe('computeProvincialTax', () => {
  it('produces no tax at incomes covered by the credits, in every province', () => {
    for (const code of SUPPORTED_PROVINCES) {
      const province = getProvince(code as ProvinceCode);
      const income = province.basicPersonalAmount.value - 100;
      expect(
        computeProvincialTax({ taxableIncome: income }, province).taxPayable,
        code,
      ).toBe(0);
    }
  });

  it('applies bracket rates then credits at the lowest rate', () => {
    const result = computeProvincialTax({ taxableIncome: 60_000 }, BC);
    const expectedBefore = 50_363 * 0.0506 + (60_000 - 50_363) * 0.077;
    expect(result.taxBeforeCredits).toBeCloseTo(expectedBefore, 2);
    expect(result.creditValue).toBeCloseTo(13_216 * 0.0506, 2);
  });

  it('charges the Ontario surtax on tax after credits', () => {
    const result = computeProvincialTax({ taxableIncome: 150_000 }, ON);
    expect(result.surtax).toBeCloseTo(
      surtaxOn(result.taxAfterCredits, ON.surtax?.value ?? []),
      2,
    );
    expect(result.surtax).toBeGreaterThan(0);
  });

  it('adds the Ontario health premium after the reduction, not before', () => {
    const result = computeProvincialTax({ taxableIncome: 100_000 }, ON);
    expect(result.healthPremium).toBe(750);
    // Tolerance of a cent: the total is rounded once, the parts individually.
    expect(result.taxPayable).toBeCloseTo(
      result.taxAfterCredits +
        result.surtax -
        result.taxReduction +
        result.healthPremium,
      1,
    );
  });

  it('charges the premium on top of a reduced tax rather than reducing it', () => {
    // At 22,000 the reduction is partly available and the premium has started.
    const result = computeProvincialTax({ taxableIncome: 22_000 }, ON);
    expect(result.taxReduction).toBeGreaterThan(0);
    expect(result.healthPremium).toBeGreaterThan(0);
    expect(result.taxPayable).toBeCloseTo(
      result.taxAfterCredits - result.taxReduction + result.healthPremium,
      1,
    );
    // The premium survives the reduction untouched.
    expect(result.taxPayable).toBeGreaterThan(result.healthPremium);
  });

  it('charges nothing at all where tax and premium are both nil', () => {
    // Below 20,000 the premium has not started, and a small tax is fully
    // covered by the reduction.
    const result = computeProvincialTax({ taxableIncome: 18_000 }, ON);
    expect(result.healthPremium).toBe(0);
    expect(result.taxReduction).toBeCloseTo(result.taxAfterCredits, 2);
    expect(result.taxPayable).toBe(0);
  });

  it('reports zero surtax and premium for provinces without them', () => {
    for (const province of [AB, BC]) {
      const result = computeProvincialTax({ taxableIncome: 200_000 }, province);
      expect(result.surtax).toBe(0);
      expect(result.healthPremium).toBe(0);
    }
  });

  it('never lets the reduction create a refund', () => {
    for (const province of [BC, ON]) {
      for (let income = 0; income <= 60_000; income += 500) {
        const result = computeProvincialTax({ taxableIncome: income }, province);
        expect(result.taxPayable).toBeGreaterThanOrEqual(0);
        expect(result.taxReduction).toBeLessThanOrEqual(
          result.taxAfterCredits + result.surtax,
        );
      }
    }
  });

  it('passes payroll credit amounts through at the provincial credit rate', () => {
    const base = computeProvincialTax({ taxableIncome: 80_000 }, BC);
    const withPayroll = computeProvincialTax(
      { taxableIncome: 80_000, additionalCreditAmounts: 4_000 },
      BC,
    );
    expect(base.taxPayable - withPayroll.taxPayable).toBeCloseTo(4_000 * 0.0506, 2);
  });

  it('rises monotonically with income in every province', () => {
    for (const code of SUPPORTED_PROVINCES) {
      const province = getProvince(code as ProvinceCode);
      let previous = -1;
      for (let income = 40_000; income <= 300_000; income += 5_000) {
        const { taxPayable } = computeProvincialTax(
          { taxableIncome: income },
          province,
        );
        expect(taxPayable, `${code} at ${income}`).toBeGreaterThan(previous);
        previous = taxPayable;
      }
    }
  });

  it('keeps Alberta the lowest and Ontario above BC at high income', () => {
    const at = (province: typeof AB) =>
      computeProvincialTax({ taxableIncome: 250_000 }, province).taxPayable;
    expect(at(AB)).toBeLessThan(at(BC));
    expect(at(AB)).toBeLessThan(at(ON));
  });
});
