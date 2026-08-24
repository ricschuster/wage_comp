import { describe, expect, it } from 'vitest';
import { validateBracketTable } from './brackets.ts';
import {
  REGULAR_SHARE,
  SPECIAL_SHARE,
  computeAustriaSpecial,
  specialSocialInsurance,
  splitAnnualGross,
} from './austria-special.ts';
import { computeAustria } from './austria.ts';
import { AUSTRIA_2026 as P } from '../data/austria-2026.ts';

describe('the split rule', () => {
  it('divides annual gross 6/7 regular and 1/7 special', () => {
    expect(REGULAR_SHARE + SPECIAL_SHARE).toBeCloseTo(1, 12);
    expect(SPECIAL_SHARE).toBeCloseTo(2 / 14, 12);
    expect(REGULAR_SHARE).toBeCloseTo(12 / 14, 12);
  });

  it('always sums the two portions back to gross exactly', () => {
    // This is the rule the predecessor workbook broke. If it ever fails,
    // Austrian compensation is being double counted.
    for (let gross = 0; gross <= 300_000; gross += 1_337) {
      const { regular, special } = splitAnnualGross(gross);
      expect(regular + special).toBeCloseTo(gross, 8);
    }
  });

  it('never adds special payments on top of annual gross', () => {
    const result = computeAustria(70_000, P);
    expect(result.regularGross + result.specialGross).toBeCloseTo(70_000, 2);
    expect(result.specialGross).toBeLessThan(result.grossIncome);
  });

  it('makes the special payment equal the Jahressechstel', () => {
    // A sixth of annual regular pay is exactly the 1/7 special portion.
    const { regular, special } = splitAnnualGross(84_000);
    expect(regular / 6).toBeCloseTo(special, 6);
  });
});

describe('special payment parameters', () => {
  it('has a structurally valid band table', () => {
    expect(validateBracketTable(P.specialPaymentBands.value)).toEqual([]);
  });

  it('matches the statutory band widths', () => {
    // EStG 67(1): 620 free, next 24,380, next 25,000, next 33,333.
    const bands = P.specialPaymentBands.value;
    expect(bands[0]?.to).toBe(620);
    expect((bands[1]?.to ?? 0) - (bands[1]?.from ?? 0)).toBe(24_380);
    expect((bands[2]?.to ?? 0) - (bands[2]?.from ?? 0)).toBe(25_000);
    expect(P.specialPaymentBandCeiling.value - (bands[3]?.from ?? 0)).toBe(33_333);
  });

  it('has the published rates', () => {
    expect(P.specialPaymentBands.value.map((b) => b.rate)).toEqual([
      0, 0.06, 0.27, 0.3575,
    ]);
  });
});

describe('the two social insurance regimes', () => {
  it('charges a lower rate on special payments than on regular pay', () => {
    const regular = computeAustria(60_000, P).regular.socialInsurance.totalRate;
    const special = specialSocialInsurance(10_000, 5_000, P).totalRate;
    expect(special).toBeLessThan(regular);
    // 18.07% regular against 17.07% special: chamber and housing levies are
    // not charged on special payments.
    expect(regular - special).toBeCloseTo(0.01, 10);
  });

  it('applies a separate annual ceiling to special payments', () => {
    const ceiling = P.specialPaymentInsuranceCeiling.value;
    const result = specialSocialInsurance(30_000, 6_000, P);
    expect(result.basis).toBeCloseTo(ceiling, 2);
    expect(result.contribution).toBeCloseTo(ceiling * 0.1707, 2);
  });

  it('does not collapse the two ceilings into one', () => {
    // Regular pay is capped monthly at 6,930, special pay annually at 13,860.
    // At high income both bind, and the two bases must differ.
    const result = computeAustria(300_000, P);
    expect(result.regular.socialInsurance.annualBasis).toBeCloseTo(6_930 * 12, 2);
    expect(result.special?.socialInsurance.basis).toBeCloseTo(13_860, 2);
  });

  it('follows the graduated unemployment band from regular pay', () => {
    const low = specialSocialInsurance(3_000, 2_000, P);
    expect(low.unemploymentRate).toBe(0);
    const high = specialSocialInsurance(3_000, 5_000, P);
    expect(high.unemploymentRate).toBe(0.0295);
  });
});

