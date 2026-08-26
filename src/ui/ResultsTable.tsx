import type { ComparisonResult } from '../engine/index.ts';
import { InfoTip } from './InfoTip.tsx';
import { formatCad, formatEur, formatPercent, formatRatio } from './format.ts';

export interface ResultsTableProps {
  readonly rows: readonly ComparisonResult[];
  /** Income to mark, so the highlighted row is findable in a long table. */
  readonly highlightIncome: number;
}

export function ResultsTable({ rows, highlightIncome }: ResultsTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section aria-label="Results by income">
      <h2>Results across the range</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">
                Gross (CAD) <InfoTip term="grossIncome" />
              </th>
              <th scope="col">
                Gross (EUR) <InfoTip term="conversionRate" />
              </th>
              <th scope="col">
                Canada net <InfoTip term="canadaNet" />
              </th>
              <th scope="col">
                Austria net <InfoTip term="austriaNet" />
              </th>
              <th scope="col">
                Austria net (CAD) <InfoTip term="austriaNetCommon" align="end" />
              </th>
              <th scope="col">
                CA rate <InfoTip term="effectiveRate" align="end" />
              </th>
              <th scope="col">
                AT rate <InfoTip term="effectiveRate" align="end" />
              </th>
              <th scope="col">
                Ratio <InfoTip term="ratio" align="end" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.grossIncomeCad}
                className={
                  row.grossIncomeCad === highlightIncome ? 'row--highlight' : undefined
                }
              >
                <th scope="row">{formatCad(row.grossIncomeCad)}</th>
                <td>{formatEur(row.grossIncomeEur)}</td>
                <td>{formatCad(row.canada.netIncome)}</td>
                <td>{formatEur(row.austria.netIncome)}</td>
                <td>{formatCad(row.austriaNetCommon)}</td>
                <td>{formatPercent(row.canadaEffectiveRate)}</td>
                <td>{formatPercent(row.austriaEffectiveRate)}</td>
                <td className={row.ratio >= 1 ? 'ratio--austria' : 'ratio--canada'}>
                  {formatRatio(row.ratio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
