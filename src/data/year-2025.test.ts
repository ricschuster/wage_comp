/**
 * Verification of the 2025 parameter set against the publishing authority's own
 * arithmetic, plus two results checked by hand.
 *
 * Step 3 of `docs/ANNUAL_UPDATE.md`. The point is not to check the numbers
 * against the page they were transcribed from, which proves nothing, but
 * against a second published quantity derived from them: CRA's bracket
 * constants, Revenu Québec's constants, and the contribution maximums.
 *
 * Step 4 of the same procedure is the pair of hand calculations at the bottom.
 * Every test can pass and the answer still be wrong when the tests and the code
 * share an assumption, which is how the Quebec contribution-credit bug survived
 * the whole of the 2026 build.
 */

import { describe, expect, it } from 'vitest';
import { AUSTRIA_2025 } from './austria-2025.ts';
import { AUSTRIA_2026 } from './austria-2026.ts';
import {
  CANADA_FEDERAL_2025,
  CANADA_FEDERAL_2025_BPA_MAX,
} from './canada-federal-2025.ts';
import { CANADA_FEDERAL_2026 } from './canada-federal-2026.ts';
import { CANADA_PAYROLL_2025 } from './canada-payroll-2025.ts';
import { QUEBEC_PAYROLL_2025 } from './quebec-payroll-2025.ts';
import { canadaParametersFor } from './canada.ts';
import { PROVINCES_2025, PROVINCES_2026 } from './provinces/index.ts';
import type { ProvinceCode } from './provinces/index.ts';
import { taxFromBrackets, validateBracketTable } from '../engine/brackets.ts';
import { computeAustria } from '../engine/austria.ts';
import { computeCanada } from '../engine/canada.ts';
import type { BracketTable } from '../engine/types.ts';

/**
 * CRA publishes a constant per bracket such that `tax = rate x income -
 * constant` holds anywhere inside that bracket. Reproducing the constants
 * checks the thresholds and rates against CRA's own arithmetic.
 */
function bracketConstants(table: BracketTable): number[] {
  return table.map((band) =>
    Math.round(band.rate * band.from - taxFromBrackets(band.from, table)),
  );
}

/** Revenu Québec truncates where CRA rounds. */
function quebecConstants(table: BracketTable): number[] {
  return table.map((band) =>
    Math.trunc(band.rate * band.from - taxFromBrackets(band.from, table)),
  );
}

describe('2025 bracket tables are structurally sound', () => {
  it('accepts the federal table', () => {
    expect(validateBracketTable(CANADA_FEDERAL_2025.brackets.value)).toEqual([]);
  });

  it('accepts every provincial table', () => {
    for (const [code, province] of Object.entries(PROVINCES_2025)) {
      expect(validateBracketTable(province.brackets.value), code).toEqual([]);
    }
  });

  it('accepts both Austrian tables', () => {
    expect(validateBracketTable(AUSTRIA_2025.brackets.value)).toEqual([]);
    expect(validateBracketTable(AUSTRIA_2025.specialPaymentBands.value)).toEqual([]);
  });
});

describe('T4127 Table 8.22 constants for 2025', () => {
  it('reproduces the federal constants K', () => {
    expect(bracketConstants(CANADA_FEDERAL_2025.brackets.value)).toEqual([
      0, 3_443, 9_754, 15_090, 25_227,
    ]);
  });

  // Every jurisdiction CRA administers. Quebec is absent because it publishes
  // its own constants, checked separately below.
  const PUBLISHED: Partial<Record<ProvinceCode, number[]>> = {
    AB: [0, 1_200, 4_225, 6_039, 8_459, 12_089],
    BC: [0, 1_301, 4_061, 6_086, 9_398, 13_310, 22_924],
    MB: [0, 917, 5_567],
    NB: [0, 2_360, 4_412, 11_064],
    NL: [0, 2_563, 3_712, 6_868, 11_286, 14_108, 16_930, 22_575],
    NS: [0, 1_879, 2_929, 3_725, 9_137],
    NT: [0, 1_403, 5_145, 8_270],
    NU: [0, 1_641, 3_829, 8_276],
    ON: [0, 2_168, 4_294, 5_794, 7_994],
    PE: [0, 1_323, 3_347, 4_418, 6_350],
    SK: [0, 1_069, 4_124],
    YT: [0, 1_492, 3_672, 7_052, 18_052],
  };

  it('reproduces the constants KP for all twelve CRA-administered jurisdictions', () => {
    for (const [code, expected] of Object.entries(PUBLISHED)) {
      const province = PROVINCES_2025[code as ProvinceCode];
      expect(bracketConstants(province.brackets.value), code).toEqual(expected);
    }
  });
});

