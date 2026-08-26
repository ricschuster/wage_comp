import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { App } from './App.tsx';
import { EmployerCostPanel } from './EmployerCostPanel.tsx';
import { render } from './test-render.ts';
import { compare, type ComparisonParameters } from '../engine/index.ts';
import { AUSTRIA_2026 } from '../data/austria-2026.ts';
import { canadaParametersFor } from '../data/canada.ts';
import { CONVERSION_2026 } from '../data/conversion-2026.ts';

beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

const P: ComparisonParameters = {
  canada: canadaParametersFor('BC'),
  austria: AUSTRIA_2026,
  conversion: CONVERSION_2026,
};

const RESULT = compare(100_000, P, {
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
});

describe('EmployerCostPanel', () => {
  it('shows both countries with a component breakdown', () => {
    const { container } = render(<EmployerCostPanel result={RESULT} />);
    const headings = [...container.querySelectorAll('h4')].map((n) => n.textContent);
    expect(headings).toEqual(['Canada', 'Austria']);
    expect(container.querySelectorAll('dl > div').length).toBeGreaterThan(5);
  });

  it('leads with the two load rates, so the gap is visible unopened', () => {
    const { container } = render(<EmployerCostPanel result={RESULT} />);
    const summary = container.querySelector('summary')?.textContent ?? '';
    expect(summary).toMatch(/Cost to the employer/);
    // Austria first, then Canada, both as percentages.
    expect(summary).toMatch(/%.*%/);
  });

  it('explains why the two behave differently at high salary', () => {
    const { container } = render(<EmployerCostPanel result={RESULT} />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/capped/);
    expect(text).toMatch(/uncapped/);
  });

  it('says provincial employer health taxes are not modelled', () => {
    const { container } = render(<EmployerCostPanel result={RESULT} />);
    expect(container.textContent).toMatch(/employer health taxes are not\s+modelled/);
  });

  it('starts collapsed', () => {
    const { container } = render(<EmployerCostPanel result={RESULT} />);
    expect(container.querySelector('details')?.open).toBe(false);
  });

  it('appears on the dashboard and not on the methodology view', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.employer')).not.toBeNull();
    act(() => {
      container.querySelectorAll<HTMLButtonElement>('.view-tab')[1]?.click();
    });
    expect(container.querySelector('.employer')).toBeNull();
  });
});
