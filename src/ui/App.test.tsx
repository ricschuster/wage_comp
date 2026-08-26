import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { App } from './App.tsx';
import { labelText, render, setValue } from './test-render.ts';
import { SUPPORTED_PROVINCES } from '../data/provinces/index.ts';
import { CURRENT_TAX_YEAR, TAX_YEARS } from '../data/years.ts';

// The app syncs its state to the address bar and reads it back on mount, so
// each test starts from a clean URL rather than inheriting the previous one.
beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

describe('App', () => {
  it('renders the headline cards on first paint', () => {
    const { container } = render(<App />);
    const headings = [...container.querySelectorAll('.card h3')].map(labelText);
    expect(headings).toContain('Canada net');
    expect(headings).toContain('Austria net');
    expect(headings).toContain('Ratio, Austria over Canada');
  });

  // A guard on the feature rather than on a count: the point is that the
  // headline figures are explained on the page, not somewhere else.
  it('explains the headline figures where they are shown', () => {
    const { container } = render(<App />);
    for (const selector of ['.card h3', '.equivalence h3', 'thead th']) {
      const explained = [...container.querySelectorAll(selector)].filter((node) =>
        node.querySelector('.infotip__trigger'),
      );
      expect(explained.length, `nothing explained in ${selector}`).toBeGreaterThan(0);
    }
  });

  it('opens an explanation on the dashboard', () => {
    const { container } = render(<App />);
    const first = container.querySelector<HTMLButtonElement>('.infotip__trigger');
    act(() => {
      first?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('.infotip__panel')?.textContent ?? '').not.toBe('');
  });

  it('fills the results table from the default range', () => {
    const { container } = render(<App />);
    // 40,000 to 300,000 in 20,000 steps.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(14);
  });

  it('offers exactly the supported provinces', () => {
    const { container } = render(<App />);
    const select = container.querySelector<HTMLSelectElement>('#province');
    expect(select).not.toBeNull();
    // Compared against the lookup rather than a hardcoded list, so adding a
    // province does not break this test.
    const codes = [...(select?.options ?? [])].map((option) => option.value);
    expect(codes).toEqual(SUPPORTED_PROVINCES);
    expect(codes).toContain('QC');
  });

  it('disables the PPP basis selector when comparing on FX', () => {
    const { container } = render(<App />);
    const basis = container.querySelector<HTMLSelectElement>('#basis');
    const pppBasis = container.querySelector<HTMLSelectElement>('#pppBasis');
    expect(pppBasis?.disabled).toBe(false);

    setValue(basis as HTMLSelectElement, 'fx');
    expect(container.querySelector<HTMLSelectElement>('#pppBasis')?.disabled).toBe(
      true,
    );
  });

  it('recomputes when the highlighted income changes', () => {
    const { container } = render(<App />);
    const before = container.querySelector('.card .figure')?.textContent;

    const income = container.querySelector<HTMLInputElement>('#highlightIncome');
    setValue(income as HTMLInputElement, '50000');

    const after = container.querySelector('.card .figure')?.textContent;
    expect(after).not.toBe(before);
  });

  it('reports an unusable range instead of rendering an empty table', () => {
    const { container } = render(<App />);
    const increment = container.querySelector<HTMLInputElement>('#rangeIncrement');
    setValue(increment as HTMLInputElement, '0');

    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
      /positive increment/,
    );
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('recovers once the range is made valid again', () => {
    const { container } = render(<App />);
    const increment = container.querySelector<HTMLInputElement>('#rangeIncrement');
    setValue(increment as HTMLInputElement, '0');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);

    setValue(
      container.querySelector<HTMLInputElement>('#rangeIncrement') as HTMLInputElement,
      '50000',
    );
    expect(container.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
  });

  it('shows the equivalent Austrian salary', () => {
    const { container } = render(<App />);
    const text = container.querySelector('.equivalence')?.textContent ?? '';
    expect(text).toMatch(/would need/);
    expect(text).toMatch(/€/);
  });

  it('offers exactly the tax years the registry knows', () => {
    const { container } = render(<App />);
    const select = container.querySelector<HTMLSelectElement>('#taxYear');
    expect(select).not.toBeNull();
    const years = [...(select?.options ?? [])].map((option) => Number(option.value));
    expect(years).toEqual([...TAX_YEARS]);
    expect(select?.value).toBe(String(CURRENT_TAX_YEAR));
  });

  it('names the selected tax year in the lede', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.lede')?.textContent).toContain(
      `Tax year ${CURRENT_TAX_YEAR}`,
    );

    setValue(container.querySelector<HTMLSelectElement>('#taxYear')!, '2025');
    expect(container.querySelector('.lede')?.textContent).toContain('Tax year 2025');
  });

  it('recomputes everything when the tax year changes', () => {
    const { container } = render(<App />);
    const figures = () =>
      [...container.querySelectorAll('.card .figure')].map((node) => node.textContent);
    const before = figures();

    setValue(container.querySelector<HTMLSelectElement>('#taxYear')!, '2025');

    // Different brackets, different contribution ceilings and a different
    // exchange rate: no headline figure should survive unchanged.
    expect(figures()).not.toEqual(before);
  });

  it('leaves more take-home in 2026 than in 2025 at the same gross', () => {
    // The federal rate cut from 14.5% to 14%, plus indexation, against a higher
    // CPP ceiling. Checked against the engine in src/data/year-2025.test.ts;
    // this is the same fact reaching the screen.
    const { container } = render(<App />);
    const canadaNet = () => container.querySelector('.card .figure')?.textContent ?? '';
    const later = canadaNet();

    setValue(container.querySelector<HTMLSelectElement>('#taxYear')!, '2025');
    const earlier = canadaNet();

    const toNumber = (text: string) => Number(text.replace(/[^0-9.]/g, ''));
    expect(toNumber(later)).toBeGreaterThan(toNumber(earlier));
  });

  it('carries the tax year in the share link', () => {
    const { container } = render(<App />);
    setValue(container.querySelector<HTMLSelectElement>('#taxYear')!, '2025');
    expect(
      container.querySelector<HTMLInputElement>('.share-row input')?.value,
    ).toMatch(/y=2025/);
  });

  it('restores the tax year from a shared link', () => {
    window.history.replaceState(null, '', `${window.location.pathname}?y=2025`);
    const { container } = render(<App />);
    expect(container.querySelector<HTMLSelectElement>('#taxYear')?.value).toBe('2025');
    expect(container.querySelector('.lede')?.textContent).toContain('Tax year 2025');
  });

  it('handles a zero highlighted income without crashing', () => {
    const { container } = render(<App />);
    const income = container.querySelector<HTMLInputElement>('#highlightIncome');
    setValue(income as HTMLInputElement, '0');

    expect(container.querySelector('.cards')).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
      /above zero/,
    );
  });
});
