import type { ComparisonResult } from '../engine/index.ts';
import type { EquivalenceResult } from '../engine/index.ts';
import { InfoTip } from './InfoTip.tsx';
import {
  describeRatio,
  formatCad,
  formatEur,
  formatPercent,
  formatRatio,
} from './format.ts';

export interface SummaryCardsProps {
  readonly result: ComparisonResult;
  /** Null when the solve failed, with the reason in `equivalenceError`. */
  readonly equivalence: EquivalenceResult | null;
  readonly equivalenceError: string | null;
}

export function SummaryCards({
  result,
  equivalence,
  equivalenceError,
}: SummaryCardsProps) {
  const basisLabel =
    result.basis === 'fx'
      ? 'market exchange rate'
      : `${result.pppBasis === 'gdp' ? 'GDP' : 'household consumption'} PPP, ${result.referenceYear}`;

  return (
    <>
      <section className="cards" aria-label="Headline results">
        <article className="card">
          <h3>
            Canada net <InfoTip term="canadaNet" />
          </h3>
          <p className="figure">{formatCad(result.canada.netIncome)}</p>
          <p className="sub">
            on {formatCad(result.grossIncomeCad)} gross,{' '}
            {formatPercent(result.canadaEffectiveRate)} deducted{' '}
            <InfoTip term="effectiveRate" />
          </p>
        </article>

        <article className="card">
          <h3>
            Austria net <InfoTip term="austriaNet" />
          </h3>
          <p className="figure">{formatEur(result.austria.netIncome)}</p>
          <p className="sub">
            on {formatEur(result.grossIncomeEur)} gross,{' '}
            {formatPercent(result.austriaEffectiveRate)} deducted{' '}
            <InfoTip term="grossIncome" />
          </p>
        </article>

        <article className="card">
          <h3>
            Austria net, in CAD <InfoTip term="austriaNetCommon" />
          </h3>
          <p className="figure">{formatCad(result.austriaNetCommon)}</p>
          <p className="sub">
            converted at {result.rate.toFixed(4)} CAD per EUR{' '}
            <InfoTip term="conversionRate" />
          </p>
        </article>

        <article
          className={`card card--ratio ${result.ratio >= 1 ? 'card--austria' : 'card--canada'}`}
        >
          <h3>
            Ratio, Austria over Canada <InfoTip term="ratio" align="end" />
          </h3>
          <p className="figure">{formatRatio(result.ratio)}</p>
          <p className="sub">{describeRatio(result.ratio)}</p>
        </article>
      </section>

      <section className="equivalence" aria-label="Equivalent Austrian salary">
        <h3>
          What Austrian salary would match this? <InfoTip term="equivalentSalary" />
        </h3>
        {equivalence ? (
          <p>
            To match a {formatCad(result.grossIncomeCad)} package in Canada, you would
            need <strong>{formatEur(equivalence.austriaGrossEur)}</strong> gross in
            Austria, against {formatEur(result.grossIncomeEur)} if you simply converted
            the salary across.
          </p>
        ) : (
          <p className="error" role="alert">
            {equivalenceError ?? 'No equivalent salary could be found.'}
          </p>
        )}
        <p className="hint">
          Comparing at the same gross assumes a labour market parity that does not
          exist. This inverts the question instead. Compared on {basisLabel}.
        </p>
      </section>
    </>
  );
}
