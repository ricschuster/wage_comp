import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';
import { Charts } from './Charts.tsx';
import { compareRange, type ComparisonParameters } from '../engine/index.ts';
import { AUSTRIA_2026 } from '../data/austria-2026.ts';
import { CANADA_FEDERAL_2026 } from '../data/canada-federal-2026.ts';
import { CANADA_PAYROLL_2026 } from '../data/canada-payroll-2026.ts';
import { CONVERSION_2026 } from '../data/conversion-2026.ts';
import { getProvince } from '../data/provinces/index.ts';

// The app syncs its state to the address bar and reads it back on mount.
beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

function render(node: React.ReactElement): { container: HTMLElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

const P: ComparisonParameters = {
  canada: {
    federal: CANADA_FEDERAL_2026,
    payroll: CANADA_PAYROLL_2026,
    province: getProvince('BC'),
  },
  austria: AUSTRIA_2026,
  conversion: CONVERSION_2026,
};

const ROWS = compareRange(40_000, 300_000, 20_000, P, {
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
});

describe('Charts', () => {
  it('draws the three charts the brief asks for', () => {
    const { container, root } = render(<Charts rows={ROWS} />);
    const titles = [...container.querySelectorAll('figcaption h3')].map(
      (node) => node.textContent,
    );
    expect(titles).toEqual([
      'Take-home income',
      'Effective deduction rate',
      'Austria divided by Canada',
    ]);
    act(() => root.unmount());
  });

  it('plots one point per row on every series', () => {
    const { container, root } = render(<Charts rows={ROWS} />);
    for (const polyline of container.querySelectorAll('polyline')) {
      const points = (polyline.getAttribute('points') ?? '').split(' ').filter(Boolean);
      expect(points).toHaveLength(ROWS.length);
    }
    act(() => root.unmount());
  });

  it('distinguishes the two countries by dash pattern, not colour alone', () => {
    const { container, root } = render(<Charts rows={ROWS} />);
    const first = container.querySelector('figure');
    const lines = [...(first?.querySelectorAll('polyline') ?? [])];
    expect(lines).toHaveLength(2);
    const dashes = lines.map((line) => line.getAttribute('stroke-dasharray'));
    expect(new Set(dashes).size).toBe(2);
    act(() => root.unmount());
  });

  it('puts a reference line at 1.0 on the ratio chart only', () => {
    const { container, root } = render(<Charts rows={ROWS} />);
    const figures = [...container.querySelectorAll('figure')];
    expect(figures[0]?.querySelectorAll('.reference')).toHaveLength(0);
    expect(figures[1]?.querySelectorAll('.reference')).toHaveLength(0);
    expect(figures[2]?.querySelectorAll('.reference')).toHaveLength(1);
    expect(figures[2]?.querySelector('.reference-label')?.textContent).toMatch(/1\.0/);
    act(() => root.unmount());
  });

  it('labels each chart for assistive technology', () => {
    const { container, root } = render(<Charts rows={ROWS} />);
    for (const svg of container.querySelectorAll('figure > .chart-scroll > svg')) {
      expect(svg.getAttribute('role')).toBe('img');
      expect(svg.getAttribute('aria-label')).toBeTruthy();
      expect(svg.querySelector('title')?.textContent).toBeTruthy();
    }
    act(() => root.unmount());
  });

  it('gives every chart a legend', () => {
    const { container, root } = render(<Charts rows={ROWS} />);
    expect(container.querySelectorAll('.legend')).toHaveLength(3);
    act(() => root.unmount());
  });

  it('asks for a wider range instead of drawing a chart from one point', () => {
    const { container, root } = render(<Charts rows={ROWS.slice(0, 1)} />);
    expect(container.querySelectorAll('figure')).toHaveLength(0);
    expect(container.textContent).toMatch(/Widen the income range/);
    act(() => root.unmount());
  });

  it('handles an empty range without throwing', () => {
    const { container, root } = render(<Charts rows={[]} />);
    expect(container.querySelectorAll('figure')).toHaveLength(0);
    act(() => root.unmount());
  });
});

describe('charts on the dashboard', () => {
  it('appear on first paint', () => {
    const { container, root } = render(<App />);
    expect(container.querySelectorAll('.chart')).toHaveLength(3);
    act(() => root.unmount());
  });

  it('are absent from the methodology view', () => {
    const { container, root } = render(<App />);
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('.view-tab')];
    act(() => tabs[1]?.click());
    expect(container.querySelectorAll('.chart')).toHaveLength(0);
    act(() => root.unmount());
  });
});
