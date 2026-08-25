import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';
import { CONVERSION_2026 } from '../data/conversion-2026.ts';
import { SCENARIOS } from '../data/scenarios.ts';

// The app writes its state into the address bar and reads it back on mount, so
// without this each test would inherit the previous test's scenario.
beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

function render(): { container: HTMLElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<App />);
  });
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

describe('AssumptionsPanel', () => {
  it('offers every scenario', () => {
    const { container, root } = render();
    expect(container.querySelectorAll('.scenario')).toHaveLength(SCENARIOS.length);
    act(() => root.unmount());
  });

  it('applies a scenario to the inputs', () => {
    const { container, root } = render();
    const basis = container.querySelector<HTMLSelectElement>('#basis');
    expect(basis?.value).toBe('ppp');

    const fxScenario = [
      ...container.querySelectorAll<HTMLButtonElement>('.scenario'),
    ].find((button) => button.textContent === 'BC, exchange rate');
    act(() => fxScenario?.click());

    expect(container.querySelector<HTMLSelectElement>('#basis')?.value).toBe('fx');
    act(() => root.unmount());
  });

  it('starts with no assumption marked as modified', () => {
    const { container, root } = render();
    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(0);
    act(() => root.unmount());
  });

  it('flags a changed assumption and offers a reset', () => {
    const { container, root } = render();
    const fx = container.querySelector<HTMLInputElement>('#assumption-exchangeRate');
    setValue(fx as HTMLInputElement, '1.5');

    expect(container.querySelectorAll('.assumption .badge').length).toBeGreaterThan(0);
    const reset = [
      ...container.querySelectorAll<HTMLButtonElement>('.assumption .link'),
    ];
    expect(reset.length).toBe(1);
    expect(reset[0]?.textContent).toMatch(String(CONVERSION_2026.exchangeRate.value));
    act(() => root.unmount());
  });

  it('resets a single assumption back to its sourced default', () => {
    const { container, root } = render();
    setValue(
      container.querySelector<HTMLInputElement>('#assumption-exchangeRate')!,
      '1.5',
    );
    act(() => {
      container.querySelector<HTMLButtonElement>('.assumption .link')?.click();
    });

    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(0);
    expect(
      container.querySelector<HTMLInputElement>('#assumption-exchangeRate')?.value,
    ).toBe(String(CONVERSION_2026.exchangeRate.value));
    act(() => root.unmount());
  });

  it('resets everything at once', () => {
    const { container, root } = render();
    setValue(
      container.querySelector<HTMLInputElement>('#assumption-exchangeRate')!,
      '1.5',
    );
    setValue(
      container.querySelector<HTMLInputElement>('#assumption-householdPppCanada')!,
      '1.3',
    );
    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(2);

    act(() => {
      container.querySelector<HTMLButtonElement>('.reset-all')?.click();
    });
    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(0);
    act(() => root.unmount());
  });

  it('disables reset-all when nothing is modified', () => {
    const { container, root } = render();
    expect(container.querySelector<HTMLButtonElement>('.reset-all')?.disabled).toBe(
      true,
    );
    act(() => root.unmount());
  });

  it('ignores an out-of-range assumption rather than using it', () => {
    const { container, root } = render();
    const before = container.querySelector('.card .figure')?.textContent;

    setValue(
      container.querySelector<HTMLInputElement>('#assumption-exchangeRate')!,
      '500',
    );

    // No override recorded, so the results are unchanged.
    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(0);
    expect(container.querySelector('.card .figure')?.textContent).toBe(before);
    act(() => root.unmount());
  });

  it('changes the results when a valid assumption is applied', () => {
    const { container, root } = render();
    const ratioCard = () =>
      container.querySelector('.card--ratio .figure')?.textContent;
    const before = ratioCard();

    setValue(
      container.querySelector<HTMLInputElement>('#assumption-householdPppAustria')!,
      '0.6',
    );
    expect(ratioCard()).not.toBe(before);
    act(() => root.unmount());
  });

  it('restores a shared scenario from the opening URL', () => {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?b=fx&i=55000&sp=0&fx=1.5`,
    );
    const { container, root } = render();

    expect(container.querySelector<HTMLSelectElement>('#basis')?.value).toBe('fx');
    expect(container.querySelector<HTMLInputElement>('#highlightIncome')?.value).toBe(
      '55000',
    );
    expect(container.querySelector<HTMLInputElement>('#specialPayments')?.checked).toBe(
      false,
    );
    expect(
      container.querySelector<HTMLInputElement>('#assumption-exchangeRate')?.value,
    ).toBe('1.5');
    expect(container.querySelectorAll('.assumption .badge').length).toBe(1);
    act(() => root.unmount());
  });

  it('ignores a corrupt link rather than failing to load', () => {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?b=nonsense&p=QC&fx=500`,
    );
    const { container, root } = render();

    expect(container.querySelector<HTMLSelectElement>('#basis')?.value).toBe('ppp');
    expect(container.querySelector<HTMLSelectElement>('#province')?.value).toBe('BC');
    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(0);
    expect(container.querySelector('.cards')).not.toBeNull();
    act(() => root.unmount());
  });

  it('shows a share link that reflects the current state', () => {
    const { container, root } = render();
    const field = container.querySelector<HTMLInputElement>('.share-row input');
    const initial = field?.value ?? '';

    setValue(container.querySelector<HTMLInputElement>('#highlightIncome')!, '55000');
    const updated =
      container.querySelector<HTMLInputElement>('.share-row input')?.value ?? '';

    expect(updated).not.toBe(initial);
    expect(updated).toMatch(/i=55000/);
    act(() => root.unmount());
  });
});
