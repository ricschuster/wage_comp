import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { InfoTip } from './InfoTip.tsx';
import { GLOSSARY } from './glossary.ts';
import { render } from './test-render.ts';

function trigger(container: HTMLElement): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>('.infotip__trigger');
  if (!button) {
    throw new Error('no tooltip trigger rendered');
  }
  return button;
}

function click(button: HTMLButtonElement): void {
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('InfoTip', () => {
  it('starts closed', () => {
    const { container } = render(<InfoTip term="ratio" />);
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.infotip__panel')).toBeNull();
  });

  it('names the term it explains, so the trigger is not a bare question mark', () => {
    const { container } = render(<InfoTip term="ratio" />);
    expect(trigger(container).getAttribute('aria-label')).toBe(
      `What is ${GLOSSARY.ratio.term}?`,
    );
  });

  it('shows the term and its tip when opened', () => {
    const { container } = render(<InfoTip term="effectiveRate" />);
    click(trigger(container));

    const panel = container.querySelector('.infotip__panel');
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain(GLOSSARY.effectiveRate.term);
    expect(panel?.textContent).toContain(GLOSSARY.effectiveRate.tip);
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');
  });

  it('associates the panel with the trigger while it is open', () => {
    const { container } = render(<InfoTip term="ratio" />);
    click(trigger(container));

    const panel = container.querySelector('.infotip__panel');
    const button = trigger(container);
    expect(panel?.id).toBeTruthy();
    expect(button.getAttribute('aria-controls')).toBe(panel?.id);
    expect(button.getAttribute('aria-describedby')).toBe(panel?.id);
  });

  it('points at the methodology when the term has a section there', () => {
    const { container } = render(<InfoTip term="austriaNetCommon" />);
    click(trigger(container));
    expect(container.querySelector('.infotip__section')?.textContent).toContain(
      GLOSSARY.austriaNetCommon.section as string,
    );
  });

  it('omits the methodology line for a term with no section', () => {
    const { container } = render(<InfoTip term="effectiveRate" />);
    click(trigger(container));
    expect(container.querySelector('.infotip__section')).toBeNull();
  });

  it('closes on a second click', () => {
    const { container } = render(<InfoTip term="ratio" />);
    click(trigger(container));
    click(trigger(container));
    expect(container.querySelector('.infotip__panel')).toBeNull();
  });

  it('closes on Escape', () => {
    const { container } = render(<InfoTip term="ratio" />);
    click(trigger(container));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(container.querySelector('.infotip__panel')).toBeNull();
  });

  it('leaves other keys alone', () => {
    const { container } = render(<InfoTip term="ratio" />);
    click(trigger(container));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    expect(container.querySelector('.infotip__panel')).not.toBeNull();
  });

  it('closes when something outside it is pressed', () => {
    const { container } = render(<InfoTip term="ratio" />);
    click(trigger(container));

    act(() => {
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    expect(container.querySelector('.infotip__panel')).toBeNull();
  });

  it('stays open when the panel itself is pressed, so the text is selectable', () => {
    const { container } = render(<InfoTip term="ratio" />);
    click(trigger(container));

    const panel = container.querySelector('.infotip__panel');
    act(() => {
      panel?.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    expect(container.querySelector('.infotip__panel')).not.toBeNull();
  });

  it('hangs the panel from the right edge when asked', () => {
    const { container } = render(<InfoTip term="ratio" align="end" />);
    click(trigger(container));
    expect(
      container
        .querySelector('.infotip__panel')
        ?.classList.contains('infotip__panel--end'),
    ).toBe(true);
  });

  it('gives two instances of one term distinct panel ids', () => {
    const { container } = render(
      <>
        <InfoTip term="effectiveRate" />
        <InfoTip term="effectiveRate" />
      </>,
    );
    const [first, second] = [
      ...container.querySelectorAll<HTMLButtonElement>('.infotip__trigger'),
    ];
    expect(first?.getAttribute('aria-controls')).not.toBe(
      second?.getAttribute('aria-controls'),
    );
  });
});
