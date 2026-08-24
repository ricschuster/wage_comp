import { describe, expect, it } from 'vitest';
import { validateBracketTable } from './brackets.ts';
import { computeProvincialTax, taxReductionAmount } from './canada-provincial.ts';
import {
  SUPPORTED_PROVINCES,
  getProvince,
  type ProvinceCode,
} from '../data/provinces/index.ts';

const BC = getProvince('BC');

describe('province lookup', () => {
  it('resolves BC by code rather than by a hardcoded branch', () => {
    expect(getProvince('BC').code).toBe('BC');
  });

  it('lists the supported provinces for a selector', () => {
    expect(SUPPORTED_PROVINCES).toEqual(['BC']);
  });

  it('gives every supported province a valid bracket table and a credit rate', () => {
    for (const code of SUPPORTED_PROVINCES) {
      const province = getProvince(code as ProvinceCode);
      expect(validateBracketTable(province.brackets.value), code).toEqual([]);
      expect(province.creditRate.value, code).toBe(province.brackets.value[0]?.rate);
    }
  });

  it('does not offer Quebec, which needs its own module', () => {
    expect(SUPPORTED_PROVINCES).not.toContain('QC');
  });
});

describe('2026 British Columbia parameters', () => {
  it('uses 5.06% as the lowest rate, not the 5.6% on the CRA brackets page', () => {
    // The Government of BC and CRA's own T4127 both give 0.0506. The CRA
    // public brackets page shows 5.6%, which is a typo: every other rate on
    // the two sources agrees exactly.
    expect(BC.brackets.value[0]?.rate).toBe(0.0506);
  });

  it('has the seven published brackets with the expected thresholds', () => {
    expect(BC.brackets.value.map((b) => b.from)).toEqual([
      0, 50_363, 100_728, 115_648, 140_430, 190_405, 265_545,
    ]);
  });

  it('phases the tax reduction to exactly zero at the published income', () => {
    const r = BC.taxReduction;
    if (!r) throw new Error('BC should have a tax reduction');
    const zeroAt =
      r.phaseOutStart.value + r.maximumReduction.value / r.phaseOutRate.value;
    expect(zeroAt).toBeCloseTo(41_722, 0);
  });

  it('carries provenance on every value', () => {
    const entries = [
      BC.brackets,
      BC.creditRate,
      BC.basicPersonalAmount,
      BC.taxReduction?.maximumReduction,
      BC.taxReduction?.phaseOutStart,
      BC.taxReduction?.phaseOutRate,
    ];
    for (const entry of entries) {
      expect(entry?.source).toMatch(/^https:\/\//);
      expect(entry?.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('taxReductionAmount', () => {
  const reduction = BC.taxReduction!;

  it('is the maximum at and below the phase-out start', () => {
    expect(taxReductionAmount(0, reduction)).toBe(575);
    expect(taxReductionAmount(25_570, reduction)).toBe(575);
  });

  it('shrinks at the phase-out rate above the start', () => {
    expect(taxReductionAmount(30_000, reduction)).toBeCloseTo(
      575 - (30_000 - 25_570) * 0.0356,
      6,
    );
  });

  it('is zero at and above the point it runs out', () => {
    expect(taxReductionAmount(41_722, reduction)).toBeCloseTo(0, 2);
    expect(taxReductionAmount(60_000, reduction)).toBe(0);
  });

  it('never goes negative', () => {
    for (let income = 0; income <= 100_000; income += 1_000) {
      expect(taxReductionAmount(income, reduction)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('computeProvincialTax', () => {
  it('produces no tax at incomes covered by the credits', () => {
    expect(computeProvincialTax({ taxableIncome: 13_000 }, BC).taxPayable).toBe(0);
  });

  it('applies bracket rates then credits at the lowest rate', () => {
    const result = computeProvincialTax({ taxableIncome: 60_000 }, BC);
    const expectedBefore = 50_363 * 0.0506 + (60_000 - 50_363) * 0.077;
    expect(result.taxBeforeCredits).toBeCloseTo(expectedBefore, 2);
    expect(result.creditValue).toBeCloseTo(13_216 * 0.0506, 2);
  });

  it('applies the tax reduction after credits', () => {
    // At 30,000 the reduction is still partly available.
    const result = computeProvincialTax({ taxableIncome: 30_000 }, BC);
    expect(result.taxReduction).toBeGreaterThan(0);
    expect(result.taxPayable).toBeCloseTo(
      result.taxAfterCredits - result.taxReduction,
      2,
    );
  });

  it('never lets the reduction create a refund', () => {
    for (let income = 0; income <= 45_000; income += 500) {
      const result = computeProvincialTax({ taxableIncome: income }, BC);
      expect(result.taxPayable).toBeGreaterThanOrEqual(0);
      expect(result.taxReduction).toBeLessThanOrEqual(result.taxAfterCredits);
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

  it('rises monotonically with income across the modelled range', () => {
    let previous = -1;
    for (let income = 40_000; income <= 300_000; income += 5_000) {
      const { taxPayable } = computeProvincialTax({ taxableIncome: income }, BC);
      expect(taxPayable).toBeGreaterThan(previous);
      previous = taxPayable;
    }
  });

  it('keeps the effective rate below the top marginal rate', () => {
    for (const income of [40_000, 100_000, 300_000]) {
      const { taxPayable } = computeProvincialTax({ taxableIncome: income }, BC);
      expect(taxPayable / income).toBeLessThan(0.205);
    }
  });
});
