import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';
import { AuditView } from './AuditView.tsx';
import {
  compare,
  explainComparison,
  type ComparisonParameters,
} from '../engine/index.ts';
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

const RESULT = compare(100_000, P, {
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
});

describe('AuditView', () => {
  it('renders every section the engine explains', () => {
    const { container, root } = render(<AuditView result={RESULT} parameters={P} />);
    const expected = explainComparison(RESULT, P).length;
    expect(container.querySelectorAll('.audit-section')).toHaveLength(expected);
    act(() => root.unmount());
  });

  it('renders every entry, so no step of the working is hidden', () => {
    const { container, root } = render(<AuditView result={RESULT} parameters={P} />);
    const expected = explainComparison(RESULT, P).reduce(
      (count, section) => count + section.entries.length,
      0,
    );
    expect(container.querySelectorAll('.audit-entry')).toHaveLength(expected);
    act(() => root.unmount());
  });

  it('shows a formula for each entry', () => {
    const { container, root } = render(<AuditView result={RESULT} parameters={P} />);
    for (const code of container.querySelectorAll('.audit-entry code')) {
      expect(code.textContent?.trim()).not.toBe('');
    }
    act(() => root.unmount());
  });

  it('links parameters to their sources', () => {
    const { container, root } = render(<AuditView result={RESULT} parameters={P} />);
    const links = [
      ...container.querySelectorAll<HTMLAnchorElement>('.audit-sources a'),
    ];
    expect(links.length).toBeGreaterThan(10);
    for (const link of links) {
      expect(link.href).toMatch(/^https:\/\//);
      expect(link.rel).toContain('noreferrer');
    }
    act(() => root.unmount());
  });

  it('does not repeat the same source twice within one entry', () => {
    const { container, root } = render(<AuditView result={RESULT} parameters={P} />);
    for (const list of container.querySelectorAll('.audit-sources')) {
      const hrefs = [...list.querySelectorAll('a')].map((a) => a.getAttribute('href'));
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
    act(() => root.unmount());
  });

  it('warns that the PPP reference year trails the tax year', () => {
    const { container, root } = render(<AuditView result={RESULT} parameters={P} />);
    expect(container.textContent).toMatch(/PPP factors describe 2025/);
    act(() => root.unmount());
  });

  it('omits that warning when comparing on the exchange rate', () => {
    const fx = compare(100_000, P, {
      basis: 'fx',
      pppBasis: 'household',
      specialPayments: true,
    });
    const { container, root } = render(<AuditView result={fx} parameters={P} />);
    expect(container.textContent).not.toMatch(/PPP factors describe/);
    act(() => root.unmount());
  });

  it('starts collapsed so it does not bury the dashboard', () => {
    const { container, root } = render(<AuditView result={RESULT} parameters={P} />);
    const details = container.querySelector('details');
    expect(details?.open).toBe(false);
    expect(details?.querySelector('summary')?.textContent).toMatch(/Show the working/);
    act(() => root.unmount());
  });
});

describe('audit view on the dashboard', () => {
  it('is present alongside the results', () => {
    const { container, root } = render(<App />);
    expect(container.querySelector('.audit')).not.toBeNull();
    act(() => root.unmount());
  });

  it('is absent from the methodology view', () => {
    const { container, root } = render(<App />);
    act(() => {
      container.querySelectorAll<HTMLButtonElement>('.view-tab')[1]?.click();
    });
    expect(container.querySelector('.audit')).toBeNull();
    act(() => root.unmount());
  });
});
