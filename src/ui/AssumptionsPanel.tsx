import {
  ASSUMPTIONS,
  isWithinGuardrails,
  modifiedKeys,
  type AssumptionKey,
  type AssumptionOverrides,
} from '../data/assumptions.ts';
import { SCENARIOS } from '../data/scenarios.ts';

export interface AssumptionsPanelProps {
  readonly overrides: AssumptionOverrides;
  readonly onChange: (next: AssumptionOverrides) => void;
  readonly onScenario: (id: string) => void;
  readonly shareLink: string;
  readonly onCopy: () => void;
  readonly copied: boolean;
}

export function AssumptionsPanel({
  overrides,
  onChange,
  onScenario,
  shareLink,
  onCopy,
  copied,
}: AssumptionsPanelProps) {
  const modified = new Set<AssumptionKey>(modifiedKeys(overrides));

  const setValue = (key: AssumptionKey, raw: string): void => {
    const value = Number(raw);
    if (raw === '' || !isWithinGuardrails(key, value)) {
      // Out of range: drop the override rather than storing a value the engine
      // would have to defend against.
      const next = { ...overrides };
      delete next[key];
      onChange(next);
      return;
    }
    onChange({ ...overrides, [key]: value });
  };

  const resetOne = (key: AssumptionKey): void => {
    const next = { ...overrides };
    delete next[key];
    onChange(next);
  };

  return (
    <details className="assumptions">
      <summary>
        Scenarios, assumptions and sharing
        {modified.size > 0 ? (
          <span className="badge">{modified.size} modified</span>
        ) : null}
      </summary>

      <section className="assumptions-block">
        <h4>Scenarios</h4>
        <div className="scenario-buttons">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className="scenario"
              title={scenario.description}
              onClick={() => onScenario(scenario.id)}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </section>

      <section className="assumptions-block">
        <h4>Assumptions</h4>
        <p className="hint">
          Only the conversion factors are adjustable. Tax parameters are law, not
          assumptions, so they are not editable here.
        </p>
        <dl className="assumption-list">
          {ASSUMPTIONS.map((spec) => {
            const current = overrides[spec.key] ?? spec.defaultValue;
            const isModified = modified.has(spec.key);
            return (
              <div className="assumption" key={spec.key}>
                <dt>
                  <label htmlFor={`assumption-${spec.key}`}>{spec.label}</label>
                  {isModified ? <span className="badge">modified</span> : null}
                </dt>
                <dd>
                  <input
                    id={`assumption-${spec.key}`}
                    type="number"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={current}
                    onChange={(event) => setValue(spec.key, event.target.value)}
                  />
                  {isModified ? (
                    <button
                      type="button"
                      className="link"
                      onClick={() => resetOne(spec.key)}
                    >
                      reset to {spec.defaultValue}
                    </button>
                  ) : null}
                  <p className="hint">{spec.help}</p>
                </dd>
              </div>
            );
          })}
        </dl>
        <button
          type="button"
          className="reset-all"
          disabled={modified.size === 0}
          onClick={() => onChange({})}
        >
          Reset all assumptions
        </button>
      </section>

      <section className="assumptions-block">
        <h4>Share this scenario</h4>
        <p className="hint">
          The link reproduces exactly what is on screen, including any modified
          assumptions.
        </p>
        <div className="share-row">
          <input readOnly value={shareLink} aria-label="Shareable link" />
          <button type="button" onClick={onCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>
    </details>
  );
}
