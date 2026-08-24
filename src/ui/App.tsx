import { useMemo, useState } from 'react';
import {
  EquivalenceError,
  compare,
  compareRange,
  solveEquivalentAustrianGross,
  type ComparisonOptions,
  type ComparisonParameters,
  type ComparisonResult,
  type EquivalenceResult,
} from '../engine/index.ts';
import { AUSTRIA_2026 } from '../data/austria-2026.ts';
import { CANADA_FEDERAL_2026 } from '../data/canada-federal-2026.ts';
import { CANADA_PAYROLL_2026 } from '../data/canada-payroll-2026.ts';
import { CONVERSION_2026 } from '../data/conversion-2026.ts';
import { getProvince } from '../data/provinces/index.ts';
import { Controls, type DashboardInputs } from './Controls.tsx';
import { ResultsTable } from './ResultsTable.tsx';
import { SummaryCards } from './SummaryCards.tsx';

const DEFAULT_INPUTS: DashboardInputs = {
  province: 'BC',
  basis: 'ppp',
  pppBasis: 'household',
  specialPayments: true,
  highlightIncome: 100_000,
  rangeStart: 40_000,
  rangeEnd: 300_000,
  rangeIncrement: 20_000,
};

export function App() {
  const [inputs, setInputs] = useState<DashboardInputs>(DEFAULT_INPUTS);

  const parameters = useMemo<ComparisonParameters>(
    () => ({
      canada: {
        federal: CANADA_FEDERAL_2026,
        payroll: CANADA_PAYROLL_2026,
        province: getProvince(inputs.province),
      },
      austria: AUSTRIA_2026,
      conversion: CONVERSION_2026,
    }),
    [inputs.province],
  );

  const options = useMemo<ComparisonOptions>(
    () => ({
      basis: inputs.basis,
      pppBasis: inputs.pppBasis,
      specialPayments: inputs.specialPayments,
    }),
    [inputs.basis, inputs.pppBasis, inputs.specialPayments],
  );

  const highlight = useMemo<ComparisonResult | null>(() => {
    if (!Number.isFinite(inputs.highlightIncome) || inputs.highlightIncome <= 0) {
      return null;
    }
    return compare(inputs.highlightIncome, parameters, options);
  }, [inputs.highlightIncome, parameters, options]);

  const equivalence = useMemo<{
    result: EquivalenceResult | null;
    error: string | null;
  }>(() => {
    if (!highlight) {
      return { result: null, error: 'Enter an income above zero.' };
    }
    try {
      return {
        result: solveEquivalentAustrianGross(
          inputs.highlightIncome,
          parameters,
          options,
        ),
        error: null,
      };
    } catch (caught) {
      return {
        result: null,
        error:
          caught instanceof EquivalenceError
            ? caught.message
            : 'No equivalent salary could be found.',
      };
    }
  }, [highlight, inputs.highlightIncome, parameters, options]);

  const range = useMemo<{ rows: ComparisonResult[]; error: string | null }>(() => {
    try {
      return {
        rows: compareRange(
          inputs.rangeStart,
          inputs.rangeEnd,
          inputs.rangeIncrement,
          parameters,
          options,
        ),
        error: null,
      };
    } catch (caught) {
      return {
        rows: [],
        error: caught instanceof RangeError ? caught.message : 'Invalid income range.',
      };
    }
  }, [inputs.rangeStart, inputs.rangeEnd, inputs.rangeIncrement, parameters, options]);

  return (
    <main className="app">
      <header>
        <h1>Canada / Austria Wage Comparison</h1>
        <p className="lede">
          After-tax purchasing power, not nominal salary. Tax year 2026, single
          taxpayer, no dependants, employment income only.
        </p>
      </header>

      <Controls inputs={inputs} onChange={setInputs} rangeError={range.error} />

      {highlight ? (
        <SummaryCards
          result={highlight}
          equivalence={equivalence.result}
          equivalenceError={equivalence.error}
        />
      ) : (
        <p className="error" role="alert">
          Enter a highlighted income above zero to see results.
        </p>
      )}

      <ResultsTable rows={range.rows} highlightIncome={inputs.highlightIncome} />

      <footer>
        <p>
          Not tax advice. Every parameter is sourced and cited in the{' '}
          <a href="https://github.com/ricschuster/wage_comp">repository</a>. Charts, the
          audit view and the methodology page are still to come.
        </p>
      </footer>
    </main>
  );
}
