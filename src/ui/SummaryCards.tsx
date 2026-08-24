import type { ComparisonResult } from '../engine/index.ts';
import type { EquivalenceResult } from '../engine/index.ts';
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
          <h3>Canada net</h3>
          <p className="figure">{formatCad(result.canada.netIncome)}</p>
          <p className="sub">
            on {formatCad(result.grossIncomeCad)} gross,{' '}
            {formatPercent(result.canadaEffectiveRate)} deducted
          </p>
        </article>

        <article className="card">
          <h3>Austria net</h3>
          <p className="figure">{formatEur(result.austria.netIncome)}</p>
          <p className="sub">
            on {formatEur(result.grossIncomeEur)} gross,{' '}
            {formatPercent(result.austriaEffectiveRate)} deducted
          </p>
        </article>

        <article className="card">
          <h3>Austria net, in CAD</h3>
          <p className="figure">{formatCad(result.austriaNetCommon)}</p>
          <p className="sub">converted at {result.rate.toFixed(4)} CAD per EUR</p>
        </article>

        <article
          className={`card card--ratio ${result.ratio >= 1 ? 'card--austria' : 'card--canada'}`}
        >
          <h3>Ratio, Austria over Canada</h3>
          <p className="figure">{formatRatio(result.ratio)}</p>
          <p className="sub">{describeRatio(result.ratio)}</p>
        </article>
      </section>

      <section className="equivalence" aria-label="Equivalent Austrian salary">
        <h3>What Austrian salary would match this?</h3>
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
