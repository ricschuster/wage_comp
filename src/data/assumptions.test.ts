import { describe, expect, it } from 'vitest';
import {
  ASSUMPTIONS,
  applyAssumptions,
  isWithinGuardrails,
  modifiedKeys,
  sanitiseOverrides,
} from './assumptions.ts';
import { CONVERSION_2026 } from './conversion-2026.ts';
import { SCENARIOS, getScenario } from './scenarios.ts';

describe('assumption specs', () => {
  it('defaults to the sourced value for every assumption', () => {
    expect(ASSUMPTIONS.find((s) => s.key === 'exchangeRate')?.defaultValue).toBe(
      CONVERSION_2026.exchangeRate.value,
    );
    expect(ASSUMPTIONS.find((s) => s.key === 'householdPppCanada')?.defaultValue).toBe(
      CONVERSION_2026.householdPpp.canada.value,
    );
  });

  it('puts every default inside its own guardrails', () => {
    for (const spec of ASSUMPTIONS) {
      expect(isWithinGuardrails(spec.key, spec.defaultValue), spec.key).toBe(true);
    }
  });

  it('exposes only conversion factors, never tax parameters', () => {
    // Tax parameters are law, not assumptions. If a bracket ever became
    // editable, this would catch it.
    const keys = ASSUMPTIONS.map((spec) => spec.key).join(' ');
    expect(keys).not.toMatch(/bracket|rate2026|basicPersonal|cpp|ei/i);
  });
});

describe('guardrails', () => {
  it('rejects values outside the range', () => {
    expect(isWithinGuardrails('exchangeRate', 500)).toBe(false);
    expect(isWithinGuardrails('exchangeRate', -1)).toBe(false);
    expect(isWithinGuardrails('exchangeRate', Number.NaN)).toBe(false);
  });

  it('accepts values inside the range', () => {
    expect(isWithinGuardrails('exchangeRate', 1.7)).toBe(true);
  });

  it('drops invalid overrides rather than clamping them', () => {
    expect(sanitiseOverrides({ exchangeRate: 500 })).toEqual({});
    expect(sanitiseOverrides({ exchangeRate: 1.7 })).toEqual({ exchangeRate: 1.7 });
  });
});

describe('modifiedKeys', () => {
  it('is empty when nothing is overridden', () => {
    expect(modifiedKeys({})).toEqual([]);
  });

  it('ignores an override that equals the sourced default', () => {
    expect(modifiedKeys({ exchangeRate: CONVERSION_2026.exchangeRate.value })).toEqual(
      [],
    );
  });

  it('reports a genuine change', () => {
    expect(modifiedKeys({ exchangeRate: 1.5 })).toEqual(['exchangeRate']);
  });
});

describe('applyAssumptions', () => {
  it('returns the sourced parameters untouched when nothing is overridden', () => {
    expect(applyAssumptions({})).toEqual(CONVERSION_2026);
  });

  it('applies a valid override', () => {
    const applied = applyAssumptions({ exchangeRate: 1.5 });
    expect(applied.exchangeRate.value).toBe(1.5);
  });

  it('records the sourced default it replaced, so a modified run is obvious', () => {
    const applied = applyAssumptions({ exchangeRate: 1.5 });
    expect(applied.exchangeRate.note).toMatch(/User-supplied/);
    expect(applied.exchangeRate.note).toMatch(
      String(CONVERSION_2026.exchangeRate.value),
    );
  });

  it('keeps the original citation, so the source is still traceable', () => {
    const applied = applyAssumptions({ exchangeRate: 1.5 });
    expect(applied.exchangeRate.source).toBe(CONVERSION_2026.exchangeRate.source);
  });

  it('ignores an out-of-range override', () => {
    expect(applyAssumptions({ exchangeRate: 500 }).exchangeRate.value).toBe(
      CONVERSION_2026.exchangeRate.value,
    );
  });

  it('leaves the PPP reference year alone', () => {
    const applied = applyAssumptions({ householdPppCanada: 1.3 });
    expect(applied.householdPpp.referenceYear).toBe(
      CONVERSION_2026.householdPpp.referenceYear,
    );
  });
});

describe('scenarios', () => {
  it('gives every scenario a unique id', () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves a known id and returns undefined for an unknown one', () => {
    expect(getScenario('bc-fx')?.basis).toBe('fx');
    expect(getScenario('nope')).toBeUndefined();
  });

  it('marks the unrealistic scenario as such in its description', () => {
    expect(getScenario('bc-no-special')?.description).toMatch(/[Nn]ot a realistic/);
  });
});
