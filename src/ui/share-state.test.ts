import { describe, expect, it } from 'vitest';
import {
  SHARE_DEFAULTS,
  decodeShareState,
  encodeShareState,
  shareUrl,
} from './share-state.ts';
import { ASSUMPTIONS } from '../data/assumptions.ts';

const DEFAULT_STATE = { inputs: SHARE_DEFAULTS, overrides: {} };

describe('encodeShareState', () => {
  it('produces an empty query for untouched defaults', () => {
    expect(encodeShareState(DEFAULT_STATE)).toBe('');
  });

  it('includes only what differs from the defaults', () => {
    const query = encodeShareState({
      inputs: { ...SHARE_DEFAULTS, highlightIncome: 60_000 },
      overrides: {},
    });
    expect(query).toBe('i=60000');
  });

  it('encodes the boolean toggle explicitly', () => {
    const query = encodeShareState({
      inputs: { ...SHARE_DEFAULTS, specialPayments: false },
      overrides: {},
    });
    expect(query).toBe('sp=0');
  });

  it('includes an overridden assumption', () => {
    const query = encodeShareState({
      inputs: SHARE_DEFAULTS,
      overrides: { exchangeRate: 1.55 },
    });
    expect(query).toBe('fx=1.55');
  });

  it('omits an override that equals the sourced default', () => {
    const spec = ASSUMPTIONS[0];
    if (!spec) throw new Error('expected an assumption');
    const query = encodeShareState({
      inputs: SHARE_DEFAULTS,
      overrides: { [spec.key]: spec.defaultValue },
    });
    expect(query).toBe('');
  });
});

describe('decodeShareState', () => {
  it('round trips a fully customised state', () => {
    const state = {
      inputs: {
        province: 'BC' as const,
        basis: 'fx' as const,
        pppBasis: 'gdp' as const,
        specialPayments: false,
        highlightIncome: 85_000,
        rangeStart: 30_000,
        rangeEnd: 250_000,
        rangeIncrement: 5_000,
      },
      overrides: { exchangeRate: 1.55, householdPppCanada: 1.3 },
    };
    expect(decodeShareState(encodeShareState(state))).toEqual(state);
  });

  it('returns the defaults for an empty query', () => {
    expect(decodeShareState('')).toEqual(DEFAULT_STATE);
  });

  it('falls back per field on a partly corrupt query', () => {
    const state = decodeShareState('b=nonsense&i=70000');
    expect(state.inputs.basis).toBe(SHARE_DEFAULTS.basis);
    expect(state.inputs.highlightIncome).toBe(70_000);
  });

  it('accepts a supported province', () => {
    expect(decodeShareState('p=QC').inputs.province).toBe('QC');
  });

  it('rejects an unknown province code rather than crashing', () => {
    expect(decodeShareState('p=XX').inputs.province).toBe('BC');
    expect(decodeShareState('p=').inputs.province).toBe('BC');
  });

  it('drops an out-of-range assumption instead of clamping it', () => {
    // A link asking for an exchange rate of 500 is corrupt. Silently using the
    // maximum would be worse than ignoring it.
    expect(decodeShareState('fx=500').overrides.exchangeRate).toBeUndefined();
    expect(decodeShareState('fx=-2').overrides.exchangeRate).toBeUndefined();
    expect(decodeShareState('fx=abc').overrides.exchangeRate).toBeUndefined();
  });

  it('accepts an assumption inside its guardrails', () => {
    expect(decodeShareState('fx=1.7').overrides.exchangeRate).toBe(1.7);
  });

  it('ignores negative or non-numeric incomes', () => {
    expect(decodeShareState('i=-5').inputs.highlightIncome).toBe(
      SHARE_DEFAULTS.highlightIncome,
    );
    expect(decodeShareState('rs=abc').inputs.rangeStart).toBe(
      SHARE_DEFAULTS.rangeStart,
    );
  });

  it('survives a truncated query', () => {
    expect(() => decodeShareState('i=')).not.toThrow();
    expect(decodeShareState('i=').inputs.highlightIncome).toBe(
      SHARE_DEFAULTS.highlightIncome,
    );
  });
});

describe('shareUrl', () => {
  const location = { origin: 'https://example.test', pathname: '/wage_comp/' };

  it('omits the question mark when nothing differs from the defaults', () => {
    expect(shareUrl(DEFAULT_STATE, location)).toBe('https://example.test/wage_comp/');
  });

  it('appends the query when something differs', () => {
    expect(
      shareUrl(
        { inputs: { ...SHARE_DEFAULTS, highlightIncome: 50_000 }, overrides: {} },
        location,
      ),
    ).toBe('https://example.test/wage_comp/?i=50000');
  });
});
