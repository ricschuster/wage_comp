import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';
import { SUPPORTED_PROVINCES } from '../data/provinces/index.ts';

// The app syncs its state to the address bar and reads it back on mount, so
// each test starts from a clean URL rather than inheriting the previous one.
beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

// A test that fails part way never reaches its own unmount, and the root it
// leaves mounted makes every later test in the file fail too, burying the one
// real failure. Unmount here instead.
const mounted: { root: Root; container: HTMLElement }[] = [];

afterEach(() => {
  while (mounted.length > 0) {
    const entry = mounted.pop();
    if (!entry) continue;
    act(() => entry.root.unmount());
    entry.container.remove();
  }
});

/** Renders the app into a fresh container, cleaned up automatically. */
function render(): { container: HTMLElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<App />);
  });
  mounted.push({ root, container });
  return { container, root };
}

function setValue(input: HTMLInputElement | HTMLSelectElement, value: string): void {
  const prototype =
    input instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  setter?.call(input, value);
  act(() => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('App', () => {
  it('renders the headline cards on first paint', () => {
    const { container, root } = render();
    const headings = [...container.querySelectorAll('.card h3')].map(
      (node) => node.textContent,
    );
    expect(headings).toContain('Canada net');
    expect(headings).toContain('Austria net');
    expect(headings).toContain('Ratio, Austria over Canada');
    act(() => root.unmount());
  });

  it('fills the results table from the default range', () => {
    const { container, root } = render();
    // 40,000 to 300,000 in 20,000 steps.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(14);
    act(() => root.unmount());
  });

  it('offers exactly the supported provinces', () => {
    const { container, root } = render();
    const select = container.querySelector<HTMLSelectElement>('#province');
    expect(select).not.toBeNull();
    // Compared against the lookup rather than a hardcoded list, so adding a
    // province does not break this test.
    const codes = [...(select?.options ?? [])].map((option) => option.value);
    expect(codes).toEqual(SUPPORTED_PROVINCES);
    expect(codes).not.toContain('QC');
    act(() => root.unmount());
  });

  it('disables the PPP basis selector when comparing on FX', () => {
    const { container, root } = render();
    const basis = container.querySelector<HTMLSelectElement>('#basis');
    const pppBasis = container.querySelector<HTMLSelectElement>('#pppBasis');
    expect(pppBasis?.disabled).toBe(false);

    setValue(basis as HTMLSelectElement, 'fx');
    expect(container.querySelector<HTMLSelectElement>('#pppBasis')?.disabled).toBe(
      true,
    );
    act(() => root.unmount());
  });

  it('recomputes when the highlighted income changes', () => {
    const { container, root } = render();
    const before = container.querySelector('.card .figure')?.textContent;

    const income = container.querySelector<HTMLInputElement>('#highlightIncome');
    setValue(income as HTMLInputElement, '50000');

    const after = container.querySelector('.card .figure')?.textContent;
    expect(after).not.toBe(before);
    act(() => root.unmount());
  });

  it('reports an unusable range instead of rendering an empty table', () => {
    const { container, root } = render();
    const increment = container.querySelector<HTMLInputElement>('#rangeIncrement');
    setValue(increment as HTMLInputElement, '0');

    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
      /positive increment/,
    );
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
    act(() => root.unmount());
  });

  it('recovers once the range is made valid again', () => {
    const { container, root } = render();
    const increment = container.querySelector<HTMLInputElement>('#rangeIncrement');
    setValue(increment as HTMLInputElement, '0');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);

    setValue(
      container.querySelector<HTMLInputElement>('#rangeIncrement') as HTMLInputElement,
      '50000',
    );
    expect(container.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
    act(() => root.unmount());
  });

  it('shows the equivalent Austrian salary', () => {
    const { container, root } = render();
    const text = container.querySelector('.equivalence')?.textContent ?? '';
    expect(text).toMatch(/would need/);
    expect(text).toMatch(/€/);
    act(() => root.unmount());
  });

  it('handles a zero highlighted income without crashing', () => {
    const { container, root } = render();
    const income = container.querySelector<HTMLInputElement>('#highlightIncome');
    setValue(income as HTMLInputElement, '0');

    expect(container.querySelector('.cards')).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
      /above zero/,
    );
    act(() => root.unmount());
  });
});
