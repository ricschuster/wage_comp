import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { App } from './App.tsx';
import { render, setValue } from './test-render.ts';
import { CONVERSION_2026 } from '../data/conversion-2026.ts';
import { SCENARIOS } from '../data/scenarios.ts';

// The app writes its state into the address bar and reads it back on mount, so
// without this each test would inherit the previous test's scenario.
beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

describe('AssumptionsPanel', () => {
  it('offers every scenario', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('.scenario')).toHaveLength(SCENARIOS.length);
  });

  it('applies a scenario to the inputs', () => {
    const { container } = render(<App />);
    const basis = container.querySelector<HTMLSelectElement>('#basis');
    expect(basis?.value).toBe('ppp');

    const fxScenario = [
      ...container.querySelectorAll<HTMLButtonElement>('.scenario'),
    ].find((button) => button.textContent === 'BC, exchange rate');
    act(() => fxScenario?.click());

    expect(container.querySelector<HTMLSelectElement>('#basis')?.value).toBe('fx');
  });

  it('starts with no assumption marked as modified', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(0);
  });

  it('flags a changed assumption and offers a reset', () => {
    const { container } = render(<App />);
    const fx = container.querySelector<HTMLInputElement>('#assumption-exchangeRate');
    setValue(fx as HTMLInputElement, '1.5');

    expect(container.querySelectorAll('.assumption .badge').length).toBeGreaterThan(0);
    const reset = [
      ...container.querySelectorAll<HTMLButtonElement>('.assumption .link'),
    ];
    expect(reset.length).toBe(1);
    expect(reset[0]?.textContent).toMatch(String(CONVERSION_2026.exchangeRate.value));
  });

  it('resets a single assumption back to its sourced default', () => {
    const { container } = render(<App />);
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
  });

  it('resets everything at once', () => {
    const { container } = render(<App />);
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
  });

  it('disables reset-all when nothing is modified', () => {
    const { container } = render(<App />);
    expect(container.querySelector<HTMLButtonElement>('.reset-all')?.disabled).toBe(
      true,
    );
  });

  it('ignores an out-of-range assumption rather than using it', () => {
    const { container } = render(<App />);
    const before = container.querySelector('.card .figure')?.textContent;

    setValue(
      container.querySelector<HTMLInputElement>('#assumption-exchangeRate')!,
      '500',
    );

    // No override recorded, so the results are unchanged.
    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(0);
    expect(container.querySelector('.card .figure')?.textContent).toBe(before);
  });

  it('changes the results when a valid assumption is applied', () => {
    const { container } = render(<App />);
    const ratioCard = () =>
      container.querySelector('.card--ratio .figure')?.textContent;
    const before = ratioCard();

    setValue(
      container.querySelector<HTMLInputElement>('#assumption-householdPppAustria')!,
      '0.6',
    );
    expect(ratioCard()).not.toBe(before);
  });

  it('restores a shared scenario from the opening URL', () => {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?b=fx&i=55000&sp=0&fx=1.5`,
    );
    const { container } = render(<App />);

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
  });

  it('ignores a corrupt link rather than failing to load', () => {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?b=nonsense&p=XX&fx=500`,
    );
    const { container } = render(<App />);

    expect(container.querySelector<HTMLSelectElement>('#basis')?.value).toBe('ppp');
    expect(container.querySelector<HTMLSelectElement>('#province')?.value).toBe('BC');
    expect(container.querySelectorAll('.assumption .badge')).toHaveLength(0);
    expect(container.querySelector('.cards')).not.toBeNull();
  });

  it('shows a share link that reflects the current state', () => {
    const { container } = render(<App />);
    const field = container.querySelector<HTMLInputElement>('.share-row input');
    const initial = field?.value ?? '';

    setValue(container.querySelector<HTMLInputElement>('#highlightIncome')!, '55000');
    const updated =
      container.querySelector<HTMLInputElement>('.share-row input')?.value ?? '';

    expect(updated).not.toBe(initial);
    expect(updated).toMatch(/i=55000/);
  });
});
