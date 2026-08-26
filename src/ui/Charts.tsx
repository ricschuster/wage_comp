import type { ComparisonResult } from '../engine/index.ts';
import { LineChart, type Series } from './LineChart.tsx';
import { formatPercent, formatRatio } from './format.ts';

export interface ChartsProps {
  readonly rows: readonly ComparisonResult[];
}

/** Compact axis label: 40k rather than $40,000. */
function shortMoney(value: number): string {
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return String(Math.round(value));
}

/** Canada is drawn solid, Austria dashed, so colour is never the only cue. */
const CANADA_DASH = '';
const AUSTRIA_DASH = '6 4';

export function Charts({ rows }: ChartsProps) {
  if (rows.length < 2) {
    return (
      <p className="hint">
        Widen the income range to at least two steps to draw the charts.
      </p>
    );
  }

  const basisLabel =
    rows[0]?.basis === 'fx'
      ? 'market exchange rate'
      : `${rows[0]?.pppBasis === 'gdp' ? 'GDP' : 'household consumption'} PPP`;

  const netSeries: Series[] = [
    {
      label: 'Canada',
      colour: 'var(--canada)',
      dash: CANADA_DASH,
      points: rows.map((row) => ({ x: row.grossIncomeCad, y: row.canada.netIncome })),
    },
    {
      label: 'Austria',
      colour: 'var(--austria)',
      dash: AUSTRIA_DASH,
      points: rows.map((row) => ({ x: row.grossIncomeCad, y: row.austriaNetCommon })),
    },
  ];

  const rateSeries: Series[] = [
    {
      label: 'Canada',
      colour: 'var(--canada)',
      dash: CANADA_DASH,
      points: rows.map((row) => ({
        x: row.grossIncomeCad,
        y: row.canadaEffectiveRate,
      })),
    },
    {
      label: 'Austria',
      colour: 'var(--austria)',
      dash: AUSTRIA_DASH,
      points: rows.map((row) => ({
        x: row.grossIncomeCad,
        y: row.austriaEffectiveRate,
      })),
    },
  ];

  const ratioSeries: Series[] = [
    {
      label: 'Austria divided by Canada',
      colour: 'var(--accent)',
      dash: CANADA_DASH,
      points: rows.map((row) => ({ x: row.grossIncomeCad, y: row.ratio })),
    },
  ];

  return (
    <section className="charts" aria-label="Charts">
      <h2>Charts</h2>

      <LineChart
        title="Take-home income"
        description={`Net income after tax and contributions, both in Canadian dollars on ${basisLabel}. Canada solid, Austria dashed.`}
        series={netSeries}
        formatX={shortMoney}
        formatY={shortMoney}
        includeZero
        tip="austriaNetCommon"
      />

      <LineChart
        title="Effective deduction rate"
        description="Tax and contributions as a share of gross income. Canada solid, Austria dashed."
        series={rateSeries}
        formatX={shortMoney}
        formatY={formatPercent}
        includeZero
        tip="effectiveRate"
      />

      <LineChart
        title="Austria divided by Canada"
        description="Above the 1.0 line the Austrian position is ahead; below it the Canadian position is ahead."
        series={ratioSeries}
        formatX={shortMoney}
        formatY={formatRatio}
        referenceLine={{ y: 1, label: 'Equivalent (1.0)' }}
        tip="ratio"
      />
    </section>
  );
}
