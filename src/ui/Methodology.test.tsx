import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';
import { Methodology } from './Methodology.tsx';
import { collectAllSources } from '../data/sources.ts';
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

const EXPECTED_SOURCES = collectAllSources([
  { label: 'Canada federal', parameters: CANADA_FEDERAL_2026 },
  { label: 'Canada payroll', parameters: CANADA_PAYROLL_2026 },
  { label: 'British Columbia', parameters: getProvince('BC') },
  { label: 'Austria', parameters: AUSTRIA_2026 },
  { label: 'Conversion', parameters: CONVERSION_2026 },
]);

describe('Methodology', () => {
  it('lists every sourced parameter, so the page cannot drift from the model', () => {
    const { container, root } = render(<Methodology />);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(
      EXPECTED_SOURCES.length,
    );
    act(() => root.unmount());
  });

  it('links every parameter to its source', () => {
    const { container, root } = render(<Methodology />);
    const links = [...container.querySelectorAll<HTMLAnchorElement>('tbody a')];
    expect(links).toHaveLength(EXPECTED_SOURCES.length);
    for (const link of links) {
      expect(link.href).toMatch(/^https:\/\//);
    }
    act(() => root.unmount());
  });

  it('states the four limits of the comparison', () => {
    const { container, root } = render(<Methodology />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/same gross in both countries/i);
    expect(text).toMatch(/what deductions buy/i);
    expect(text).toMatch(/Housing is the largest uncorrected term/i);
    expect(text).toMatch(/Childcare, tuition and transit/i);
    act(() => root.unmount());
  });

  it('records the corrections that would otherwise be invisible', () => {
    const { container, root } = render(<Methodology />);
    const text = container.textContent ?? '';
    // The 14% federal rate and the BC 5.06% versus 5.6% discrepancy.
    expect(text).toMatch(/14%/);
    expect(text).toMatch(/5\.06%/);
    expect(text).toMatch(/5\.6%/);
    act(() => root.unmount());
  });

  it('says the PPP reference year trails the tax year', () => {
    const { container, root } = render(<Methodology />);
    expect(container.textContent).toMatch(/2025/);
    act(() => root.unmount());
  });

  it('warns that the conversion basis barely moves the answer', () => {
    const { container, root } = render(<Methodology />);
    expect(container.textContent).toMatch(/barely moves the ratio/i);
    act(() => root.unmount());
  });

  it('states that Quebec is absent rather than approximated', () => {
    const { container, root } = render(<Methodology />);
    expect(container.textContent).toMatch(/Quebec/);
    act(() => root.unmount());
  });
});

describe('view switching', () => {
  it('starts on the dashboard', () => {
    const { container, root } = render(<App />);
    expect(container.querySelector('.controls')).not.toBeNull();
    expect(container.querySelector('.prose')).toBeNull();
    act(() => root.unmount());
  });

  it('switches to the methodology and back', () => {
    const { container, root } = render(<App />);
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('.view-tab')];
    expect(tabs).toHaveLength(2);

    act(() => tabs[1]?.click());
    expect(container.querySelector('.prose')).not.toBeNull();
    expect(container.querySelector('.controls')).toBeNull();

    act(() => {
      container.querySelectorAll<HTMLButtonElement>('.view-tab')[0]?.click();
    });
    expect(container.querySelector('.controls')).not.toBeNull();
    act(() => root.unmount());
  });

  it('marks the active tab for assistive technology', () => {
    const { container, root } = render(<App />);
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('.view-tab')];
    expect(tabs[0]?.getAttribute('aria-current')).toBe('page');
    expect(tabs[1]?.getAttribute('aria-current')).toBeNull();
    act(() => root.unmount());
  });

  it('reaches the methodology from the footer link too', () => {
    const { container, root } = render(<App />);
    const footerLink = container.querySelector<HTMLButtonElement>('footer .link');
    act(() => footerLink?.click());
    expect(container.querySelector('.prose')).not.toBeNull();
    act(() => root.unmount());
  });
});
