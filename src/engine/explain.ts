/**
 * Turns a computed comparison into readable working, with citations.
 *
 * This is what makes the model checkable by a third party, which is the point
 * of publishing it openly. A reader should be able to reconstruct any headline
 * number by hand from what this produces.
 *
 * It reads the existing breakdowns rather than instrumenting the calculation
 * modules, so the verified engine code stays untouched and there is no risk of
 * the explanation and the arithmetic drifting apart: both come from the same
 * result object.
 */

import { bracketBreakdown } from './brackets.ts';
import type { TraceEntry } from './compare.ts';
import type { ComparisonParameters, ComparisonResult } from './compare.ts';
import type { Sourced } from './types.ts';

export interface TraceSection {
  readonly title: string;
  /** Currency the figures in this section are expressed in. */
  readonly currency: 'CAD' | 'EUR' | null;
  readonly entries: readonly TraceEntry[];
}

/** Two decimal places with thousands separators, for use inside formulas. */
function n(value: number): string {
  return value.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** A rate as a percentage, trimmed of trailing zeros. */
function pct(rate: number): string {
  return `${Number((rate * 100).toFixed(4))}%`;
}

/** Renders the per-band working of a bracket calculation. */
function bandFormula(
  income: number,
  table: Parameters<typeof bracketBreakdown>[1],
): string {
  const bands = bracketBreakdown(income, table);
  if (bands.length === 0) {
    return '0.00';
  }
  return bands.map((band) => `${n(band.amount)} at ${pct(band.rate)}`).join(' + ');
}

function entry(
  label: string,
  formula: string,
  value: number,
  sources: readonly Sourced<unknown>[],
): TraceEntry {
  return { label, formula, value, sources: sources as readonly Sourced<number>[] };
}

/** Working for the Canadian side. */
export function explainCanada(
  result: ComparisonResult,
  parameters: ComparisonParameters,
): TraceSection[] {
  const { canada } = result;
  const fed = parameters.canada.federal;
  const pay = parameters.canada.payroll;
  const prov = parameters.canada.province;

  return [
    {
      title: 'Canada: payroll contributions',
      currency: 'CAD',
      entries: [
        entry(
          'CPP',
          `(min(${n(canada.grossIncome)}, ${n(pay.cpp.maximumPensionableEarnings.value)}) − ${n(pay.cpp.basicExemption.value)}) × ${pct(pay.cpp.rate.value)}, capped at ${n(pay.cpp.maximumContribution.value)} = ${n(canada.payroll.cppContribution)}`,
          canada.payroll.cppContribution,
          [
            pay.cpp.maximumPensionableEarnings,
            pay.cpp.basicExemption,
            pay.cpp.rate,
            pay.cpp.maximumContribution,
          ],
        ),
        entry(
          'CPP2',
          `(min(${n(canada.grossIncome)}, ${n(pay.cpp2.additionalMaximumPensionableEarnings.value)}) − ${n(pay.cpp.maximumPensionableEarnings.value)}) × ${pct(pay.cpp2.rate.value)}, capped at ${n(pay.cpp2.maximumContribution.value)} = ${n(canada.payroll.cpp2Contribution)}`,
          canada.payroll.cpp2Contribution,
          [
            pay.cpp2.additionalMaximumPensionableEarnings,
            pay.cpp2.rate,
            pay.cpp2.maximumContribution,
          ],
        ),
        entry(
          'EI',
          `min(${n(canada.grossIncome)}, ${n(pay.ei.maximumInsurableEarnings.value)}) × ${pct(pay.ei.rate.value)}, capped at ${n(pay.ei.maximumPremium.value)} = ${n(canada.payroll.eiPremium)}`,
          canada.payroll.eiPremium,
          [pay.ei.maximumInsurableEarnings, pay.ei.rate, pay.ei.maximumPremium],
        ),
        ...(pay.qpip
          ? [
              entry(
                'QPIP',
                `min(${n(canada.grossIncome)}, ${n(pay.qpip.maximumInsurableEarnings.value)}) × ${pct(pay.qpip.rate.value)}, capped at ${n(pay.qpip.maximumPremium.value)} = ${n(canada.payroll.qpipPremium)}. Quebec only; it is why the EI rate here is lower.`,
                canada.payroll.qpipPremium,
                [
                  pay.qpip.maximumInsurableEarnings,
                  pay.qpip.rate,
                  pay.qpip.maximumPremium,
                ],
              ),
            ]
          : []),
        entry(
          'Deducted from income',
          `CPP × ${pct(pay.cpp.firstAdditionalRate.value)}/${pct(pay.cpp.rate.value)} + CPP2 = ${n(canada.payroll.deductibleAmount)}`,
          canada.payroll.deductibleAmount,
          [pay.cpp.firstAdditionalRate, pay.cpp.rate],
        ),
        entry(
          'Eligible for credit',
          `CPP × ${pct(pay.cpp.baseRate.value)}/${pct(pay.cpp.rate.value)} + EI = ${n(canada.payroll.creditableAmount)}`,
          canada.payroll.creditableAmount,
          [pay.cpp.baseRate, pay.cpp.rate],
        ),
      ],
    },
    {
      title: 'Canada: federal tax',
      currency: 'CAD',
      entries: [
        entry(
          'Taxable income',
          `${n(canada.grossIncome)} − ${n(canada.payroll.deductibleAmount)} = ${n(canada.taxableIncome)}`,
          canada.taxableIncome,
          [],
        ),
        entry(
          'Tax before credits',
          `${bandFormula(canada.taxableIncome, fed.brackets.value)} = ${n(canada.federal.taxBeforeCredits)}`,
          canada.federal.taxBeforeCredits,
          [fed.brackets],
        ),
        entry(
          'Credit amounts',
          `basic personal ${n(canada.federal.basicPersonalAmount)} + employment ${n(canada.federal.canadaEmploymentAmount)} + payroll ${n(canada.federal.additionalCreditAmounts)} = ${n(canada.federal.totalCreditAmounts)}`,
          canada.federal.totalCreditAmounts,
          [
            fed.basicPersonalAmountBase,
            fed.basicPersonalAmountSupplement,
            fed.canadaEmploymentAmount,
          ],
        ),
        entry(
          'Federal tax payable',
          `${n(canada.federal.taxBeforeCredits)} − (${n(canada.federal.totalCreditAmounts)} × ${pct(fed.creditRate.value)}) = ${n(canada.federal.taxPayable)}`,
          canada.federal.taxPayable,
          [fed.creditRate],
        ),
        ...(prov.federalAbatementRate
          ? [
              entry(
                'Quebec abatement',
                `federal tax reduced by ${pct(prov.federalAbatementRate.value)} because Quebec runs programs the federal government runs elsewhere: ${n(canada.federal.taxPayable)} − ${n(canada.federalAbatement)} = ${n(canada.federalTaxAfterAbatement)}`,
                canada.federalTaxAfterAbatement,
                [prov.federalAbatementRate],
              ),
            ]
          : []),
      ],
    },
    {
      title: `Canada: ${prov.name} tax`,
      currency: 'CAD',
      entries: [
        ...(prov.workerDeduction
          ? [
              entry(
                'Deduction for workers',
                `${pct(prov.workerDeduction.rate.value)} of employment income, capped at ${n(prov.workerDeduction.maximum.value)} = ${n(canada.provincial.workerDeduction)}. It replaces the contribution credits the rest of Canada grants.`,
                canada.provincial.workerDeduction,
                [prov.workerDeduction.rate, prov.workerDeduction.maximum],
              ),
              entry(
                'Provincial taxable income',
                `${n(canada.taxableIncome)} − ${n(canada.provincial.workerDeduction)} = ${n(canada.provincial.taxableIncome)}`,
                canada.provincial.taxableIncome,
                [],
              ),
            ]
          : []),
        entry(
          'Tax before credits',
          `${bandFormula(canada.provincial.taxableIncome, prov.brackets.value)} = ${n(canada.provincial.taxBeforeCredits)}`,
          canada.provincial.taxBeforeCredits,
          [prov.brackets],
        ),
        entry(
          'Credit amounts',
          `basic personal ${n(canada.provincial.basicPersonalAmount)} + payroll ${n(canada.provincial.additionalCreditAmounts)} = ${n(canada.provincial.totalCreditAmounts)}`,
          canada.provincial.totalCreditAmounts,
          [prov.basicPersonalAmount],
        ),
        entry(
          'Tax after credits',
          `${n(canada.provincial.taxBeforeCredits)} − (${n(canada.provincial.totalCreditAmounts)} × ${pct(prov.creditRate.value)}) = ${n(canada.provincial.taxAfterCredits)}`,
          canada.provincial.taxAfterCredits,
          [prov.creditRate],
        ),
        ...(prov.surtax
          ? [
              entry(
                'Surtax',
                `charged on tax, not income: ${prov.surtax.value
                  .map((tier) => `${pct(tier.rate)} of tax over ${n(tier.over)}`)
                  .join(' + ')} = ${n(canada.provincial.surtax)}`,
                canada.provincial.surtax,
                [prov.surtax],
              ),
            ]
          : []),
        ...(prov.taxReduction
          ? [
              entry(
                'Low-income tax reduction',
                prov.taxReduction.kind === 'doubleBase'
                  ? `lesser of the tax and 2 × ${n(prov.taxReduction.baseAmount.value)} less the tax = ${n(canada.provincial.taxReduction)}`
                  : `${n(canada.provincial.taxReduction)} applied, limited to tax payable`,
                canada.provincial.taxReduction,
                prov.taxReduction.kind === 'doubleBase'
                  ? [prov.taxReduction.baseAmount]
                  : [
                      prov.taxReduction.maximumReduction,
                      prov.taxReduction.phaseOutStart,
                      prov.taxReduction.phaseOutRate,
                    ],
              ),
            ]
          : []),
        ...(prov.healthPremium
          ? [
              entry(
                'Health premium',
                `charged on taxable income and not reduced by the tax reduction: ${n(canada.provincial.healthPremium)}`,
                canada.provincial.healthPremium,
                [prov.healthPremium],
              ),
            ]
          : []),
        entry(
          'Provincial tax payable',
          `${n(canada.provincial.taxAfterCredits)} + ${n(canada.provincial.surtax)} surtax − ${n(canada.provincial.taxReduction)} reduction + ${n(canada.provincial.healthPremium)} premium = ${n(canada.provincial.taxPayable)}`,
          canada.provincial.taxPayable,
          [],
        ),
      ],
    },
    {
      title: 'Canada: net income',
      currency: 'CAD',
      entries: [
        entry(
          'Net income',
          `${n(canada.grossIncome)} − ${n(canada.federalTaxAfterAbatement)} federal − ${n(canada.provincial.taxPayable)} provincial − ${n(canada.payroll.totalContributions)} contributions = ${n(canada.netIncome)}`,
          canada.netIncome,
          [],
        ),
        entry(
          'Effective deduction rate',
          `${n(canada.totalDeductions)} / ${n(canada.grossIncome)} = ${pct(canada.effectiveDeductionRate)}`,
          canada.effectiveDeductionRate,
          [],
        ),
      ],
    },
  ];
}

/** Working for the Austrian side. */
export function explainAustria(
  result: ComparisonResult,
  parameters: ComparisonParameters,
): TraceSection[] {
  const { austria } = result;
  const at = parameters.austria;
  const si = at.socialInsurance;
  const regular = austria.regular;
  const special = austria.special;

  const sections: TraceSection[] = [
    {
      title: 'Austria: splitting annual gross',
      currency: 'EUR',
      entries: [
        special
          ? entry(
              'Regular salary (12 of 14 payments)',
              `${n(austria.grossIncome)} × 6/7 = ${n(austria.regularGross)}`,
              austria.regularGross,
              [],
            )
          : entry(
              'Regular salary',
              `special payments turned off, so all ${n(austria.grossIncome)} is treated as regular pay`,
              austria.regularGross,
              [],
            ),
        ...(special
          ? [
              entry(
                'Special payments (2 of 14 payments)',
                `${n(austria.grossIncome)} × 1/7 = ${n(austria.specialGross)}. This is a split of annual gross, not an addition to it.`,
                austria.specialGross,
                [],
              ),
            ]
          : []),
      ],
    },
    {
      title: 'Austria: regular salary',
      currency: 'EUR',
      entries: [
        entry(
          'Social insurance',
          `${n(regular.socialInsurance.annualBasis)} (after the ${n(si.monthlyCeiling.value)} monthly ceiling) × ${pct(regular.socialInsurance.totalRate)} = ${n(regular.socialInsurance.contribution)}`,
          regular.socialInsurance.contribution,
          [
            si.healthRate,
            si.pensionRate,
            si.chamberRate,
            si.housingRate,
            si.unemploymentScale,
            si.monthlyCeiling,
          ],
        ),
        entry(
          'Taxable income',
          `${n(regular.regularGross)} − ${n(regular.socialInsurance.contribution)} social insurance − ${n(regular.employmentExpenseAllowance)} allowance = ${n(regular.taxableIncome)}`,
          regular.taxableIncome,
          [at.employmentExpenseAllowance],
        ),
        entry(
          'Tax before credits',
          `${bandFormula(regular.taxableIncome, at.brackets.value)} = ${n(regular.taxBeforeCredits)}`,
          regular.taxBeforeCredits,
          [at.brackets],
        ),
        entry(
          'Credits',
          `commuting ${n(regular.commutingCredit)} + supplement ${n(regular.commutingCreditSupplement)} = ${n(regular.totalCredits)}`,
          regular.totalCredits,
          [
            at.commutingCredit,
            at.commutingCreditSupplement,
            at.commutingCreditSupplementPhaseOutStart,
            at.commutingCreditSupplementPhaseOutEnd,
          ],
        ),
        regular.socialInsuranceRefund > 0
          ? entry(
              'Negative tax refund',
              `tax fell below zero, so ${pct(at.socialInsuranceRefundRate.value)} of social insurance is refunded, capped: ${n(regular.socialInsuranceRefund)}`,
              regular.socialInsuranceRefund,
              [
                at.socialInsuranceRefundRate,
                at.socialInsuranceRefundMaximum,
                at.socialInsuranceRefundBonus,
              ],
            )
          : entry(
              'Tax on regular salary',
              `${n(regular.taxBeforeCredits)} − ${n(regular.totalCredits)} = ${n(regular.incomeTax)}`,
              regular.incomeTax,
              [],
            ),
      ],
    },
  ];

  if (special) {
    sections.push({
      title: 'Austria: special payments',
      currency: 'EUR',
      entries: [
        entry(
          'Social insurance',
          `${n(special.socialInsurance.basis)} (after the separate ${n(at.specialPaymentInsuranceCeiling.value)} annual ceiling) × ${pct(special.socialInsurance.totalRate)} = ${n(special.socialInsurance.contribution)}. Lower than the regular rate: the chamber and housing levies are not charged here.`,
          special.socialInsurance.contribution,
          [si.healthRate, si.pensionRate, at.specialPaymentInsuranceCeiling],
        ),
        entry(
          'Amount taxed at fixed rates',
          `${n(special.specialGross)} − ${n(special.socialInsurance.contribution)} = ${n(special.taxableAmount)}`,
          special.taxableAmount,
          [],
        ),
        special.belowExemptionLimit
          ? entry(
              'Below the exemption limit',
              `the Jahressechstel is at or below ${n(at.specialPaymentExemptionLimit.value)}, so the fixed rates do not apply`,
              0,
              [at.specialPaymentExemptionLimit],
            )
          : entry(
              'Tax at the fixed bands',
              `${bandFormula(Math.min(special.taxableAmount, at.specialPaymentBandCeiling.value), at.specialPaymentBands.value)} = ${n(special.taxAtFixedRates)}`,
              special.taxAtFixedRates,
              [at.specialPaymentBands, at.specialPaymentBandCeiling],
            ),
      ],
    });
  }

  sections.push({
    title: 'Austria: net income',
    currency: 'EUR',
    entries: [
      entry(
        'Net income',
        `${n(austria.grossIncome)} − ${n(austria.totalTax)} tax − ${n(austria.totalSocialInsurance)} social insurance = ${n(austria.netIncome)}`,
        austria.netIncome,
        [],
      ),
      entry(
        'Effective deduction rate',
        `${n(austria.totalDeductions)} / ${n(austria.grossIncome)} = ${pct(austria.effectiveDeductionRate)}`,
        austria.effectiveDeductionRate,
        [],
      ),
    ],
  });

  return sections;
}

/** The complete working behind a comparison, ready for the audit view. */
export function explainComparison(
  result: ComparisonResult,
  parameters: ComparisonParameters,
): TraceSection[] {
  return [
    ...explainCanada(result, parameters),
    ...explainAustria(result, parameters),
    { title: 'Conversion and ratio', currency: null, entries: result.trace },
  ];
}
