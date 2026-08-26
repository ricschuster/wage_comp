import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { App } from './App.tsx';
import { Methodology } from './Methodology.tsx';
import { render } from './test-render.ts';
import { SOURCE_GROUPS, sourceGroupsForYear } from '../data/source-groups.ts';
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

  it('follows the tax year rather than restating one', () => {
    const { container } = render(<Methodology taxYear={2025} />);
    const text = container.textContent ?? '';

    // 2025 figures, all read from the parameters rather than written in prose.
    expect(text).toContain('for the 2025 tax year');
    expect(text).toMatch(/lowest federal rate for 2025 is\s*14\.5%/);
    expect(text).toMatch(/13,308 euro/);
    // The PPP reference year trails the tax year in both directions.
    expect(text).toMatch(/reference year is\s*2024/);
  });

  it('cites the sources for the year on screen, not the current one', () => {
    const { container } = render(<Methodology taxYear={2025} />);
    const expected = collectAllSources(sourceGroupsForYear(2025));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(expected.length);
    expect(container.textContent).toContain(`sourced parameters for 2025`);
  });

  it('describes the Vienna housing levy only for the years it applies to', () => {
    const later = render(<Methodology taxYear={2026} />);
    expect(later.container.textContent).toMatch(/raised its housing levy to 1\.5%/);

    const earlier = render(<Methodology taxYear={2025} />);
    expect(earlier.container.textContent).not.toMatch(
      /raised its housing levy to 1\.5%/,
    );
    expect(earlier.container.textContent).toMatch(/national rate of\s*0\.50% applied/);
  });

  it('warns that two years is not a trend', () => {
    const { container } = render(<Methodology />);
    expect(container.textContent).toMatch(/Two years is not a trend/);
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
