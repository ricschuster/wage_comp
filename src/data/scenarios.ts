/**
 * Named scenario presets.
 *
 * Quick starting points, not the only way to use the tool: any combination of
 * inputs can be built by hand and shared as a link.
 */

import type { ComparisonBasis, PppBasis } from './types.ts';
import type { ProvinceCode } from './provinces/index.ts';

export interface Scenario {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly province: ProvinceCode;
  readonly basis: ComparisonBasis;
  readonly pppBasis: PppBasis;
  readonly specialPayments: boolean;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'bc-household',
    name: 'BC, purchasing power',
    description:
      'The default. British Columbia against Austria on household consumption PPP.',
    province: 'BC',
    basis: 'ppp',
    pppBasis: 'household',
    specialPayments: true,
  },
  {
    id: 'bc-fx',
    name: 'BC, exchange rate',
    description:
      'Same comparison at the market rate, for money that will actually be moved.',
    province: 'BC',
    basis: 'fx',
    pppBasis: 'household',
    specialPayments: true,
  },
  {
    id: 'bc-gdp',
    name: 'BC, GDP PPP',
    description:
      'The basis the predecessor workbook used, kept so the difference is visible.',
    province: 'BC',
    basis: 'ppp',
    pppBasis: 'gdp',
    specialPayments: true,
  },
  {
    id: 'bc-no-special',
    name: 'Austria without 13th and 14th',
    description:
      'Not a realistic scenario. Shows what the Austrian special payment regime is worth.',
    province: 'BC',
    basis: 'ppp',
    pppBasis: 'household',
    specialPayments: false,
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}
