import { useMemo } from 'react';
import { SOURCE_GROUPS } from '../data/source-groups.ts';
import { collectAllSources } from '../data/sources.ts';

/** Shortens a URL to something readable in a table cell. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function Methodology() {
  const sources = useMemo(() => collectAllSources(SOURCE_GROUPS), []);

  return (
    <div className="prose">
      <h2>Methodology</h2>
      <p>
        This is not tax advice and not a filing tool. It is a model of two tax systems
        for the 2026 tax year, built to compare after-tax purchasing power rather than
        nominal salary.
      </p>

      <h3>Who is modelled</h3>
      <p>
        A single taxpayer with no dependants, employment income only, and no voluntary
        deductions. No RRSP, no union dues, no medical credits, no commuter allowance,
        no family benefits. Changing that baseline would change the answer, sometimes a
        lot.
      </p>

      <h3>How Canada is modelled</h3>
      <ul>
        <li>
          Federal brackets, the basic personal amount with its phase-out, and the Canada
          Employment Amount
        </li>
        <li>
          Provincial brackets, the provincial basic personal amount, and the BC tax
          reduction
        </li>
        <li>
          CPP, the second additional CPP contribution (CPP2), and EI. In Quebec, QPP and
          QPIP instead, with EI at its reduced Quebec rate
        </li>
        <li>
          For Quebec: the 16.5% federal abatement, and the deduction for workers, which
          replaces the contribution credits the rest of Canada grants
        </li>
        <li>
          The tax treatment of contributions is split rather than lumped: the CPP base
          portion at 4.95% and EI produce non-refundable credits, while the CPP
          enhancement at 1.00% and all of CPP2 are deducted from income before tax is
          computed
        </li>
      </ul>
      <p className="note">
        The lowest federal rate for 2026 is <strong>14%</strong>, not 15%: the 2025 rate
        cut applies in full. That rate also converts credit amounts into tax reductions,
        so it affects every Canadian figure here.
      </p>
      <p className="note">
        CRA&apos;s public tax brackets page shows 5.6% for the first British Columbia
        bracket. That appears to be a typo. The Government of British Columbia and
        CRA&apos;s own T4127 payroll formulas both give <strong>5.06%</strong>, which is
        what this model uses. Every other British Columbia rate agrees across all three
        sources.
      </p>

      <h3>How Austria is modelled</h3>
      <ul>
        <li>
          The 2026 tariff, from a zero rate below 13,539 euro to 55% above one million,
          which is temporary through 2029
        </li>
        <li>
          Annual gross split <strong>6/7 regular and 1/7 special</strong>, which is 12
          and 2 of 14 payments. Special payments are a split of annual gross, never an
          addition to it
        </li>
        <li>
          Special payments taxed under the Jahressechstel bands: the first 620 euro
          free, then 6%, 27% and 35.75%
        </li>
        <li>
          Social insurance as <strong>two separate regimes</strong>. Regular pay is
          charged 18.07% against a monthly ceiling of 6,930 euro; special payments are
          charged 17.07% against a separate annual ceiling of 13,860 euro, because the
          chamber and housing levies are not levied on them
        </li>
        <li>
          The Verkehrsabsetzbetrag and its low-income supplement, the flat employment
          expense allowance, the reduced unemployment contribution at low pay, and the
          SV-Rückerstattung, which is a genuine negative tax
        </li>
      </ul>

      <h3>What is not modelled</h3>
      <ul>
        <li>
          Employer-side costs on either side. Austria&apos;s employer load is far
          heavier, which is part of why Austrian nominal salaries sit lower
        </li>
        <li>
          Austria: family benefits, commuter allowance (Pendlerpauschale), collective
          agreement specifics, mid-year job changes and other advanced Jahressechstel
          cases
        </li>
        <li>
          Canada: RRSP, union dues, medical credits, dependants and spousal transfers,
          self-employment
        </li>
        <li>
          Vienna raised its housing levy to 1.5% from 2026, so a Vienna employee pays
          0.75% rather than the national 0.50%, making 18.32% rather than 18.07%. The
          model uses the national rate
        </li>
        <li>
          Nothing province-specific is missing: all thirteen jurisdictions are modelled,
          Quebec included
        </li>
      </ul>

      <h3>How the conversion works</h3>
      <p>
        The input is a gross income in Canadian dollars. The Austrian gross is that
        amount converted at the chosen rate, so both sides start from the same real
        compensation rather than the same nominal number in two currencies. Each
        country&apos;s net is then computed under its own rules, and both are expressed
        in Canadian dollars.
      </p>
      <p>
        Every basis reduces to a single rate in Canadian dollars per euro.{' '}
        <strong>Purchasing power (PPP)</strong> uses the ratio of the two
        countries&apos; conversion factors. Household consumption PPP is the default
        because GDP PPP includes government spending and capital formation, which is the
        wrong basket for what a person can buy. The PPP reference year is{' '}
        <strong>2025</strong> while the tax year is 2026, because PPP series are
        published with a lag.
      </p>
      <p className="note">
        Because the same rate converts the gross in and the net back out, the choice of
        basis largely cancels and survives only through the non-linearity of the two tax
        systems. In practice{' '}
        <strong>
          switching between market exchange rates and PPP barely moves the ratio
        </strong>
        . What drives the answer is the tax systems, not the conversion basis. This is a
        property of comparing at the same real gross, not a defect in the data.
      </p>

      <h3>How to read the ratio</h3>
      <p>
        The ratio is the Austrian net divided by the Canadian net, both in Canadian
        dollars. Above 1.0 the Austrian position is ahead; below 1.0 the Canadian
        position is ahead.
      </p>

      <h3>What the ratio does not tell you</h3>
      <ol>
        <li>
          <strong>Nobody is offered the same gross in both countries.</strong> Comparing
          at identical gross assumes a labour market parity that does not exist, and
          Austrian nominal salaries for equivalent roles are typically lower. The
          equivalent-salary panel inverts the question, and is the more useful number.
        </li>
        <li>
          <strong>PPP does not correct for what deductions buy.</strong> Austrian social
          insurance purchases healthcare and a substantial defined-benefit pension
          entitlement. Treating both countries&apos; deductions as pure loss
          systematically understates Austria.
        </li>
        <li>
          <strong>Housing is the largest uncorrected term.</strong> For a Vancouver
          against Vienna comparison, housing cost dominates real purchasing power, and
          national PPP mutes sub-national price variation badly. Vienna&apos;s regulated
          and social housing sector is a structural outlier a national index cannot
          capture.
        </li>
        <li>
          <strong>Childcare, tuition and transit differ structurally</strong>, and PPP
          does not fix them either.
        </li>
      </ol>

      <h3>Sources</h3>
      <p>
        Every parameter below is read from an authoritative source and carries the date
        it was read. This list is generated from the parameters themselves, so it cannot
        drift out of step with what the model actually uses.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Parameter</th>
              <th scope="col">Value</th>
              <th scope="col">Source</th>
              <th scope="col">Retrieved</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(({ path, entry }) => (
              <tr key={path}>
                <th scope="row">{path}</th>
                <td>
                  {Array.isArray(entry.value)
                    ? `${entry.value.length} bands`
                    : String(entry.value)}
                </td>
                <td>
                  <a href={entry.source} rel="noreferrer noopener" target="_blank">
                    {hostOf(entry.source)}
                  </a>
                </td>
                <td>{entry.retrieved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        {sources.length} sourced parameters. Corrections are welcome as issues, and are
        most useful with a source link.
      </p>
    </div>
  );
}
