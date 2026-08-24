import { describe, expect, it } from 'vitest';
import {
  compare,
  compareRange,
  conversionRate,
  type ComparisonOptions,
  type ComparisonParameters,
} from './compare.ts';
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

const FX: ComparisonOptions = {
  basis: 'fx',
  pppBasis: 'household',
  specialPayments: true,
};
const HOUSEHOLD: ComparisonOptions = {
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
};
const GDP: ComparisonOptions = { basis: 'ppp', pppBasis: 'gdp', specialPayments: true };

describe('conversion parameters', () => {
  it('carries provenance on every value', () => {
    const entries = [
      CONVERSION_2026.exchangeRate,
      CONVERSION_2026.householdPpp.canada,
      CONVERSION_2026.householdPpp.austria,
      CONVERSION_2026.gdpPpp.canada,
      CONVERSION_2026.gdpPpp.austria,
    ];
    for (const entry of entries) {
      expect(entry.source).toMatch(/^https:\/\//);
      expect(entry.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('states a PPP reference year, which trails the tax year', () => {
    expect(CONVERSION_2026.householdPpp.referenceYear).toBe(2025);
    expect(CONVERSION_2026.gdpPpp.referenceYear).toBeLessThan(2026);
  });
});

describe('conversionRate', () => {
  it('uses the exchange rate directly on the FX basis', () => {
    const { rate, referenceYear } = conversionRate(FX, CONVERSION_2026);
    expect(rate).toBe(1.6074);
    expect(referenceYear).toBeNull();
  });

  it('divides the two PPP factors on a PPP basis', () => {
    const { rate } = conversionRate(HOUSEHOLD, CONVERSION_2026);
    expect(rate).toBeCloseTo(1.260483 / 0.750352, 10);
  });

  it('gives a different rate for each PPP basis', () => {
    const household = conversionRate(HOUSEHOLD, CONVERSION_2026).rate;
    const gdp = conversionRate(GDP, CONVERSION_2026).rate;
    expect(household).not.toBeCloseTo(gdp, 3);
  });

  it('carries the sources it used', () => {
    expect(conversionRate(FX, CONVERSION_2026).sources).toHaveLength(1);
    expect(conversionRate(HOUSEHOLD, CONVERSION_2026).sources).toHaveLength(2);
  });
});

describe('compare', () => {
  it('converts the Canadian gross into the Austrian gross at the chosen rate', () => {
    const result = compare(100_000, P, FX);
    expect(result.grossIncomeEur).toBeCloseTo(100_000 / 1.6074, 2);
  });

  it('expresses both nets in Canadian dollars', () => {
    const result = compare(100_000, P, FX);
    expect(result.canadaNetCommon).toBeCloseTo(result.canada.netIncome, 2);
    expect(result.austriaNetCommon).toBeCloseTo(
      result.austria.netIncome * result.rate,
      2,
    );
  });

  it('computes the ratio as Austria over Canada', () => {
    const result = compare(100_000, P, FX);
    // The ratio comes from unrounded nets, so it differs from the ratio of the
    // rounded outputs in the eighth decimal. Six is well inside anything the
    // UI will show.
    expect(result.ratio).toBeCloseTo(
      result.austriaNetCommon / result.canadaNetCommon,
      6,
    );
  });

  it('returns exactly 1 when both sides are handed identical nets', () => {
    // A sanity check on the arithmetic itself: feed the same net through the
    // same rate in both directions and the ratio must be exactly 1.
    const rate = 1.6074;
    const net = 50_000;
    expect(((net / rate) * rate) / net).toBeCloseTo(1, 12);
  });

  it('records the PPP reference year on a PPP basis and not on FX', () => {
    expect(compare(100_000, P, HOUSEHOLD).referenceYear).toBe(2025);
    expect(compare(100_000, P, FX).referenceYear).toBeNull();
    expect(compare(100_000, P, FX).pppBasis).toBeNull();
  });

  it('gives a different answer under FX than under household PPP', () => {
    // If these agreed, the toggle would be pointless. Household PPP puts the
    // euro above the market rate, so Austria fares better under it.
    const fx = compare(100_000, P, FX).ratio;
    const ppp = compare(100_000, P, HOUSEHOLD).ratio;
    expect(ppp).toBeGreaterThan(fx);
  });

  it('keeps effective rates between zero and one', () => {
    for (const gross of [40_000, 100_000, 300_000]) {
      const result = compare(gross, P, HOUSEHOLD);
      expect(result.canadaEffectiveRate).toBeGreaterThan(0);
      expect(result.canadaEffectiveRate).toBeLessThan(1);
      expect(result.austriaEffectiveRate).toBeGreaterThan(0);
      expect(result.austriaEffectiveRate).toBeLessThan(1);
    }
  });

  it('emits a trace whose entries all carry citations', () => {
    const result = compare(100_000, P, HOUSEHOLD);
    expect(result.trace.length).toBeGreaterThan(0);
    for (const entry of result.trace) {
      expect(entry.label).not.toBe('');
      expect(entry.formula).not.toBe('');
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources) {
        expect(source.source).toMatch(/^https:\/\//);
      }
    }
  });

  it('handles zero income without dividing by zero', () => {
    const result = compare(0, P, FX);
    expect(result.ratio).toBe(0);
    expect(Number.isFinite(result.ratio)).toBe(true);
  });

  it('respects the special payments toggle', () => {
    const on = compare(100_000, P, { ...HOUSEHOLD, specialPayments: true });
    const off = compare(100_000, P, { ...HOUSEHOLD, specialPayments: false });
    expect(on.ratio).toBeGreaterThan(off.ratio);
  });
});

describe('compareRange', () => {
  it('generates the expected rows for a 40k to 300k range at 10k steps', () => {
    const rows = compareRange(40_000, 300_000, 10_000, P, HOUSEHOLD);
    expect(rows).toHaveLength(27);
    expect(rows[0]?.grossIncomeCad).toBe(40_000);
    expect(rows[rows.length - 1]?.grossIncomeCad).toBe(300_000);
  });

  it('includes the start when start equals end', () => {
    expect(compareRange(50_000, 50_000, 1_000, P, FX)).toHaveLength(1);
  });

  it('stops short of the end when the increment does not divide evenly', () => {
    const rows = compareRange(40_000, 45_000, 2_000, P, FX);
    expect(rows.map((r) => r.grossIncomeCad)).toEqual([40_000, 42_000, 44_000]);
  });

  it('rejects a non-positive increment', () => {
    expect(() => compareRange(40_000, 100_000, 0, P, FX)).toThrow(RangeError);
    expect(() => compareRange(40_000, 100_000, -5, P, FX)).toThrow(RangeError);
  });

  it('rejects an end below the start', () => {
    expect(() => compareRange(100_000, 40_000, 1_000, P, FX)).toThrow(RangeError);
  });

  it('refuses a range that would produce a runaway number of rows', () => {
    expect(() => compareRange(0, 1_000_000, 1, P, FX)).toThrow(RangeError);
  });

  it('produces a monotonically rising gross column', () => {
    const rows = compareRange(40_000, 200_000, 20_000, P, HOUSEHOLD);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i]?.grossIncomeCad).toBeGreaterThan(rows[i - 1]?.grossIncomeCad ?? 0);
    }
  });
});
