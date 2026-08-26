import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { App } from './App.tsx';
import { Methodology } from './Methodology.tsx';
import { render } from './test-render.ts';
import { SOURCE_GROUPS } from '../data/source-groups.ts';
import { collectAllSources } from '../data/sources.ts';
import { SUPPORTED_PROVINCES, getProvince } from '../data/provinces/index.ts';

// The app syncs its state to the address bar and reads it back on mount.
beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

const EXPECTED_SOURCES = collectAllSources(SOURCE_GROUPS);

describe('Methodology', () => {
  it('lists every sourced parameter, so the page cannot drift from the model', () => {
    const { container } = render(<Methodology />);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(
      EXPECTED_SOURCES.length,
    );
  });

  it('links every parameter to its source', () => {
    const { container } = render(<Methodology />);
    const links = [...container.querySelectorAll<HTMLAnchorElement>('tbody a')];
    expect(links).toHaveLength(EXPECTED_SOURCES.length);
    for (const link of links) {
      expect(link.href).toMatch(/^https:\/\//);
    }
  });

  it('states the four limits of the comparison', () => {
    const { container } = render(<Methodology />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/same gross in both countries/i);
    expect(text).toMatch(/what deductions buy/i);
    expect(text).toMatch(/Housing is the largest uncorrected term/i);
    expect(text).toMatch(/Childcare, tuition and transit/i);
  });

  it('records the corrections that would otherwise be invisible', () => {
    const { container } = render(<Methodology />);
    const text = container.textContent ?? '';
    // The 14% federal rate and the BC 5.06% versus 5.6% discrepancy.
    expect(text).toMatch(/14%/);
    expect(text).toMatch(/5\.06%/);
    expect(text).toMatch(/5\.6%/);
  });

  it('says the PPP reference year trails the tax year', () => {
    const { container } = render(<Methodology />);
    expect(container.textContent).toMatch(/2025/);
  });

  it('warns that the conversion basis barely moves the answer', () => {
    const { container } = render(<Methodology />);
    expect(container.textContent).toMatch(/barely moves the ratio/i);
  });

  it('describes what makes Quebec different rather than omitting it', () => {
    const { container } = render(<Methodology />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/QPP/);
    expect(text).toMatch(/QPIP/);
    expect(text).toMatch(/abatement/i);
    expect(text).toMatch(/deduction for workers/i);
  });

  it('cites every jurisdiction, not just a hardcoded few', () => {
    const { container } = render(<Methodology />);
    const text = container.textContent ?? '';
    // The source table is built from the province lookup, so each jurisdiction
    // must appear by name. If one were added and the page not updated, this
    // fails rather than the citation list quietly going stale.
    for (const code of SUPPORTED_PROVINCES) {
      expect(text, code).toContain(getProvince(code).name);
    }
  });
});

describe('view switching', () => {
  it('starts on the dashboard', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.controls')).not.toBeNull();
    expect(container.querySelector('.prose')).toBeNull();
  });

  it('switches to the methodology and back', () => {
    const { container } = render(<App />);
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('.view-tab')];
    expect(tabs).toHaveLength(2);

    act(() => tabs[1]?.click());
    expect(container.querySelector('.prose')).not.toBeNull();
    expect(container.querySelector('.controls')).toBeNull();

    act(() => {
      container.querySelectorAll<HTMLButtonElement>('.view-tab')[0]?.click();
    });
    expect(container.querySelector('.controls')).not.toBeNull();
  });

  it('marks the active tab for assistive technology', () => {
    const { container } = render(<App />);
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('.view-tab')];
    expect(tabs[0]?.getAttribute('aria-current')).toBe('page');
    expect(tabs[1]?.getAttribute('aria-current')).toBeNull();
  });

  it('reaches the methodology from the footer link too', () => {
    const { container } = render(<App />);
    const footerLink = container.querySelector<HTMLButtonElement>('footer .link');
    act(() => footerLink?.click());
    expect(container.querySelector('.prose')).not.toBeNull();
  });
});
