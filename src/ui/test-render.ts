/**
 * Mounting helper shared by every UI test suite.
 *
 * It exists to stop one failure becoming many. Each test used to mount a React
 * root and unmount it on the last line of its own body, which meant a test that
 * failed part way never reached its unmount, and the root it left mounted made
 * every later test in that file fail too. The first failure is the only real
 * one, and it was the hardest to see.
 *
 * `onTestFinished` registers the cleanup at mount time instead, so it runs
 * whether the test passes, fails or throws.
 */

import type { ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { onTestFinished } from 'vitest';

export interface Rendered {
  readonly container: HTMLElement;
  readonly root: Root;
}

/** Renders into a fresh container that is torn down when the test finishes. */
export function render(node: ReactElement): Rendered {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(node);
  });

  onTestFinished(() => {
    act(() => root.unmount());
    container.remove();
  });

  return { container, root };
}

/**
 * An element's text with its tooltip triggers removed.
 *
 * Headings and table headers carry an `InfoTip` button, whose glyph lands in
 * `textContent` even though it is `aria-hidden`. A test asserting on a label
 * wants the label, not the affordance next to it.
 */
export function labelText(node: Element): string {
  const copy = node.cloneNode(true) as Element;
  for (const tip of copy.querySelectorAll('.infotip')) {
    tip.remove();
  }
  return (copy.textContent ?? '').trim();
}

/**
 * Sets a form control's value the way a user would.
 *
 * React tracks the last value it wrote to a node, so assigning `value`
 * directly is swallowed as a no-op. Going through the prototype setter
 * bypasses that tracker, which is what makes the change event stick.
 */
export function setValue(
  input: HTMLInputElement | HTMLSelectElement,
  value: string,
): void {
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
