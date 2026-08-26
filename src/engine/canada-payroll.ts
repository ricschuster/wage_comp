/**
 * Canadian payroll contributions: CPP, CPP2 and EI.
 *
 * Pure. Splits each contribution into the portion deducted from income and the
 * portion that produces a non-refundable credit, because the two are treated
 * differently and collapsing them would misstate tax at every income.
 */

import { capAt, clampToZero, roundToCents } from './money.ts';
import type { PayrollParameters } from '../data/types.ts';

export interface PayrollBreakdown {
  readonly cppContribution: number;
  readonly cpp2Contribution: number;
  readonly eiPremium: number;
  /** Quebec parental insurance premium, zero outside Quebec. */
  readonly qpipPremium: number;
  readonly totalContributions: number;
  /**
   * Deducted from income before tax: the CPP first additional portion plus all
   * of CPP2. T4127 formula F5.
   */
  readonly deductibleAmount: number;
  /**
   * Produces a non-refundable credit at the lowest federal and provincial
   * rates: the CPP base portion plus the EI premium. T4127 formula K2.
   */
  readonly creditableAmount: number;
}

/** CPP contribution on employment income. */
export function cppContribution(
  employmentIncome: number,
  parameters: PayrollParameters,
): number {
  const { maximumPensionableEarnings, basicExemption, rate, maximumContribution } =
    parameters.cpp;

  const pensionable = capAt(
    clampToZero(employmentIncome),
    maximumPensionableEarnings.value,
  );
  const contributory = clampToZero(pensionable - basicExemption.value);
  return capAt(contributory * rate.value, maximumContribution.value);
}

/** CPP2 contribution, on earnings between the YMPE and the YAMPE. */
export function cpp2Contribution(
  employmentIncome: number,
  parameters: PayrollParameters,
): number {
  const ympe = parameters.cpp.maximumPensionableEarnings.value;
  const { additionalMaximumPensionableEarnings, rate, maximumContribution } =
    parameters.cpp2;

  const pensionable = capAt(
    clampToZero(employmentIncome),
    additionalMaximumPensionableEarnings.value,
  );
  const contributory = clampToZero(pensionable - ympe);
  return capAt(contributory * rate.value, maximumContribution.value);
}

/** EI premium on insurable earnings. */
export function eiPremium(
  employmentIncome: number,
  parameters: PayrollParameters,
): number {
  const { maximumInsurableEarnings, rate, maximumPremium } = parameters.ei;

  const insurable = capAt(
    clampToZero(employmentIncome),
    maximumInsurableEarnings.value,
  );
  return capAt(insurable * rate.value, maximumPremium.value);
}

/** Quebec parental insurance premium. Zero where the plan does not apply. */
export function qpipPremium(
  employmentIncome: number,
  parameters: PayrollParameters,
): number {
  const qpip = parameters.qpip;
  if (!qpip) {
    return 0;
  }
  const insurable = capAt(
    clampToZero(employmentIncome),
    qpip.maximumInsurableEarnings.value,
  );
  return capAt(insurable * qpip.rate.value, qpip.maximumPremium.value);
}

/** All contributions, split by tax treatment. */
export function computePayroll(
  employmentIncome: number,
  parameters: PayrollParameters,
): PayrollBreakdown {
  const cpp = cppContribution(employmentIncome, parameters);
  const cpp2 = cpp2Contribution(employmentIncome, parameters);
  const ei = eiPremium(employmentIncome, parameters);
  const qpip = qpipPremium(employmentIncome, parameters);

  const { baseRate, firstAdditionalRate, rate } = parameters.cpp;
  // Split by rate share rather than recomputing from earnings, so the split
  // stays exact at the contribution ceiling where the rate no longer applies.
  const cppDeductible = cpp * (firstAdditionalRate.value / rate.value);
  const cppCreditable = cpp * (baseRate.value / rate.value);

  return {
    cppContribution: roundToCents(cpp),
    cpp2Contribution: roundToCents(cpp2),
    eiPremium: roundToCents(ei),
    qpipPremium: roundToCents(qpip),
    totalContributions: roundToCents(cpp + cpp2 + ei + qpip),
    deductibleAmount: roundToCents(cppDeductible + cpp2),
    // QPIP joins the federal credit for a Quebec resident, per T4127 K2RQ.
    creditableAmount: roundToCents(cppCreditable + ei + qpip),
  };
}
