import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App.tsx';
import { render, setValue } from './test-render.ts';
import { SUPPORTED_PROVINCES } from '../data/provinces/index.ts';

// The app syncs its state to the address bar and reads it back on mount, so
// each test starts from a clean URL rather than inheriting the previous one.
beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

describe('App', () => {
  it('renders the headline cards on first paint', () => {
    const { container } = render(<App />);
    const headings = [...container.querySelectorAll('.card h3')].map(
      (node) => node.textContent,
    );
    expect(headings).toContain('Canada net');
    expect(headings).toContain('Austria net');
    expect(headings).toContain('Ratio, Austria over Canada');
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
