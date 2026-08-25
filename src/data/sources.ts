/**
 * Enumerates every sourced parameter the model uses.
 *
 * This walks the parameter objects rather than keeping a hand-written list, so
 * a parameter added later cannot quietly fail to appear on the methodology
 * page. That matters: the whole provenance commitment is worth little if the
 * user-facing citation list can drift out of date.
 */

import type { Sourced } from '../engine/types.ts';

export interface SourceRecord {
  /** Where the value sits, for example "Canada federal / brackets". */
  readonly path: string;
  readonly entry: Sourced<unknown>;
}

/** True when a value looks like a `Sourced<T>` record. */
function isSourced(value: unknown): value is Sourced<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    'value' in candidate &&
    typeof candidate['source'] === 'string' &&
    typeof candidate['retrieved'] === 'string'
  );
}

/** Turns a camelCase key into something readable. */
function humanise(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/**
 * Every `Sourced` value inside `root`, depth first, with a readable path.
 *
 * Arrays are not descended into: a bracket table is one sourced value, not one
 * per band.
 */
export function collectSources(root: unknown, rootLabel: string): SourceRecord[] {
  const found: SourceRecord[] = [];

  const walk = (node: unknown, trail: string[]): void => {
    if (isSourced(node)) {
      found.push({ path: trail.join(' / '), entry: node });
      return;
    }
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
      return;
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      walk(child, [...trail, humanise(key)]);
    }
  };

  walk(root, [rootLabel]);
  return found;
}

/** Collects across several parameter objects at once. */
export function collectAllSources(
  groups: readonly { label: string; parameters: unknown }[],
): SourceRecord[] {
  return groups.flatMap((group) => collectSources(group.parameters, group.label));
}
