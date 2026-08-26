import { useMemo } from 'react';
import {
  explainComparison,
  type ComparisonParameters,
  type ComparisonResult,
} from '../engine/index.ts';
import { InfoTip } from './InfoTip.tsx';
import { formatCad } from './format.ts';

export interface AuditViewProps {
  readonly result: ComparisonResult;
  readonly parameters: ComparisonParameters;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function AuditView({ result, parameters }: AuditViewProps) {
  const sections = useMemo(
    () => explainComparison(result, parameters),
    [result, parameters],
  );

  const referenceNote =
    result.basis === 'ppp' && result.referenceYear !== null
      ? `The PPP factors describe ${result.referenceYear}, while the tax parameters are for 2026. PPP series are published with a lag.`
      : null;

  return (
    <details className="audit">
      <summary>Show the working for {formatCad(result.grossIncomeCad)}</summary>

      <p className="hint">
        Every figure on this page, with the formula, the inputs, and a link to the
        source of each parameter. You should be able to reconstruct any headline number
        by hand from this. <InfoTip term="working" />
      </p>
      {referenceNote ? <p className="note">{referenceNote}</p> : null}

      {sections.map((section) => (
        <section key={section.title} className="audit-section">
          <h4>
            {section.title}
            {section.currency ? (
              <span className="audit-currency"> ({section.currency})</span>
            ) : null}
          </h4>
          <dl>
            {section.entries.map((entry) => (
              <div className="audit-entry" key={`${section.title}-${entry.label}`}>
                <dt>{entry.label}</dt>
                <dd>
                  <code>{entry.formula}</code>
                  {entry.sources.length > 0 ? (
                    <ul className="audit-sources">
                      {[...new Set(entry.sources.map((source) => source.source))].map(
                        (url) => (
                          <li key={url}>
                            <a href={url} rel="noreferrer noopener" target="_blank">
                              {hostOf(url)}
                            </a>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </details>
  );
}
