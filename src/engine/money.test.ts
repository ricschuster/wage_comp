import { describe, expect, it } from 'vitest';
import { capAt, clampToZero, roundToCents } from './money.ts';

describe('roundToCents', () => {
  it('leaves exact cent values alone', () => {
    expect(roundToCents(12.34)).toBe(12.34);
    expect(roundToCents(0)).toBe(0);
    expect(roundToCents(1000)).toBe(1000);
  });

  it('rounds half away from zero', () => {
    expect(roundToCents(0.125)).toBe(0.13);
    expect(roundToCents(-0.125)).toBe(-0.13);
  });

  it('rounds values that binary representation leaves a hair short', () => {
    // 1.005 * 100 is 100.49999999999999 in IEEE 754.
    expect(roundToCents(1.005)).toBe(1.01);
    expect(roundToCents(8.475)).toBe(8.48);
  });

  it('normalises negative zero', () => {
    expect(Object.is(roundToCents(-0.001), 0)).toBe(true);
  });

  it('rejects non-finite input', () => {
    expect(() => roundToCents(Number.NaN)).toThrow(RangeError);
    expect(() => roundToCents(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('clampToZero', () => {
  it('passes positive values through', () => {
    expect(clampToZero(42)).toBe(42);
  });

  it('floors negative values at zero', () => {
    expect(clampToZero(-42)).toBe(0);
    expect(clampToZero(-0)).toBe(0);
  });

  it('rejects non-finite input', () => {
    expect(() => clampToZero(Number.NaN)).toThrow(RangeError);
  });
});

describe('capAt', () => {
  it('returns the amount when below the ceiling', () => {
    expect(capAt(100, 250)).toBe(100);
  });

  it('returns the ceiling when the amount exceeds it', () => {
    expect(capAt(400, 250)).toBe(250);
  });

  it('returns the ceiling when the amount equals it', () => {
    expect(capAt(250, 250)).toBe(250);
  });

  it('rejects a negative ceiling', () => {
    expect(() => capAt(100, -1)).toThrow(RangeError);
  });

  it('rejects non-finite input', () => {
    expect(() => capAt(Number.NaN, 250)).toThrow(RangeError);
    expect(() => capAt(100, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
