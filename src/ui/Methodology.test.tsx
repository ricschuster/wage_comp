import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';
import { Methodology } from './Methodology.tsx';
import { SOURCE_GROUPS } from '../data/source-groups.ts';
import { collectAllSources } from '../data/sources.ts';
import { SUPPORTED_PROVINCES, getProvince } from '../data/provinces/index.ts';

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

const EXPECTED_SOURCES = collectAllSources(SOURCE_GROUPS);

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

  it('describes what makes Quebec different rather than omitting it', () => {
    const { container, root } = render(<Methodology />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/QPP/);
    expect(text).toMatch(/QPIP/);
    expect(text).toMatch(/abatement/i);
    expect(text).toMatch(/deduction for workers/i);
    act(() => root.unmount());
  });

  it('cites every jurisdiction, not just a hardcoded few', () => {
    const { container, root } = render(<Methodology />);
    const text = container.textContent ?? '';
    // The source table is built from the province lookup, so each jurisdiction
    // must appear by name. If one were added and the page not updated, this
    // fails rather than the citation list quietly going stale.
    for (const code of SUPPORTED_PROVINCES) {
      expect(text, code).toContain(getProvince(code).name);
    }
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
