/**
 * Shareable state: everything that defines what you are looking at.
 *
 * A link reproduces an exact scenario, which is what makes a result checkable
 * by someone else. Values equal to the defaults are omitted, so an unmodified
 * link stays short and a modified one is obvious.
 *
 * Parsing is deliberately forgiving: a stale, truncated or hand-edited link
 * falls back to defaults per field rather than failing, because a broken link
 * should still show a working page.
 */

import {
  ASSUMPTIONS,
  isWithinGuardrails,
  type AssumptionKey,
  type AssumptionOverrides,
} from '../data/assumptions.ts';
import type { ComparisonBasis, PppBasis } from '../data/types.ts';
import { SUPPORTED_PROVINCES, type ProvinceCode } from '../data/provinces/index.ts';
import type { DashboardInputs } from './Controls.tsx';

export interface ShareState {
  readonly inputs: DashboardInputs;
  readonly overrides: AssumptionOverrides;
}

export const SHARE_DEFAULTS: DashboardInputs = {
  province: 'BC',
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
  highlightIncome: 100_000,
  rangeStart: 40_000,
  rangeEnd: 300_000,
  rangeIncrement: 20_000,
};

/** Short URL keys, so a shared link stays readable. */
const KEYS = {
  province: 'p',
  basis: 'b',
  pppBasis: 'pb',
  specialPayments: 'sp',
  highlightIncome: 'i',
  rangeStart: 'rs',
  rangeEnd: 're',
  rangeIncrement: 'ri',
} as const;

const ASSUMPTION_PARAM: Record<AssumptionKey, string> = {
  exchangeRate: 'fx',
  householdPppCanada: 'hca',
  householdPppAustria: 'hat',
  gdpPppCanada: 'gca',
  gdpPppAustria: 'gat',
};

function parsePositiveNumber(raw: string | null, fallback: number): number {
  // An empty or blank param is absent, not zero. Number('') is 0, so without
  // this a truncated link like "?i=" would blank the dashboard rather than
  // falling back to the default.
  if (raw === null || raw.trim() === '') {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Encodes state into a query string, omitting anything left at its default. */
export function encodeShareState(state: ShareState): string {
  const params = new URLSearchParams();
  const { inputs, overrides } = state;

  if (inputs.province !== SHARE_DEFAULTS.province) {
    params.set(KEYS.province, inputs.province);
  }
  if (inputs.basis !== SHARE_DEFAULTS.basis) {
    params.set(KEYS.basis, inputs.basis);
  }
  if (inputs.pppBasis !== SHARE_DEFAULTS.pppBasis) {
    params.set(KEYS.pppBasis, inputs.pppBasis);
  }
  if (inputs.specialPayments !== SHARE_DEFAULTS.specialPayments) {
    params.set(KEYS.specialPayments, inputs.specialPayments ? '1' : '0');
  }
  if (inputs.highlightIncome !== SHARE_DEFAULTS.highlightIncome) {
    params.set(KEYS.highlightIncome, String(inputs.highlightIncome));
  }
  if (inputs.rangeStart !== SHARE_DEFAULTS.rangeStart) {
    params.set(KEYS.rangeStart, String(inputs.rangeStart));
  }
  if (inputs.rangeEnd !== SHARE_DEFAULTS.rangeEnd) {
    params.set(KEYS.rangeEnd, String(inputs.rangeEnd));
  }
  if (inputs.rangeIncrement !== SHARE_DEFAULTS.rangeIncrement) {
    params.set(KEYS.rangeIncrement, String(inputs.rangeIncrement));
  }

  for (const spec of ASSUMPTIONS) {
    const value = overrides[spec.key];
    if (value !== undefined && value !== spec.defaultValue) {
      params.set(ASSUMPTION_PARAM[spec.key], String(value));
    }
  }

  return params.toString();
}

/** Decodes a query string, falling back to defaults field by field. */
export function decodeShareState(query: string): ShareState {
  const params = new URLSearchParams(query);

  const rawProvince = params.get(KEYS.province);
  const province: ProvinceCode = SUPPORTED_PROVINCES.includes(
    rawProvince as ProvinceCode,
  )
    ? (rawProvince as ProvinceCode)
    : SHARE_DEFAULTS.province;

  const rawBasis = params.get(KEYS.basis);
  const basis: ComparisonBasis =
    rawBasis === 'fx' || rawBasis === 'ppp' ? rawBasis : SHARE_DEFAULTS.basis;

  const rawPppBasis = params.get(KEYS.pppBasis);
  const pppBasis: PppBasis =
    rawPppBasis === 'gdp' || rawPppBasis === 'household'
      ? rawPppBasis
      : SHARE_DEFAULTS.pppBasis;

  const rawSpecial = params.get(KEYS.specialPayments);
  const specialPayments =
    rawSpecial === '0'
      ? false
      : rawSpecial === '1'
        ? true
        : SHARE_DEFAULTS.specialPayments;

  const overrides: AssumptionOverrides = {};
  for (const spec of ASSUMPTIONS) {
    const raw = params.get(ASSUMPTION_PARAM[spec.key]);
    if (raw === null) {
      continue;
    }
    const value = Number(raw);
    // Out-of-range values are dropped rather than clamped: a link asking for an
    // exchange rate of 500 is corrupt, and silently using 5 would be worse.
    if (isWithinGuardrails(spec.key, value)) {
      overrides[spec.key] = value;
    }
  }

  return {
    inputs: {
      province,
      basis,
      pppBasis,
      specialPayments,
      highlightIncome: parsePositiveNumber(
        params.get(KEYS.highlightIncome),
        SHARE_DEFAULTS.highlightIncome,
      ),
      rangeStart: parsePositiveNumber(
        params.get(KEYS.rangeStart),
        SHARE_DEFAULTS.rangeStart,
      ),
      rangeEnd: parsePositiveNumber(params.get(KEYS.rangeEnd), SHARE_DEFAULTS.rangeEnd),
      rangeIncrement: parsePositiveNumber(
        params.get(KEYS.rangeIncrement),
        SHARE_DEFAULTS.rangeIncrement,
      ),
    },
    overrides,
  };
}

/** The full shareable URL for the current state. */
export function shareUrl(
  state: ShareState,
  location: { origin: string; pathname: string },
): string {
  const query = encodeShareState(state);
  return query
    ? `${location.origin}${location.pathname}?${query}`
    : `${location.origin}${location.pathname}`;
}
