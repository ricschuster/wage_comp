/**
 * Display formatting.
 *
 * Kept out of the engine so the engine stays free of locale concerns and the
 * numbers it returns are exact rather than pre-rounded for display.
 */

const CAD = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

const EUR = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const PERCENT = new Intl.NumberFormat('en-CA', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const RATIO = new Intl.NumberFormat('en-CA', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const PLAIN = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 });

export function formatCad(value: number): string {
  return CAD.format(value);
}

export function formatEur(value: number): string {
  return EUR.format(value);
}

export function formatPercent(fraction: number): string {
  return PERCENT.format(fraction);
}

export function formatRatio(value: number): string {
  return RATIO.format(value);
}

export function formatNumber(value: number): string {
  return PLAIN.format(value);
}

/** Plain-language reading of the Austria over Canada ratio. */
export function describeRatio(ratio: number): string {
  if (ratio > 1.005) {
    return `Austria ahead by ${formatPercent(ratio - 1)}`;
  }
  if (ratio < 0.995) {
    return `Canada ahead by ${formatPercent(1 - ratio)}`;
  }
  return 'Broadly equivalent';
}