describe('Revenu Québec TP-1015.F constants for 2025', () => {
  it('reproduces the published constants, truncated rather than rounded', () => {
    expect(quebecConstants(PROVINCES_2025.QC.brackets.value)).toEqual([
      0, 2_662, 7_987, 10_255,
    ]);
  });

  it('still grants no contribution credits, because the worker deduction replaces them', () => {
    expect(PROVINCES_2025.QC.grantsContributionCredits).toBe(false);
    expect(PROVINCES_2025.QC.workerDeduction?.maximum.value).toBe(1_420);
  });
});

describe('2025 contribution maximums fall out of their own base and rate', () => {
  const cpp = CANADA_PAYROLL_2025.cpp;
  const contributory = cpp.maximumPensionableEarnings.value - cpp.basicExemption.value;

  it('derives the CPP maximum', () => {
    expect(contributory * cpp.rate.value).toBeCloseTo(cpp.maximumContribution.value, 2);
    // T4127 Table 8.25 and 8.26 publish the two halves separately.
    expect(contributory * cpp.baseRate.value).toBeCloseTo(3_356.1, 2);
    expect(contributory * cpp.firstAdditionalRate.value).toBeCloseTo(678, 2);
  });

  it('splits the CPP rate into a creditable base and a deductible enhancement', () => {
    expect(cpp.baseRate.value + cpp.firstAdditionalRate.value).toBeCloseTo(
      cpp.rate.value,
      6,
    );
  });

  it('derives the CPP2 maximum', () => {
    const band =
      CANADA_PAYROLL_2025.cpp2.additionalMaximumPensionableEarnings.value -
      cpp.maximumPensionableEarnings.value;
    expect(band).toBe(9_900);
    expect(band * CANADA_PAYROLL_2025.cpp2.rate.value).toBeCloseTo(
      CANADA_PAYROLL_2025.cpp2.maximumContribution.value,
      2,
    );
  });

  it('derives the EI maximums on both sides', () => {
    const ei = CANADA_PAYROLL_2025.ei;
    expect(ei.maximumInsurableEarnings.value * ei.rate.value).toBeCloseTo(
      ei.maximumPremium.value,
      2,
    );
    expect(
      ei.maximumInsurableEarnings.value * CANADA_PAYROLL_2025.employer.eiRate.value,
    ).toBeCloseTo(CANADA_PAYROLL_2025.employer.eiMaximumPremium.value, 2);
    // Employers pay 1.4 times the employee rate.
    expect(CANADA_PAYROLL_2025.employer.eiRate.value).toBeCloseTo(
      ei.rate.value * 1.4,
      6,
    );
  });

  it('derives the Quebec maximums, which differ in every plan but QPP2', () => {
    const qpp = QUEBEC_PAYROLL_2025.cpp;
    expect(
      (qpp.maximumPensionableEarnings.value - qpp.basicExemption.value) *
        qpp.rate.value,
    ).toBeCloseTo(qpp.maximumContribution.value, 2);

    const ei = QUEBEC_PAYROLL_2025.ei;
    expect(ei.maximumInsurableEarnings.value * ei.rate.value).toBeCloseTo(
      ei.maximumPremium.value,
      2,
    );

    const qpip = QUEBEC_PAYROLL_2025.qpip;
    expect(qpip).toBeDefined();
    expect(
      (qpip?.maximumInsurableEarnings.value ?? 0) * (qpip?.rate.value ?? 0),
    ).toBeCloseTo(qpip?.maximumPremium.value ?? 0, 2);
  });
});

