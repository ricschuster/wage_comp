import { useEffect, useId, useRef, useState } from 'react';
import { GLOSSARY, type GlossaryKey } from './glossary.ts';

export interface InfoTipProps {
  readonly term: GlossaryKey;
  /**
   * Which edge the panel hangs from. Use `end` for anything near the right of
   * its container, such as the last columns of the results table.
   */
  readonly align?: 'start' | 'end';
}

/**
 * A click-to-open explanation of one glossary term.
 *
 * Click rather than hover, deliberately. A hover tooltip is unreachable by
 * touch and awkward by keyboard, and these explanations are load-bearing rather
 * than decorative: a reader who cannot open them cannot understand the number.
 *
 * This is a disclosure rather than an ARIA tooltip. It is toggled, it holds a
 * heading and more than a few words, and it stays open while it is read, all of
 * which are disclosure behaviours. `aria-expanded` and `aria-controls` describe
 * that honestly, where `role="tooltip"` would not.
 */
export function InfoTip({ term, align = 'start' }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLSpanElement>(null);
  const entry = GLOSSARY[term];
  // Per instance, not per term: the same term is explained in more than one
  // place, and two triggers pointing `aria-controls` at one id would be a lie.
  const panelId = `infotip-${term}-${useId()}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
        // Focus goes back to the trigger, so Escape does not strand the reader
        // at the top of the document.
        wrapper.current?.querySelector('button')?.focus();
      }
    };

    // pointerdown rather than click: it fires before focus moves, so opening a
    // second tip closes this one without a flash of both being open.
    const onPointerDown = (event: PointerEvent): void => {
      if (!wrapper.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <span className="infotip" ref={wrapper}>
      <button
        type="button"
        className="infotip__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={open ? panelId : undefined}
        aria-label={`What is ${entry.term}?`}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">?</span>
      </button>
      {open ? (
        <span
          className={
            align === 'end' ? 'infotip__panel infotip__panel--end' : 'infotip__panel'
          }
          id={panelId}
        >
          <strong className="infotip__term">{entry.term}</strong>
          <span className="infotip__tip">{entry.tip}</span>
          {entry.section ? (
            <span className="infotip__section">
              More in the methodology, under {entry.section}.
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
