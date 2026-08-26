import { describe, expect, it } from 'vitest';
import { CURRENT_TAX_YEAR, TAX_YEARS, parametersForYear } from './years.ts';
import { SUPPORTED_PROVINCES } from './provinces/index.ts';
import { collectAllSources } from './sources.ts';
import { sourceGroupsForYear } from './source-groups.ts';

describe('the tax year registry', () => {
  it('lists the supported years newest first', () => {
    expect(TAX_YEARS).toEqual([2026, 2025]);
    expect(CURRENT_TAX_YEAR).toBe(2026);
  });

  it('resolves every supported year', () => {
    for (const year of TAX_YEARS) {
      expect(parametersForYear(year).year).toBe(year);
    }
  });

  it('refuses an unsupported year rather than returning something plausible', () => {
    expect(() => parametersForYear(2027)).toThrow(RangeError);
    expect(() => parametersForYear(2024)).toThrow(RangeError);
    expect(() => parametersForYear(2027)).toThrow(/Supported: 2026, 2025/);
  });

  it('carries a complete parameter set for every year', () => {
    for (const year of TAX_YEARS) {
      const p = parametersForYear(year);
      expect(p.federal.brackets.value.length, `${year} federal`).toBeGreaterThan(0);
      expect(p.austria.brackets.value.length, `${year} Austria`).toBeGreaterThan(0);
      expect(p.payroll.cpp.rate.value, `${year} payroll`).toBeGreaterThan(0);
      expect(p.quebecPayroll.qpip, `${year} Quebec payroll`).toBeDefined();
      expect(Object.keys(p.provinces), `${year} provinces`).toHaveLength(
        SUPPORTED_PROVINCES.length,
      );
      expect(p.conversion.exchangeRate.value, `${year} conversion`).toBeGreaterThan(0);
    }
  });

  it('keeps the two years distinct where they must differ', () => {
    // A copied file that was never edited would pass every other test in this
    // suite, so check that the years actually differ where they must.
    const a = parametersForYear(2025);
    const b = parametersForYear(2026);
    expect(a.federal.brackets.value).not.toEqual(b.federal.brackets.value);
    expect(a.austria.brackets.value).not.toEqual(b.austria.brackets.value);
    expect(a.payroll.cpp.maximumPensionableEarnings.value).not.toBe(
      b.payroll.cpp.maximumPensionableEarnings.value,
    );
    expect(a.conversion.exchangeRate.value).not.toBe(b.conversion.exchangeRate.value);
  });
});

describe('every parameter is dated, so staleness is visible', () => {
  const everySource = TAX_YEARS.flatMap((year) =>
    collectAllSources(sourceGroupsForYear(year)).map((record) => ({ year, ...record })),
  );

  it('gives each value a retrieval date no earlier than the tax year minus one', () => {
    // A parameter retrieved long before the tax year it describes is a smell.
    for (const { year, path, entry } of everySource) {
      const retrievedYear = Number(entry.retrieved.slice(0, 4));
      expect(retrievedYear, `${year} ${path}`).toBeGreaterThanOrEqual(year - 1);
    }
  });

  it('does not claim a retrieval date in the future', () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const { year, path, entry } of everySource) {
      expect(
        entry.retrieved.localeCompare(today),
        `${year} ${path}`,
      ).toBeLessThanOrEqual(0);
    }
  });

  it('cites an https source for every value in every year', () => {
    for (const { year, path, entry } of everySource) {
      expect(entry.source, `${year} ${path}`).toMatch(/^https:\/\//);
    }
  });
});
