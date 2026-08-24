/**
 * Placeholder shell.
 *
 * The dashboard lands in M3. Until the engine slices in M1 are verified there
 * is nothing honest to display, so this states the status rather than showing
 * numbers that are not yet checked against an official calculator.
 */
export function App() {
  return (
    <main className="app">
      <h1>Canada / Austria Wage Comparison</h1>
      <p className="lede">
        Comparing after-tax purchasing power, not nominal salary, across a range of
        gross incomes.
      </p>

      <section className="notice">
        <h2>Under construction</h2>
        <p>
          The tax engine is being built one jurisdiction at a time, each verified
          against an official calculator before it ships. Nothing is displayed yet
          because nothing has been verified yet.
        </p>
        <ul>
          <li>Canada: federal, payroll (CPP, CPP2, EI), British Columbia</li>
          <li>Austria: regular salary, then special payments</li>
        </ul>
        <p>
          Progress is tracked in the{' '}
          <a href="https://github.com/ricschuster/wage_comp/issues">
            repository issues
          </a>
          .
        </p>
      </section>
    </main>
  );
}