describe('2025 against 2026, so a copied file cannot pass unnoticed', () => {
  it('indexes the federal thresholds into the 2026 ones exactly', () => {
    // Income Tax Act section 117.1: the 2026 thresholds are the 2025 ones
    // indexed by the published factor and rounded to the nearest dollar.
    const factor = 1 + CANADA_FEDERAL_2026.indexationFactor.value;
    const expected = CANADA_FEDERAL_2025.brackets.value
      .slice(1)
      .map((band) => Math.round(band.from * factor));
    const actual = CANADA_FEDERAL_2026.brackets.value.slice(1).map((band) => band.from);
    expect(actual).toEqual(expected);
  });

  it('indexes the federal basic personal amount into the 2026 one', () => {
    const factor = 1 + CANADA_FEDERAL_2026.indexationFactor.value;
    expect(Math.round(CANADA_FEDERAL_2025.basicPersonalAmountBase.value * factor)).toBe(
      CANADA_FEDERAL_2026.basicPersonalAmountBase.value,
    );
    expect(Math.round(CANADA_FEDERAL_2025_BPA_MAX * factor)).toBe(16_452);
  });

  it('never lets a 2026 threshold fall below its 2025 counterpart', () => {
    for (const code of Object.keys(PROVINCES_2025) as ProvinceCode[]) {
      const before = PROVINCES_2025[code].brackets.value;
      const after = PROVINCES_2026[code].brackets.value;
      expect(after.length, code).toBe(before.length);
      before.forEach((band, index) => {
        expect(after[index]?.from ?? 0, `${code} band ${index}`).toBeGreaterThanOrEqual(
          band.from,
        );
      });
    }
  });

  it('leaves Manitoba unmoved, because indexation is paused there', () => {
    expect(PROVINCES_2025.MB.brackets.value).toEqual(PROVINCES_2026.MB.brackets.value);
    expect(PROVINCES_2025.MB.basicPersonalAmount.value).toBe(
      PROVINCES_2026.MB.basicPersonalAmount.value,
    );
  });

  it('indexes the Austrian bands to within a euro of the 2026 table', () => {
    // Austria enacts the amounts by regulation rather than deriving them, so a
    // one-euro tolerance is expected where Canada matches to the dollar.
    const factor = 1 + AUSTRIA_2026.indexationFactor.value;
    AUSTRIA_2025.brackets.value.slice(1, -1).forEach((band, index) => {
      const expected = band.from * factor;
      const actual = AUSTRIA_2026.brackets.value[index + 1]?.from ?? 0;
      expect(Math.abs(actual - expected), `band ${index + 1}`).toBeLessThanOrEqual(1);
    });
  });

  it('holds the Austrian top band at a million, which is never indexed', () => {
    const top2025 = AUSTRIA_2025.brackets.value.at(-1);
    const top2026 = AUSTRIA_2026.brackets.value.at(-1);
    expect(top2025?.from).toBe(1_000_000);
    expect(top2026?.from).toBe(1_000_000);
  });
});

describe('a full 2025 result in British Columbia, checked by hand', () => {
  // 100,000 gross. Working, in order:
  //
  //   CPP        (71,300 - 3,500) x 5.95%              = 4,034.10
  //   CPP2       (81,200 - 71,300) x 4%                =   396.00
  //   EI         65,700 x 1.64%                        = 1,077.48
  //   deductible 67,800 x 1% + 396                     = 1,074.00
  //   creditable 67,800 x 4.95% + 1,077.48             = 4,433.58
  //   taxable    100,000 - 1,074                       = 98,926.00
  //   federal    57,375 x 14.5% + 41,551 x 20.5%       = 16,837.33
  //              less (16,129 + 1,471 + 4,433.58) x 14.5%
  //                                                    = 13,642.46
  //   BC         49,279 x 5.06% + 49,281 x 7.7% + 366 x 10.5%
  //                                                    =  6,326.58
  //              less (12,932 + 4,433.58) x 5.06%      =  5,447.89
  //   net        100,000 less every line above         = 75,402.07
  //
  // Taxable income lands 366 above BC's second threshold of 98,560, so the
  // third band applies. Doing this by hand without that band gives 5,437.64,
  // which is exactly the kind of near-miss the procedure exists to catch.
  const result = computeCanada(100_000, canadaParametersFor('BC', 2025));

  it('matches the hand-computed payroll contributions', () => {
    expect(result.payroll.cppContribution).toBeCloseTo(4_034.1, 2);
    expect(result.payroll.cpp2Contribution).toBeCloseTo(396, 2);
    expect(result.payroll.eiPremium).toBeCloseTo(1_077.48, 2);
    expect(result.payroll.deductibleAmount).toBeCloseTo(1_074, 2);
    expect(result.federal.additionalCreditAmounts).toBeCloseTo(4_433.58, 2);
  });

  it('matches the hand-computed tax and net income', () => {
    expect(result.taxableIncome).toBeCloseTo(98_926, 2);
    expect(result.federal.taxPayable).toBeCloseTo(13_642.46, 2);
    expect(result.provincial.taxPayable).toBeCloseTo(5_447.89, 2);
    expect(result.netIncome).toBeCloseTo(75_402.07, 2);
  });

  it('leaves more in hand in 2026 than in 2025 at the same gross', () => {
    // The federal rate cut from 14.5% to 14% plus indexation, against a higher
    // CPP ceiling. The cut wins.
    const later = computeCanada(100_000, canadaParametersFor('BC', 2026));
    expect(later.netIncome).toBeGreaterThan(result.netIncome);
  });
});

