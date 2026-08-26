/**
 * User-adjustable assumptions.
 *
 * Only the conversion factors are adjustable. Tax parameters are law, not
 * assumptions: letting a reader retype a bracket threshold would turn a
 * sourced model into an unsourced one while still looking authoritative. The
 * exchange rate and the PPP factors are different in kind. The rate genuinely
 * moves day to day, and which PPP series to trust is a legitimate judgement,
 * so both are exposed with guardrails.
 */

import { CONVERSION_2026 } from './conversion-2026.ts';
import type { ConversionParameters } from './types.ts';
import type { Sourced } from '../engine/types.ts';

export type AssumptionKey =
  | 'exchangeRate'
  | 'householdPppCanada'
  | 'householdPppAustria'
  | 'gdpPppCanada'
  | 'gdpPppAustria';

export interface AssumptionSpec {
  readonly key: AssumptionKey;
  readonly label: string;
  readonly help: string;
  readonly defaultValue: number;
  /** Guardrails: a value outside this range is rejected, not clamped. */
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export const ASSUMPTIONS: readonly AssumptionSpec[] = [
  {
    key: 'exchangeRate',
    label: 'Exchange rate (CAD per EUR)',
    help: 'Used when comparing on the market rate. Moves daily, so the default is only a snapshot.',
    defaultValue: CONVERSION_2026.exchangeRate.value,
    min: 0.5,
    max: 5,
    step: 0.0001,
  },
  {
    key: 'householdPppCanada',
    label: 'Household PPP, Canada',
    help: 'Canadian dollars per international dollar, consumer basket.',
    defaultValue: CONVERSION_2026.householdPpp.canada.value,
    min: 0.2,
    max: 5,
    step: 0.000001,
  },
  {
    key: 'householdPppAustria',
    label: 'Household PPP, Austria',
    help: 'Euro per international dollar, consumer basket.',
    defaultValue: CONVERSION_2026.householdPpp.austria.value,
    min: 0.2,
    max: 5,
    step: 0.000001,
  },
  {
    key: 'gdpPppCanada',
    label: 'GDP PPP, Canada',
    help: 'Canadian dollars per international dollar, whole economy.',
    defaultValue: CONVERSION_2026.gdpPpp.canada.value,
    min: 0.2,
    max: 5,
    step: 0.000001,
  },
  {
    key: 'gdpPppAustria',
    label: 'GDP PPP, Austria',
    help: 'Euro per international dollar, whole economy.',
    defaultValue: CONVERSION_2026.gdpPpp.austria.value,
    min: 0.2,
    max: 5,
    step: 0.000001,
  },
];

const SPEC_BY_KEY = new Map(ASSUMPTIONS.map((spec) => [spec.key, spec]));

export type AssumptionOverrides = Partial<Record<AssumptionKey, number>>;

/** True when the value is usable for this assumption. */
export function isWithinGuardrails(key: AssumptionKey, value: number): boolean {
  const spec = SPEC_BY_KEY.get(key);
  if (!spec) {
    return false;
  }
  return Number.isFinite(value) && value >= spec.min && value <= spec.max;
}

/** Drops any override that is out of range or not a number. */
export function sanitiseOverrides(overrides: AssumptionOverrides): AssumptionOverrides {
  const clean: AssumptionOverrides = {};
  for (const [key, value] of Object.entries(overrides) as [
    AssumptionKey,
    number | undefined,
  ][]) {
    if (value !== undefined && isWithinGuardrails(key, value)) {
      clean[key] = value;
    }
  }
  return clean;
}

/** Keys whose value differs from the sourced default. */
export function modifiedKeys(overrides: AssumptionOverrides): AssumptionKey[] {
  return ASSUMPTIONS.filter((spec) => {
    const override = overrides[spec.key];
    return override !== undefined && override !== spec.defaultValue;
  }).map((spec) => spec.key);
}

/**
 * Replaces a sourced value with a user-supplied one.
 *
 * The original source and retrieval date are kept, and the note records what
 * the sourced default was, so the audit view can show both and a modified run
 * can never be mistaken for a sourced one.
 */
function override(base: Sourced<number>, value: number | undefined): Sourced<number> {
  if (value === undefined || value === base.value) {
    return base;
  }
  return {
    value,
    source: base.source,
    retrieved: base.retrieved,
    note: `User-supplied, replacing the sourced default of ${base.value}.${base.note ? ` Original note: ${base.note}` : ''}`,
  };
}

/** Conversion parameters with any valid overrides applied. */
export function applyAssumptions(
  overrides: AssumptionOverrides,
  base: ConversionParameters = CONVERSION_2026,
): ConversionParameters {
  const clean = sanitiseOverrides(overrides);

  return {
    exchangeRate: override(base.exchangeRate, clean.exchangeRate),
    householdPpp: {
      referenceYear: base.householdPpp.referenceYear,
      canada: override(base.householdPpp.canada, clean.householdPppCanada),
      austria: override(base.householdPpp.austria, clean.householdPppAustria),
    },
    gdpPpp: {
      referenceYear: base.gdpPpp.referenceYear,
      canada: override(base.gdpPpp.canada, clean.gdpPppCanada),
      austria: override(base.gdpPpp.austria, clean.gdpPppAustria),
    },
  };
}
