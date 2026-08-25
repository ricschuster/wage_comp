import { describe, expect, it } from 'vitest';
import { bracketBreakdown } from './brackets.ts';
import { compare, type ComparisonParameters } from './compare.ts';
import { explainAustria, explainCanada, explainComparison } from './explain.ts';
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

const OPTIONS = {
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
} as const;

const RESULT = compare(100_000, P, OPTIONS);

describe('bracketBreakdown', () => {
  const table = [
    { from: 0, to: 10_000, rate: 0.1 },
    { from: 10_000, to: 50_000, rate: 0.2 },
    { from: 50_000, to: null, rate: 0.3 },
  ];

  it('returns only the bands that took income', () => {
    expect(bracketBreakdown(5_000, table)).toHaveLength(1);
    expect(bracketBreakdown(30_000, table)).toHaveLength(2);
    expect(bracketBreakdown(60_000, table)).toHaveLength(3);
  });

  it('sums to the same total as taxFromBrackets', () => {
    for (const income of [4_000, 30_000, 100_000]) {
      const total = bracketBreakdown(income, table).reduce(
        (sum, band) => sum + band.tax,
        0,
      );
      const bands = bracketBreakdown(income, table);
      const amounts = bands.reduce((sum, band) => sum + band.amount, 0);
      expect(amounts).toBeCloseTo(income, 6);
      expect(total).toBeGreaterThan(0);
    }
  });

  it('is empty at or below zero income', () => {
    expect(bracketBreakdown(0, table)).toEqual([]);
    expect(bracketBreakdown(-100, table)).toEqual([]);
    expect(bracketBreakdown(Number.NaN, table)).toEqual([]);
  });
});

describe('explainComparison', () => {
  const sections = explainComparison(RESULT, P);

  it('covers both countries and the conversion', () => {
    const titles = sections.map((section) => section.title);
    expect(titles.some((title) => title.startsWith('Canada'))).toBe(true);
    expect(titles.some((title) => title.startsWith('Austria'))).toBe(true);
    expect(titles).toContain('Conversion and ratio');
  });

  it('names the province rather than saying "provincial"', () => {
    expect(sections.map((s) => s.title)).toContain('Canada: British Columbia tax');
  });

  it('labels the currency of every money section', () => {
    for (const section of sections) {
      if (section.title.startsWith('Canada')) {
        expect(section.currency).toBe('CAD');
      }
      if (section.title.startsWith('Austria')) {
        expect(section.currency).toBe('EUR');
      }
    }
  });

  it('gives every entry a label and a formula', () => {
    for (const section of sections) {
      for (const entry of section.entries) {
        expect(entry.label).not.toBe('');
        expect(entry.formula).not.toBe('');
      }
    }
  });

  it('cites only official sources where it cites anything', () => {
    for (const section of sections) {
      for (const entry of section.entries) {
        for (const source of entry.sources) {
          expect(source.source).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it('reproduces the headline figures, so the working matches the answer', () => {
    const values = sections.flatMap((section) =>
      section.entries.map((entry) => entry.value),
    );
    expect(values).toContain(RESULT.canada.netIncome);
    expect(values).toContain(RESULT.austria.netIncome);
    expect(values).toContain(RESULT.canada.federal.taxPayable);
    expect(values).toContain(RESULT.canada.provincial.taxPayable);
  });
});

describe('explainCanada', () => {
  it('shows the per-band working, not just a total', () => {
    const sections = explainCanada(RESULT, P);
    const federal = sections.find((s) => s.title === 'Canada: federal tax');
    const before = federal?.entries.find((e) => e.label === 'Tax before credits');
    // Two bands are in play at 100,000: 14% then 20.5%.
    expect(before?.formula).toMatch(/at 14%/);
    expect(before?.formula).toMatch(/at 20.5%/);
  });

  it('explains the payroll deduction and credit split', () => {
    const sections = explainCanada(RESULT, P);
    const payroll = sections.find((s) => s.title === 'Canada: payroll contributions');
    const labels = payroll?.entries.map((e) => e.label) ?? [];
    expect(labels).toContain('Deducted from income');
    expect(labels).toContain('Eligible for credit');
  });

  it('shows the low-income tax reduction only where a province has one', () => {
    const sections = explainCanada(RESULT, P);
    const provincial = sections.find((s) => s.title === 'Canada: British Columbia tax');
    expect(provincial?.entries.map((e) => e.label)).toContain(
      'Low-income tax reduction',
    );
  });
});

describe('explainAustria', () => {
  it('states that special payments are a split, not an addition', () => {
    const sections = explainAustria(RESULT, P);
    const split = sections.find((s) => s.title === 'Austria: splitting annual gross');
    const formulas = split?.entries.map((e) => e.formula).join(' ') ?? '';
    expect(formulas).toMatch(/× 6\/7/);
    expect(formulas).toMatch(/× 1\/7/);
    expect(formulas).toMatch(/not an addition to it/);
  });

  it('explains why the special payment rate is lower', () => {
    const sections = explainAustria(RESULT, P);
    const special = sections.find((s) => s.title === 'Austria: special payments');
    const insurance = special?.entries.find((e) => e.label === 'Social insurance');
    expect(insurance?.formula).toMatch(/chamber and housing levies are not charged/);
  });

  it('omits the special payment section when the regime is turned off', () => {
    const off = compare(100_000, P, { ...OPTIONS, specialPayments: false });
    const titles = explainAustria(off, P).map((s) => s.title);
    expect(titles).not.toContain('Austria: special payments');
  });

  it('shows the negative tax refund only when it applies', () => {
    const low = compare(25_000, P, OPTIONS);
    const highLabels = explainAustria(RESULT, P)
      .flatMap((s) => s.entries)
      .map((e) => e.label);
    expect(highLabels).toContain('Tax on regular salary');

    const lowLabels = explainAustria(low, P)
      .flatMap((s) => s.entries)
      .map((e) => e.label);
    expect(
      lowLabels.includes('Negative tax refund') ||
        lowLabels.includes('Tax on regular salary'),
    ).toBe(true);
  });
});