describe('a full 2025 result in Austria, checked by hand', () => {
  // 60,000 gross, split 6/7 regular and 1/7 special. Working:
  //
  //   regular    60,000 x 6/7                          = 51,428.57
  //   special    60,000 x 1/7                          =  8,571.43
  //   monthly    51,428.57 / 12 = 4,285.71, above the reduced band, so
  //              unemployment is charged at the full 2.95%
  //   regular SI 51,428.57 x 18.07%                     =  9,293.14
  //   taxable    51,428.57 - 9,293.14 - 132             = 42,003.43
  //   tariff     8,309 x 20% + 14,219 x 30% + 6,167.43 x 40%
  //                                                     =  8,394.47
  //   less the commuting credit of 487                  =  7,907.47
  //   special SI 8,571.43 x 17.07%                      =  1,463.14
  //   special    (8,571.43 - 1,463.14 - 620) x 6%       =    389.30
  //   net        60,000 less every deduction            = 40,946.95
  const result = computeAustria(60_000, AUSTRIA_2025);

  it('matches the hand-computed social insurance on both regimes', () => {
    expect(result.regularGross).toBeCloseTo(51_428.57, 2);
    expect(result.specialGross).toBeCloseTo(8_571.43, 2);
    expect(result.regular.socialInsurance.totalRate).toBeCloseTo(0.1807, 6);
    expect(result.regular.socialInsurance.contribution).toBeCloseTo(9_293.14, 2);
    expect(result.special?.socialInsurance.totalRate).toBeCloseTo(0.1707, 6);
    expect(result.special?.socialInsurance.contribution).toBeCloseTo(1_463.14, 2);
  });

  it('matches the hand-computed tax and net income', () => {
    expect(result.regular.taxableIncome).toBeCloseTo(42_003.43, 2);
    expect(result.regular.taxBeforeCredits).toBeCloseTo(8_394.47, 2);
    expect(result.regular.incomeTax).toBeCloseTo(7_907.47, 2);
    expect(result.special?.incomeTax).toBeCloseTo(389.3, 2);
    expect(result.netIncome).toBeCloseTo(40_946.95, 2);
  });

  it('leaves more in hand in 2026, because the bands moved and the rates did not', () => {
    const later = computeAustria(60_000, AUSTRIA_2026);
    expect(later.netIncome).toBeGreaterThan(result.netIncome);
  });
});

describe('2025 federal amounts hold together', () => {
  it('derives the published maximum basic personal amount of 16,129', () => {
    expect(CANADA_FEDERAL_2025_BPA_MAX).toBe(16_129);
  });

  it('uses the lowest bracket rate as the credit rate', () => {
    expect(CANADA_FEDERAL_2025.creditRate.value).toBe(
      CANADA_FEDERAL_2025.brackets.value[0]?.rate,
    );
    // The full-year 2025 rate after the mid-year cut, not 15% and not 14%.
    expect(CANADA_FEDERAL_2025.creditRate.value).toBe(0.145);
  });

  it('phases the basic personal amount out across the 29% to 33% span', () => {
    expect(CANADA_FEDERAL_2025.basicPersonalAmountPhaseOutStart.value).toBe(
      CANADA_FEDERAL_2025.brackets.value[3]?.from,
    );
    expect(CANADA_FEDERAL_2025.basicPersonalAmountPhaseOutEnd.value).toBe(
      CANADA_FEDERAL_2025.brackets.value[4]?.from,
    );
  });
});
