import { describe, expect, it } from 'vitest';
import { validateBracketTable } from './brackets.ts';
import {
  computeProvincialTax,
  healthPremiumOn,
  provincialBasicPersonalAmount,
  surtaxOn,
  taxReductionAmount,
} from './canada-provincial.ts';
import {
  PROVINCES_2025,
  SUPPORTED_PROVINCES,
  getProvince,
  type ProvinceCode,
} from '../data/provinces/index.ts';

const AB = getProvince('AB');
const BC = getProvince('BC');
const MB = getProvince('MB');
const ON = getProvince('ON');

describe('province lookup', () => {
  it('resolves each province by code rather than by a hardcoded branch', () => {
    expect(getProvince('AB').code).toBe('AB');
    expect(getProvince('BC').code).toBe('BC');
    expect(getProvince('ON').code).toBe('ON');
  });

  it('lists every jurisdiction, west to east then territories', () => {
    expect(SUPPORTED_PROVINCES).toEqual([
      'BC',
      'AB',
      'SK',
      'MB',
      'ON',
      'QC',
      'NB',
      'NS',
      'PE',
      'NL',
      'YT',
      'NT',
      'NU',
    ]);
  });

  it('gives every jurisdiction a distinct name and a matching code', () => {
    const names = SUPPORTED_PROVINCES.map(
      (code) => getProvince(code as ProvinceCode).name,
    );
    expect(new Set(names).size).toBe(names.length);
    for (const code of SUPPORTED_PROVINCES) {
      expect(getProvince(code as ProvinceCode).code).toBe(code);
    }
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

  it('offers Quebec, with the parameters that make it different', () => {
    const qc = getProvince('QC');
    expect(qc.federalAbatementRate?.value).toBe(0.165);
    expect(qc.workerDeduction?.rate.value).toBe(0.06);
    // Nowhere else has either.
    for (const code of SUPPORTED_PROVINCES) {
      if (code === 'QC') continue;
      const other = getProvince(code as ProvinceCode);
      expect(other.federalAbatementRate, code).toBeUndefined();
      expect(other.workerDeduction, code).toBeUndefined();
    }
  });
});

describe('published bracket constants', () => {
  // CRA publishes a constant KP per band such that tax = rate x income - KP,
  // and Revenu Quebec publishes the same thing as K in TP-1015.F. Reproducing
  // them checks each rate table against the tax authority's own arithmetic
  // rather than against the page the rates were transcribed from.
  //
  // Compared within a dollar, because the two authorities round differently:
  // CRA's constants match a rounded value, Quebec's a truncated one (its top
  // constant computes to 10,465.54 and is published as 10,465).
  const expected: Record<string, number[]> = {
    AB: [0, 1_224, 4_309, 6_160, 8_628, 12_331],
    BC: [0, 1_330, 4_150, 6_220, 9_604, 13_603, 23_428],
    MB: [0, 917, 5_567],
    NB: [0, 2_407, 4_501, 11_286],
    NL: [0, 2_591, 3_753, 6_943, 11_410, 14_263, 17_117, 22_823],
    NS: [0, 1_909, 2_976, 3_784, 9_283],
    NT: [0, 1_431, 5_247, 8_436],
    NU: [0, 1_674, 3_906, 8_442],
    ON: [0, 2_210, 4_376, 5_876, 8_076],
    PE: [0, 1_347, 3_407, 4_497, 6_464],
    QC: [0, 2_717, 8_151, 10_465],
    SK: [0, 1_091, 4_207],
    YT: [0, 1_522, 3_745, 7_193, 18_193],
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
        return band.rate * band.from - tax;
      });
      const published = expected[code] as number[];
      constants.forEach((value, index) => {
        expect(
          Math.abs(value - (published[index] as number)),
          `${code} band ${index}`,
        ).toBeLessThanOrEqual(1);
      });
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

describe('2026 Manitoba parameters', () => {
  // CRA publishes Manitoba's 2026 thresholds twice and inconsistently. The
  // "tax rates and income brackets" page shows 47,564 and 101,200, which is the
  // frozen figures indexed by the 1.2% rate Manitoba used before the budget of
  // 2025-03-20 stopped indexing them. T4127 and T4032MB both give 47,000 and
  // 100,000, and the published bracket constants agree with those.
  it('keeps the frozen thresholds, not the indexed ones on the CRA rates page', () => {
    expect(MB.brackets.value.map((band) => band.from)).toEqual([0, 47_000, 100_000]);
    expect(MB.basicPersonalAmount.value).toBe(15_780);
  });

  it('would not reproduce the published constant KP if 47,564 were used', () => {
    // KP for the second band is rate difference times threshold. T4127 publishes
    // 917, which only 47,000 produces.
    const spread = 0.1275 - 0.108;
    expect(Math.round(47_000 * spread)).toBe(917);
    expect(Math.round(47_564 * spread)).not.toBe(917);
  });

  it('is unchanged from 2025, which is what a freeze means', () => {
    expect(MB.brackets.value).toEqual(PROVINCES_2025.MB.brackets.value);
    expect(MB.basicPersonalAmount.value).toBe(
      PROVINCES_2025.MB.basicPersonalAmount.value,
    );
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

describe('income-tested basic personal amounts', () => {
  const MB = getProvince('MB');
  const YT = getProvince('YT');

  it('applies only to Manitoba and Yukon', () => {
    for (const code of SUPPORTED_PROVINCES) {
      const province = getProvince(code as ProvinceCode);
      const tested = province.basicPersonalAmountPhaseOut !== undefined;
      expect(tested, code).toBe(code === 'MB' || code === 'YT');
    }
  });

  it('holds the full amount below the taper', () => {
    expect(provincialBasicPersonalAmount(0, MB)).toBe(15_780);
    expect(provincialBasicPersonalAmount(200_000, MB)).toBe(15_780);
    expect(provincialBasicPersonalAmount(100_000, YT)).toBe(16_452);
  });

  it('takes Manitoba to zero, unlike the federal taper which stops at a floor', () => {
    expect(provincialBasicPersonalAmount(400_000, MB)).toBe(0);
    expect(provincialBasicPersonalAmount(600_000, MB)).toBe(0);
    expect(provincialBasicPersonalAmount(300_000, MB)).toBeCloseTo(7_890, 6);
  });

  it('mirrors the federal floor for Yukon', () => {
    expect(provincialBasicPersonalAmount(258_482, YT)).toBe(14_829);
    expect(provincialBasicPersonalAmount(500_000, YT)).toBe(14_829);
    const midpoint = (181_440 + 258_482) / 2;
    expect(provincialBasicPersonalAmount(midpoint, YT)).toBeCloseTo(
      (16_452 + 14_829) / 2,
      6,
    );
  });

  it('never increases as income rises', () => {
    for (const province of [MB, YT]) {
      let previous = Number.POSITIVE_INFINITY;
      for (let income = 0; income <= 500_000; income += 10_000) {
        const amount = provincialBasicPersonalAmount(income, province);
        expect(amount).toBeLessThanOrEqual(previous);
        previous = amount;
      }
    }
  });

  it('costs a Manitoba high earner the whole personal amount', () => {
    const low = computeProvincialTax({ taxableIncome: 199_000 }, MB);
    const high = computeProvincialTax({ taxableIncome: 401_000 }, MB);
    expect(low.basicPersonalAmount).toBe(15_780);
    expect(high.basicPersonalAmount).toBe(0);
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

  it('reports zero surtax and premium everywhere except Ontario', () => {
    for (const code of SUPPORTED_PROVINCES) {
      if (code === 'ON') continue;
      const result = computeProvincialTax(
        { taxableIncome: 200_000 },
        getProvince(code as ProvinceCode),
      );
      expect(result.surtax, code).toBe(0);
      expect(result.healthPremium, code).toBe(0);
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
