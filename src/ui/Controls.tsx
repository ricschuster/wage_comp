import type { ComparisonBasis, PppBasis } from '../data/types.ts';
import { SUPPORTED_PROVINCES, getProvince } from '../data/provinces/index.ts';
import type { ProvinceCode } from '../data/provinces/index.ts';

export interface DashboardInputs {
  readonly province: ProvinceCode;
  readonly basis: ComparisonBasis;
  readonly pppBasis: PppBasis;
  readonly specialPayments: boolean;
  readonly highlightIncome: number;
  readonly rangeStart: number;
  readonly rangeEnd: number;
  readonly rangeIncrement: number;
}

export interface ControlsProps {
  readonly inputs: DashboardInputs;
  readonly onChange: (next: DashboardInputs) => void;
  /** Message explaining why the current range is unusable, if it is. */
  readonly rangeError: string | null;
}

export function Controls({ inputs, onChange, rangeError }: ControlsProps) {
  const set = <K extends keyof DashboardInputs>(
    key: K,
    value: DashboardInputs[K],
  ): void => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <section className="controls" aria-label="Comparison settings">
      <div className="control-group">
        <label htmlFor="province">Province</label>
        <select
          id="province"
          value={inputs.province}
          onChange={(event) => set('province', event.target.value as ProvinceCode)}
        >
          {SUPPORTED_PROVINCES.map((code) => (
            <option key={code} value={code}>
              {getProvince(code).name}
            </option>
          ))}
        </select>
        <p className="hint">
          All thirteen jurisdictions. Quebec is modelled properly, with QPP, QPIP, the
          federal abatement and the deduction for workers.
        </p>
      </div>

      <div className="control-group">
        <label htmlFor="basis">Compare on</label>
        <select
          id="basis"
          value={inputs.basis}
          onChange={(event) => set('basis', event.target.value as ComparisonBasis)}
        >
          <option value="ppp">Purchasing power (PPP)</option>
          <option value="fx">Market exchange rate</option>
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="pppBasis">PPP basis</label>
        <select
          id="pppBasis"
          value={inputs.pppBasis}
          disabled={inputs.basis !== 'ppp'}
          onChange={(event) => set('pppBasis', event.target.value as PppBasis)}
        >
          <option value="household">Household consumption</option>
          <option value="gdp">GDP</option>
        </select>
        <p className="hint">
          Household consumption is the consumer basket, and the better fit here.
        </p>
      </div>

      <div className="control-group control-group--check">
        <label htmlFor="specialPayments">
          <input
            id="specialPayments"
            type="checkbox"
            checked={inputs.specialPayments}
            onChange={(event) => set('specialPayments', event.target.checked)}
          />
          Austrian 13th and 14th salaries
        </label>
        <p className="hint">
          On is the Austrian norm. Off shows what the regime is worth.
        </p>
      </div>

      <div className="control-group">
        <label htmlFor="highlightIncome">Highlighted income (CAD)</label>
        <input
          id="highlightIncome"
          type="number"
          min={0}
          step={1000}
          value={inputs.highlightIncome}
          onChange={(event) => set('highlightIncome', Number(event.target.value))}
        />
      </div>

      <fieldset className="control-group control-group--range">
        <legend>Income range (CAD)</legend>
        <div className="range-inputs">
          <label htmlFor="rangeStart">
            Start
            <input
              id="rangeStart"
              type="number"
              min={0}
              step={1000}
              value={inputs.rangeStart}
              onChange={(event) => set('rangeStart', Number(event.target.value))}
            />
          </label>
          <label htmlFor="rangeEnd">
            End
            <input
              id="rangeEnd"
              type="number"
              min={0}
              step={1000}
              value={inputs.rangeEnd}
              onChange={(event) => set('rangeEnd', Number(event.target.value))}
            />
          </label>
          <label htmlFor="rangeIncrement">
            Step
            <input
              id="rangeIncrement"
              type="number"
              min={1}
              step={1000}
              value={inputs.rangeIncrement}
              onChange={(event) => set('rangeIncrement', Number(event.target.value))}
            />
          </label>
        </div>
        {rangeError ? (
          <p className="error" role="alert">
            {rangeError}
          </p>
        ) : null}
      </fieldset>
    </section>
  );
}
