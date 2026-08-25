/**
 * Employer-side cost: what a job costs the employer, not what lands in the
 * employee's account.
 *
 * This answers a different question from the rest of the model, and one that
 * partly explains the rest: Austrian employers carry a far heavier load than
 * Canadian ones, which is part of why Austrian nominal salaries sit lower for
 * equivalent roles. Comparing gross salaries without it flatters Canada.
 *
 * The structural difference to watch: Canadian employer contributions are all
 * capped and plateau by roughly 85,000 of salary. Austria's wage levies are
 * **uncapped** and keep accruing on every euro, so the gap widens with income.
 */

import { capAt, clampToZero, roundToCents } from './money.ts';
import { cpp2Contribution, cppContribution } from './canada-payroll.ts';
import type { PayrollParameters } from '../data/canada-payroll-2026.ts';
import type { AustrianParameters } from '../data/austria-2026.ts';
import { splitAnnualGross } from './austria-special.ts';

export interface EmployerCost {
  readonly grossSalary: number;
  /** Everything the employer pays on top of salary. */
  readonly employerContributions: number;
  /** Salary plus contributions. */
  readonly totalCost: number;
  /** Contributions as a share of salary. */
  readonly loadRate: number;
  readonly components: readonly { label: string; amount: number }[];
}

/** Canadian employer cost: matched pension contributions plus EI and QPIP. */
export function canadaEmployerCost(
  grossSalary: number,
  parameters: PayrollParameters,
): EmployerCost {
  const gross = clampToZero(grossSalary);

  // The employer matches CPP, QPP and CPP2 exactly.
  const pension = cppContribution(gross, parameters);
  const pension2 = cpp2Contribution(gross, parameters);

  const insurable = capAt(gross, parameters.ei.maximumInsurableEarnings.value);
  const ei = capAt(
    insurable * parameters.employer.eiRate.value,
    parameters.employer.eiMaximumPremium.value,
  );

  const qpipRate = parameters.employer.qpipRate?.value;
  const qpipMaximum = parameters.employer.qpipMaximumPremium?.value;
  const qpip =
    parameters.qpip && qpipRate !== undefined && qpipMaximum !== undefined
      ? capAt(
          capAt(gross, parameters.qpip.maximumInsurableEarnings.value) * qpipRate,
          qpipMaximum,
        )
      : 0;

  const components = [
    { label: 'Pension plan (matched)', amount: roundToCents(pension) },
    { label: 'Second additional pension (matched)', amount: roundToCents(pension2) },
    { label: 'Employment insurance', amount: roundToCents(ei) },
    ...(qpip > 0 ? [{ label: 'Parental insurance', amount: roundToCents(qpip) }] : []),
  ];

  const total = pension + pension2 + ei + qpip;

  return {
    grossSalary: gross,
    employerContributions: roundToCents(total),
    totalCost: roundToCents(gross + total),
    loadRate: gross > 0 ? total / gross : 0,
    components,
  };
}

/**
 * Austrian employer cost.
 *
 * Social insurance is capped by the same ceilings as the employee side, using
 * the same 6/7 and 1/7 split. The wage levies are not capped at all.
 */
export function austriaEmployerCost(
  annualGross: number,
  parameters: AustrianParameters,
  options: { specialPayments: boolean } = { specialPayments: true },
): EmployerCost {
  const gross = clampToZero(annualGross);
  const employer = parameters.employer;
  const si = parameters.socialInsurance;

  const { regular, special } = options.specialPayments
    ? splitAnnualGross(gross)
    : { regular: gross, special: 0 };

  // Social insurance stops at the ceilings, exactly as it does for employees.
  const regularBasis = capAt(regular / 12, si.monthlyCeiling.value) * 12;
  const specialBasis = capAt(special, parameters.specialPaymentInsuranceCeiling.value);
  const insuranceBasis = regularBasis + specialBasis;
  const socialInsurance = insuranceBasis * employer.socialInsuranceRate.value;

  // The levies apply to the whole salary, with no ceiling at all.
  const pensionFund = gross * employer.pensionFundRate.value;
  const familyFund = gross * employer.familyFundRate.value;
  const surcharge = gross * employer.familyFundSurchargeRate.value;
  const municipal = gross * employer.municipalTaxRate.value;

  const total = socialInsurance + pensionFund + familyFund + surcharge + municipal;

  return {
    grossSalary: gross,
    employerContributions: roundToCents(total),
    totalCost: roundToCents(gross + total),
    loadRate: gross > 0 ? total / gross : 0,
    components: [
      { label: 'Social insurance (capped)', amount: roundToCents(socialInsurance) },
      { label: 'Company pension fund', amount: roundToCents(pensionFund) },
      { label: 'Family burden levy', amount: roundToCents(familyFund) },
      { label: 'Levy surcharge', amount: roundToCents(surcharge) },
      { label: 'Municipal payroll tax', amount: roundToCents(municipal) },
    ],
  };
}
