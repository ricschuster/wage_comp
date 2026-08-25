/**
 * Scale and tick helpers for the hand-rolled SVG charts.
 *
 * Pure, and separate from the components, so the fiddly arithmetic that
 * decides whether a chart is readable can be tested directly.
 */

export interface LinearScale {
  readonly domainMin: number;
  readonly domainMax: number;
  readonly rangeMin: number;
  readonly rangeMax: number;
}

/** Maps a domain value onto a pixel position, clamped to the range. */
export function project(value: number, scale: LinearScale): number {
  const { domainMin, domainMax, rangeMin, rangeMax } = scale;
  if (domainMax === domainMin) {
    return (rangeMin + rangeMax) / 2;
  }
  const fraction = (value - domainMin) / (domainMax - domainMin);
  const position = rangeMin + fraction * (rangeMax - rangeMin);
  const low = Math.min(rangeMin, rangeMax);
  const high = Math.max(rangeMin, rangeMax);
  return Math.min(high, Math.max(low, position));
}

/**
 * A step that lands on 1, 2, 2.5 or 5 times a power of ten.
 *
 * Arbitrary steps produce axis labels like 3,714 that nobody can read across.
 */
export function niceStep(rawStep: number): number {
  if (!Number.isFinite(rawStep) || rawStep <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalised = rawStep / magnitude;

  if (normalised <= 1) return magnitude;
  if (normalised <= 2) return 2 * magnitude;
  if (normalised <= 2.5) return 2.5 * magnitude;
  if (normalised <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

/**
 * Evenly spaced, readable tick values covering the interval.
 *
 * The returned bounds may extend slightly beyond the data so the axis starts
 * and ends on a round number.
 */
export function niceTicks(
  min: number,
  max: number,
  targetCount = 5,
): { ticks: number[]; min: number; max: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { ticks: [0], min: 0, max: 1 };
  }
  if (min === max) {
    return { ticks: [min], min: min - 1, max: max + 1 };
  }

  const count = Math.max(2, Math.floor(targetCount));
  const step = niceStep((max - min) / count);
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  // Accumulate by index rather than repeated addition, so floating point
  // error does not drift across a long axis.
  const steps = Math.round((end - start) / step);
  for (let index = 0; index <= steps; index += 1) {
    ticks.push(start + index * step);
  }

  return { ticks, min: start, max: end };
}

/** Builds an SVG polyline points attribute from projected coordinates. */
export function toPoints(coordinates: readonly (readonly [number, number])[]): string {
  return coordinates.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}
