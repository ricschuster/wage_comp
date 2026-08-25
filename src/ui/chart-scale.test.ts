import { describe, expect, it } from 'vitest';
import { niceStep, niceTicks, project, toPoints } from './chart-scale.ts';

describe('project', () => {
  const scale = { domainMin: 0, domainMax: 100, rangeMin: 0, rangeMax: 200 };

  it('maps the domain onto the range linearly', () => {
    expect(project(0, scale)).toBe(0);
    expect(project(50, scale)).toBe(100);
    expect(project(100, scale)).toBe(200);
  });

  it('handles an inverted range, as SVG y axes need', () => {
    const inverted = { domainMin: 0, domainMax: 10, rangeMin: 300, rangeMax: 100 };
    expect(project(0, inverted)).toBe(300);
    expect(project(10, inverted)).toBe(100);
    expect(project(5, inverted)).toBe(200);
  });

  it('clamps values outside the domain rather than drawing off-canvas', () => {
    expect(project(-50, scale)).toBe(0);
    expect(project(500, scale)).toBe(200);
  });

  it('centres a degenerate domain instead of dividing by zero', () => {
    const flat = { domainMin: 5, domainMax: 5, rangeMin: 0, rangeMax: 100 };
    expect(project(5, flat)).toBe(50);
    expect(Number.isFinite(project(5, flat))).toBe(true);
  });
});

describe('niceStep', () => {
  it('lands on 1, 2, 2.5 or 5 times a power of ten', () => {
    expect(niceStep(1)).toBe(1);
    expect(niceStep(1.5)).toBe(2);
    expect(niceStep(2.3)).toBe(2.5);
    expect(niceStep(4)).toBe(5);
    expect(niceStep(7)).toBe(10);
  });

  it('scales across magnitudes', () => {
    expect(niceStep(3_700)).toBe(5_000);
    expect(niceStep(0.037)).toBeCloseTo(0.05, 10);
  });

  it('falls back to 1 on nonsense input', () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(-5)).toBe(1);
    expect(niceStep(Number.NaN)).toBe(1);
  });
});

describe('niceTicks', () => {
  it('produces round ticks that cover the data', () => {
    const { ticks, min, max } = niceTicks(40_000, 300_000, 6);
    expect(min).toBeLessThanOrEqual(40_000);
    expect(max).toBeGreaterThanOrEqual(300_000);
    expect(ticks[0]).toBe(min);
    expect(ticks[ticks.length - 1]).toBe(max);
    for (const tick of ticks) {
      expect(tick % 50_000).toBe(0);
    }
  });

  it('spaces ticks evenly without floating point drift', () => {
    const { ticks } = niceTicks(0, 1, 5);
    const gaps = ticks.slice(1).map((tick, index) => tick - (ticks[index] as number));
    for (const gap of gaps) {
      expect(gap).toBeCloseTo(gaps[0] as number, 10);
    }
  });

  it('handles a flat series without producing an empty axis', () => {
    const { ticks, min, max } = niceTicks(5, 5);
    expect(ticks).toEqual([5]);
    expect(min).toBeLessThan(max);
  });

  it('falls back safely on non-finite bounds', () => {
    const { ticks } = niceTicks(Number.NaN, 10);
    expect(ticks).toEqual([0]);
  });

  it('produces a usable axis for the ratio range', () => {
    const { ticks, min, max } = niceTicks(0.88, 1.08, 5);
    expect(min).toBeLessThanOrEqual(0.88);
    expect(max).toBeGreaterThanOrEqual(1.08);
    expect(ticks.length).toBeGreaterThan(2);
  });
});

describe('toPoints', () => {
  it('formats coordinates for an SVG polyline', () => {
    expect(
      toPoints([
        [0, 1],
        [2.345, 6.789],
      ]),
    ).toBe('0.00,1.00 2.35,6.79');
  });

  it('returns an empty string for no coordinates', () => {
    expect(toPoints([])).toBe('');
  });
});
