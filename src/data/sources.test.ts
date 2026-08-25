import { describe, expect, it } from 'vitest';
import { collectAllSources, collectSources } from './sources.ts';
import { AUSTRIA_2026 } from './austria-2026.ts';
import { CANADA_FEDERAL_2026 } from './canada-federal-2026.ts';
import { CANADA_PAYROLL_2026 } from './canada-payroll-2026.ts';
import { CONVERSION_2026 } from './conversion-2026.ts';
import { getProvince } from './provinces/index.ts';

const ALL = collectAllSources([
  { label: 'Canada federal', parameters: CANADA_FEDERAL_2026 },
  { label: 'Canada payroll', parameters: CANADA_PAYROLL_2026 },
  { label: 'British Columbia', parameters: getProvince('BC') },
  { label: 'Austria', parameters: AUSTRIA_2026 },
  { label: 'Conversion', parameters: CONVERSION_2026 },
]);

describe('collectSources', () => {
  it('finds nested sourced values and labels them by path', () => {
    const found = collectSources(CANADA_PAYROLL_2026, 'Canada payroll');
    const paths = found.map((record) => record.path);
    expect(paths).toContain('Canada payroll / Cpp / Rate');
    expect(paths).toContain('Canada payroll / Ei / Maximum insurable earnings');
  });

  it('treats a bracket table as one sourced value, not one per band', () => {
    const found = collectSources(CANADA_FEDERAL_2026, 'Canada federal');
    const brackets = found.filter((record) => record.path.endsWith('Brackets'));
    expect(brackets).toHaveLength(1);
    expect(Array.isArray(brackets[0]?.entry.value)).toBe(true);
  });

  it('ignores plain values that are not sourced records', () => {
    const found = collectSources({ name: 'BC', code: 'BC' }, 'Test');
    expect(found).toEqual([]);
  });

  it('returns nothing for primitives and arrays at the root', () => {
    expect(collectSources(42, 'Test')).toEqual([]);
    expect(collectSources([1, 2, 3], 'Test')).toEqual([]);
    expect(collectSources(null, 'Test')).toEqual([]);
  });
});

describe('every model parameter is citable', () => {
  it('collects a substantial number of parameters', () => {
    // A guard against the walker silently stopping at the first level.
    expect(ALL.length).toBeGreaterThan(30);
  });

  it('gives every parameter an https source and an ISO retrieval date', () => {
    for (const { path, entry } of ALL) {
      expect(entry.source, path).toMatch(/^https:\/\//);
      expect(entry.retrieved, path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('gives every parameter a unique path, so none is hidden by another', () => {
    const paths = ALL.map((record) => record.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('draws only on official and multilateral sources', () => {
    const allowed = [
      // Canada
      'canada.ca',
      'gov.bc.ca',
      'revenuquebec.ca',
      'quebec.ca',
      // Austria. WKO is a statutory chamber, and it sets the levy surcharge
      // itself; usp.gv.at is the government business service portal.
      'bmf.gv.at',
      'sozialversicherung.at',
      'ris.bka.gv.at',
      'wko.at',
      'usp.gv.at',
      // Multilateral
      'ecb.europa.eu',
      'worldbank.org',
    ];
    for (const { path, entry } of ALL) {
      const host = new URL(entry.source).hostname;
      expect(
        allowed.some((domain) => host.endsWith(domain)),
        `${path} cites ${host}`,
      ).toBe(true);
    }
  });
});
