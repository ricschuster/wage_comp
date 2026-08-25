import { describe, expect, it } from 'vitest';
import { CURRENT_TAX_YEAR, TAX_YEARS, parametersForYear } from './years.ts';
import { SUPPORTED_PROVINCES } from './provinces/index.ts';
import { collectAllSources } from './sources.ts';
import { SOURCE_GROUPS } from './source-groups.ts';

describe('the tax year registry', () => {
  it('lists the supported years newest first', () => {
    expect(TAX_YEARS).toEqual([2026]);
    expect(CURRENT_TAX_YEAR).toBe(2026);
  });

  it('resolves a supported year', () => {
    expect(parametersForYear(2026).year).toBe(2026);
  });

  it('refuses an unsupported year rather than returning something plausible', () => {
    expect(() => parametersForYear(2027)).toThrow(RangeError);
    expect(() => parametersForYear(2025)).toThrow(RangeError);
    expect(() => parametersForYear(2027)).toThrow(/Supported: 2026/);
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
});

describe('every parameter is dated, so staleness is visible', () => {
  it('gives each value a retrieval date no earlier than the tax year minus one', () => {
    // A parameter retrieved long before the tax year it describes is a smell.
    for (const { path, entry } of collectAllSources(SOURCE_GROUPS)) {
      const retrievedYear = Number(entry.retrieved.slice(0, 4));
      expect(retrievedYear, path).toBeGreaterThanOrEqual(CURRENT_TAX_YEAR - 1);
    }
  });

  it('does not claim a retrieval date in the future', () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const { path, entry } of collectAllSources(SOURCE_GROUPS)) {
      expect(entry.retrieved.localeCompare(today), path).toBeLessThanOrEqual(0);
    }
  });
});