describe('computeAustriaSpecial', () => {
  it('taxes the first 620 at zero', () => {
    const result = computeAustriaSpecial(3_000, 5_000, P);
    const expected = (result.taxableAmount - 620) * 0.06;
    expect(result.taxAtFixedRates).toBeCloseTo(expected, 2);
  });

  it('applies no fixed rate below the exemption limit', () => {
    const result = computeAustriaSpecial(2_000, 1_000, P);
    expect(result.belowExemptionLimit).toBe(true);
    expect(result.incomeTax).toBe(0);
  });

  it('applies the 27% band above 25,000', () => {
    const result = computeAustriaSpecial(40_000, 6_000, P);
    expect(result.taxableAmount).toBeGreaterThan(25_000);
    const expected = (25_000 - 620) * 0.06 + (result.taxableAmount - 25_000) * 0.27;
    expect(result.taxAtFixedRates).toBeCloseTo(expected, 2);
  });

  it('routes amounts above the ceiling out of the fixed-rate regime', () => {
    const result = computeAustriaSpecial(120_000, 6_000, P);
    expect(result.amountAboveCeiling).toBeGreaterThan(0);
    expect(result.taxableAmount - result.amountAboveCeiling).toBeCloseTo(83_333, 2);
  });

  it('never taxes special pay more heavily than it is worth', () => {
    for (let gross = 0; gross <= 60_000; gross += 500) {
      const result = computeAustriaSpecial(gross, 6_000, P);
      expect(result.netIncome).toBeGreaterThanOrEqual(0);
      expect(result.netIncome).toBeLessThanOrEqual(gross);
    }
  });
});

describe('computeAustria', () => {
  it('reconciles net income against gross less tax and insurance', () => {
    for (const gross of [40_000, 60_000, 100_000, 200_000, 300_000]) {
      const r = computeAustria(gross, P);
      expect(r.netIncome).toBeCloseTo(gross - r.totalTax - r.totalSocialInsurance, 2);
    }
  });

  it('leaves the taxpayer better off with special payments than without', () => {
    // The whole point of the regime: the same annual gross taxed partly at
    // fixed rates beats taxing all of it at the ordinary tariff. This is the
    // failure the original workbook shipped.
    for (const gross of [40_000, 60_000, 100_000, 200_000]) {
      const withSpecial = computeAustria(gross, P, { specialPayments: true });
      const without = computeAustria(gross, P, { specialPayments: false });
      expect(withSpecial.netIncome).toBeGreaterThan(without.netIncome);
    }
  });

  it('omits the special breakdown entirely when turned off', () => {
    const result = computeAustria(60_000, P, { specialPayments: false });
    expect(result.special).toBeNull();
    expect(result.specialGross).toBe(0);
    expect(result.regularGross).toBe(60_000);
  });

  it('leaves net income rising with gross across the modelled range', () => {
    let previous = -1;
    for (let gross = 0; gross <= 300_000; gross += 2_500) {
      const { netIncome } = computeAustria(gross, P);
      expect(netIncome).toBeGreaterThan(previous);
      previous = netIncome;
    }
  });

  it('keeps the effective deduction rate rising and bounded', () => {
    let previous = -1;
    for (let gross = 30_000; gross <= 300_000; gross += 10_000) {
      const { effectiveDeductionRate } = computeAustria(gross, P);
      expect(effectiveDeductionRate).toBeGreaterThan(0);
      expect(effectiveDeductionRate).toBeLessThan(0.55);
      expect(effectiveDeductionRate).toBeGreaterThan(previous);
      previous = effectiveDeductionRate;
    }
  });

  it('handles zero gross without dividing by zero', () => {
    expect(computeAustria(0, P).effectiveDeductionRate).toBe(0);
    expect(computeAustria(0, P).netIncome).toBe(0);
  });
});
