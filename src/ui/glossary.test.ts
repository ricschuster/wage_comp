import { describe, expect, it } from 'vitest';
import { GLOSSARY, GLOSSARY_KEYS } from './glossary.ts';

/*
 * Sources come through `import.meta.glob` rather than `node:fs`, so this suite
 * needs no Node type definitions and no new dependency. Eager and raw, so the
 * files arrive as plain strings at module load.
 */
const SOURCES: Record<string, string> = import.meta.glob('./*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Component source only: the tests reference keys too, which proves nothing. */
function componentSources(): { file: string; text: string }[] {
  return Object.entries(SOURCES)
    .filter(([path]) => !path.endsWith('.test.tsx'))
    .map(([path, text]) => ({ file: path.replace('./', ''), text }));
}

/** Every `term="x"` and `tip="x"` prop across the components. */
function referencedKeys(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const { file, text } of componentSources()) {
    for (const match of text.matchAll(/\b(?:term|tip)="([a-zA-Z]+)"/g)) {
      const key = match[1] as string;
      found.set(key, [...(found.get(key) ?? []), file]);
    }
  }
  return found;
}

describe('glossary', () => {
  it('explains every term it claims to', () => {
    for (const key of GLOSSARY_KEYS) {
      const entry = GLOSSARY[key];
      expect(entry.term.length, `${key} needs a term`).toBeGreaterThan(0);
      expect(entry.tip.length, `${key} needs a tip`).toBeGreaterThan(20);
    }
  });

  // The tips are the shortest form of the documentation, and the house style
  // rule against em dashes applies to user-facing text.
  it('uses no em dashes', () => {
    for (const key of GLOSSARY_KEYS) {
      expect(GLOSSARY[key].tip, `${key} has an em dash`).not.toMatch(/[—–]/);
      expect(GLOSSARY[key].term, `${key} has an em dash`).not.toMatch(/[—–]/);
    }
  });

  // Two sentences at most. A tip that grows past that belongs on the
  // methodology page, which is where `section` points.
  it('keeps tips short enough to read in a popover', () => {
    for (const key of GLOSSARY_KEYS) {
      expect(GLOSSARY[key].tip.length, `${key} is too long for a tip`).toBeLessThan(
        360,
      );
    }
  });

  it('has no entry that nothing on screen uses', () => {
    const used = referencedKeys();
    const orphans = GLOSSARY_KEYS.filter((key) => !used.has(key));
    expect(orphans, 'glossary entries no component references').toEqual([]);
  });

  it('has no component referencing a term it does not define', () => {
    const defined = new Set<string>(GLOSSARY_KEYS);
    const unknown = [...referencedKeys().entries()]
      .filter(([key]) => !defined.has(key))
      .map(([key, files]) => `${key} in ${files.join(', ')}`);
    expect(unknown, 'referenced terms missing from the glossary').toEqual([]);
  });

  it('points only at methodology sections that exist', () => {
    // Guards the promise the tip makes: "more in the methodology, under X".
    const methodology = SOURCES['./Methodology.tsx'] ?? '';
    expect(methodology, 'methodology source not loaded').not.toBe('');
    const missing = GLOSSARY_KEYS.filter((key) => {
      const { section } = GLOSSARY[key];
      return section !== undefined && !methodology.includes(`>${section}<`);
    });
    expect(missing, 'sections named by a tip but absent from the page').toEqual([]);
  });
});
