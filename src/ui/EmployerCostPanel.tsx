import type { ComparisonResult } from '../engine/index.ts';
import { formatCad, formatEur, formatPercent } from './format.ts';

export interface EmployerCostPanelProps {
  readonly result: ComparisonResult;
}

/**
 * What the job costs the employer, which is a different question from what the
 * employee receives, and one that partly explains the rest of the comparison.
 */
export function EmployerCostPanel({ result }: EmployerCostPanelProps) {
  const { canadaEmployer: ca, austriaEmployer: at } = result;

  return (
    <details className="employer">
      <summary>
        Cost to the employer
        <span className="badge">
          {formatPercent(at.loadRate)} vs {formatPercent(ca.loadRate)}
        </span>
      </summary>

      <p className="hint">
        What the employer pays on top of salary. This is part of why Austrian salaries
        for equivalent roles sit lower: the same total cost buys less headline pay.
      </p>

      <div className="employer-columns">
        <section>
          <h4>Canada</h4>
          <p className="figure">{formatCad(ca.totalCost)}</p>
          <p className="sub">
            {formatCad(ca.grossSalary)} salary plus{' '}
            {formatCad(ca.employerContributions)}
          </p>
          <dl>
            {ca.components.map((component) => (
              <div key={component.label}>
                <dt>{component.label}</dt>
                <dd>{formatCad(component.amount)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h4>Austria</h4>
          <p className="figure">{formatEur(at.totalCost)}</p>
          <p className="sub">
            {formatEur(at.grossSalary)} salary plus{' '}
            {formatEur(at.employerContributions)}
          </p>
          <dl>
            {at.components.map((component) => (
              <div key={component.label}>
                <dt>{component.label}</dt>
                <dd>{formatEur(component.amount)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <p className="note">
        Canada&apos;s employer contributions are all capped and stop rising by roughly
        $85,000 of salary. Austria&apos;s wage levies are uncapped, so they keep
        accruing on every euro. Provincial employer health taxes are not modelled: they
        depend on an employer&apos;s total payroll rather than on one salary.
      </p>
    </details>
  );
}
