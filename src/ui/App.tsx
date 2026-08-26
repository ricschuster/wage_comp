import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { canadaParametersFor } from '../data/canada.ts';
import { applyAssumptions, type AssumptionOverrides } from '../data/assumptions.ts';
import { getScenario } from '../data/scenarios.ts';
import { parametersForYear } from '../data/years.ts';
import { AssumptionsPanel } from './AssumptionsPanel.tsx';
import { AuditView } from './AuditView.tsx';
import { Charts } from './Charts.tsx';
import { Controls, type DashboardInputs } from './Controls.tsx';
import { EmployerCostPanel } from './EmployerCostPanel.tsx';
import { Methodology } from './Methodology.tsx';
import { ResultsTable } from './ResultsTable.tsx';
import { SummaryCards } from './SummaryCards.tsx';
import { decodeShareState, encodeShareState, shareUrl } from './share-state.ts';

type View = 'dashboard' | 'methodology';

/** Reads the opening URL once, so a shared link lands on its own scenario. */
function initialState(): { inputs: DashboardInputs; overrides: AssumptionOverrides } {
  if (typeof window === 'undefined') {
    return decodeShareState('');
  }
  return decodeShareState(window.location.search);
}

export function App() {
  // Lazy initialiser: the opening URL is read exactly once, on mount.
  const [initial] = useState(initialState);
  const [inputs, setInputs] = useState<DashboardInputs>(initial.inputs);
  const [overrides, setOverrides] = useState<AssumptionOverrides>(initial.overrides);
  const [view, setView] = useState<View>('dashboard');
  const [copied, setCopied] = useState(false);

  // Keep the address bar in step, so a copied URL always matches the screen.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const query = encodeShareState({ inputs, overrides });
    const next = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
    window.history.replaceState(null, '', next);
  }, [inputs, overrides]);

  const link = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return shareUrl({ inputs, overrides }, window.location);
  }, [inputs, overrides]);

  const copy = useCallback(() => {
    setCopied(true);
    void navigator.clipboard?.writeText(link).catch(() => {
      // Clipboard access can be refused; the field is selectable either way.
    });
  }, [link]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), 2_000);
    return () => clearTimeout(timer);
  }, [copied]);

  const applyScenario = useCallback((id: string) => {
    const scenario = getScenario(id);
    if (!scenario) {
      return;
    }
    setInputs((current) => ({
      ...current,
      province: scenario.province,
      basis: scenario.basis,
      pppBasis: scenario.pppBasis,
      specialPayments: scenario.specialPayments,
    }));
  }, []);

  const parameters = useMemo<ComparisonParameters>(() => {
    const year = parametersForYear(inputs.taxYear);
    return {
      // Assembled by province, so Quebec always gets QPP and QPIP rather than
      // CPP, and nowhere else ever does.
      canada: canadaParametersFor(inputs.province, inputs.taxYear),
      austria: year.austria,
      // Overrides apply on top of the chosen year's sourced factors, so
      // switching year moves the defaults without discarding a deliberate
      // change the reader made.
      conversion: applyAssumptions(overrides, year.conversion),
    };
  }, [inputs.province, inputs.taxYear, overrides]);

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
          After-tax purchasing power, not nominal salary. Tax year {inputs.taxYear},
          single taxpayer, no dependants, employment income only.
        </p>
        <nav className="views" aria-label="Views">
          <button
            type="button"
            aria-current={view === 'dashboard' ? 'page' : undefined}
            className={view === 'dashboard' ? 'view-tab view-tab--active' : 'view-tab'}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            aria-current={view === 'methodology' ? 'page' : undefined}
            className={
              view === 'methodology' ? 'view-tab view-tab--active' : 'view-tab'
            }
            onClick={() => setView('methodology')}
          >
            Methodology
          </button>
        </nav>
      </header>

      {view === 'methodology' ? (
        <Methodology taxYear={inputs.taxYear} />
      ) : (
        <>
          <Controls inputs={inputs} onChange={setInputs} rangeError={range.error} />

          <AssumptionsPanel
            overrides={overrides}
            onChange={setOverrides}
            onScenario={applyScenario}
            shareLink={link}
            onCopy={copy}
            copied={copied}
            taxYear={inputs.taxYear}
          />

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

          {highlight ? <EmployerCostPanel result={highlight} /> : null}

          {highlight ? <AuditView result={highlight} parameters={parameters} /> : null}

          <Charts rows={range.rows} />

          <ResultsTable rows={range.rows} highlightIncome={inputs.highlightIncome} />
        </>
      )}

      <footer>
        <p>
          Not tax advice. Read the{' '}
          <button type="button" className="link" onClick={() => setView('methodology')}>
            methodology
          </button>{' '}
          for what is and is not modelled, and what the ratio does not tell you. Expand
          the working to see every formula and its sources. Code and parameters are in
          the <a href="https://github.com/ricschuster/wage_comp">repository</a>.
        </p>
      </footer>
    </main>
  );
}
