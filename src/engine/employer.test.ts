import { describe, expect, it } from 'vitest';
import { austriaEmployerCost, canadaEmployerCost } from './employer.ts';
import { AUSTRIA_2026 } from '../data/austria-2026.ts';
import { CANADA_PAYROLL_2026 } from '../data/canada-payroll-2026.ts';
import { QUEBEC_PAYROLL_2026 } from '../data/quebec-payroll-2026.ts';

describe('Canadian employer cost', () => {
  it('matches the employee pension contribution exactly', () => {
    const result = canadaEmployerCost(100_000, CANADA_PAYROLL_2026);
    const pension = result.components.find((c) => c.label.startsWith('Pension plan'));
    expect(pension?.amount).toBeCloseTo(4_230.45, 2);
  });

  it('charges 1.4 times the employee EI rate', () => {
    const result = canadaEmployerCost(100_000, CANADA_PAYROLL_2026);
    const ei = result.components.find((c) => c.label === 'Employment insurance');
    expect(ei?.amount).toBeCloseTo(1_572.3, 2);
    // 1,572.30 divided by the employee maximum of 1,123.07.
    expect(1_572.3 / 1_123.07).toBeCloseTo(1.4, 2);
  });

  it('charges QPIP only in Quebec, at the higher employer rate', () => {
    const rest = canadaEmployerCost(100_000, CANADA_PAYROLL_2026);
    expect(rest.components.some((c) => c.label === 'Parental insurance')).toBe(false);

    const quebec = canadaEmployerCost(100_000, QUEBEC_PAYROLL_2026);
    const qpip = quebec.components.find((c) => c.label === 'Parental insurance');
    expect(qpip?.amount).toBeCloseTo(100_000 * 0.00602, 2);
  });

  it('plateaus completely once every ceiling binds', () => {
    const at90 = canadaEmployerCost(90_000, CANADA_PAYROLL_2026).employerContributions;
    const at300 = canadaEmployerCost(
      300_000,
      CANADA_PAYROLL_2026,
    ).employerContributions;
    expect(at300).toBeCloseTo(at90, 2);
  });

  it('falls as a share of salary once contributions plateau', () => {
    const low = canadaEmployerCost(60_000, CANADA_PAYROLL_2026).loadRate;
    const high = canadaEmployerCost(300_000, CANADA_PAYROLL_2026).loadRate;
    expect(high).toBeLessThan(low);
  });

  it('handles zero salary without dividing by zero', () => {
    const result = canadaEmployerCost(0, CANADA_PAYROLL_2026);
    expect(result.loadRate).toBe(0);
    expect(result.totalCost).toBe(0);
  });
});

describe('Austrian employer cost', () => {
  it('sums the employer social insurance branches to 20.98%', () => {
    expect(AUSTRIA_2026.employer.socialInsuranceRate.value).toBeCloseTo(0.2098, 10);
  });

  it('caps social insurance but not the wage levies', () => {
    const low = austriaEmployerCost(60_000, AUSTRIA_2026);
    const high = austriaEmployerCost(300_000, AUSTRIA_2026);

    const insuranceOf = (result: typeof low) =>
      result.components.find((c) => c.label.startsWith('Social insurance'))?.amount ??
      0;
    const municipalOf = (result: typeof low) =>
      result.components.find((c) => c.label === 'Municipal payroll tax')?.amount ?? 0;

    // Insurance has plateaued; the municipal tax has risen fivefold with salary.
    expect(insuranceOf(high)).toBeCloseTo(
      (insuranceOf(low) * (83_160 + 13_860)) / 60_000,
      -2,
    );
    expect(municipalOf(high)).toBeCloseTo(municipalOf(low) * 5, 2);
  });

  it('charges the uncapped levies on every euro', () => {
    const result = austriaEmployerCost(300_000, AUSTRIA_2026);
    const uncapped = result.components
      .filter((c) => !c.label.startsWith('Social insurance'))
      .reduce((sum, c) => sum + c.amount, 0);
    const expected = 300_000 * (0.0153 + 0.037 + 0.0036 + 0.03);
    expect(uncapped).toBeCloseTo(expected, 2);
  });

  it('keeps rising with salary where the Canadian load has plateaued', () => {
    const austria =
      austriaEmployerCost(300_000, AUSTRIA_2026).employerContributions -
      austriaEmployerCost(200_000, AUSTRIA_2026).employerContributions;
    const canada =
      canadaEmployerCost(300_000, CANADA_PAYROLL_2026).employerContributions -
      canadaEmployerCost(200_000, CANADA_PAYROLL_2026).employerContributions;

    expect(canada).toBeCloseTo(0, 2);
    expect(austria).toBeGreaterThan(8_000);
  });

  it('applies the same split and ceilings as the employee side', () => {
    const withSpecial = austriaEmployerCost(300_000, AUSTRIA_2026, {
      specialPayments: true,
    });
    const without = austriaEmployerCost(300_000, AUSTRIA_2026, {
      specialPayments: false,
    });
    // With the split, the special-payment ceiling adds a second basis, so the
    // insured amount is higher than treating everything as regular pay.
    expect(withSpecial.employerContributions).toBeGreaterThan(
      without.employerContributions,
    );
  });

  it('handles zero salary without dividing by zero', () => {
    const result = austriaEmployerCost(0, AUSTRIA_2026);
    expect(result.loadRate).toBe(0);
    expect(result.totalCost).toBe(0);
  });
});

describe('the two employer burdens compared', () => {
  it('is far heavier in Austria at every income in the range', () => {
    for (const gross of [40_000, 60_000, 100_000, 200_000, 300_000]) {
      const austria = austriaEmployerCost(gross, AUSTRIA_2026).loadRate;
      const canada = canadaEmployerCost(gross, CANADA_PAYROLL_2026).loadRate;
      expect(austria, `at ${gross}`).toBeGreaterThan(canada);
    }
  });

  it('widens in absolute terms while narrowing as a share of salary', () => {
    // Both countries cap their social insurance, so both load rates fall with
    // income. Austria's falls far more slowly because its wage levies are
    // uncapped, so the gap in euros keeps growing even as the gap in
    // percentage points shrinks. Stating both, because either alone misleads.
    const euroGapAt = (gross: number) =>
      austriaEmployerCost(gross, AUSTRIA_2026).employerContributions -
      canadaEmployerCost(gross, CANADA_PAYROLL_2026).employerContributions;
    const rateGapAt = (gross: number) =>
      austriaEmployerCost(gross, AUSTRIA_2026).loadRate -
      canadaEmployerCost(gross, CANADA_PAYROLL_2026).loadRate;

    expect(euroGapAt(300_000)).toBeGreaterThan(euroGapAt(60_000));
    expect(rateGapAt(300_000)).toBeLessThan(rateGapAt(60_000));
    // Still a wide gap at the top: more than ten points of salary.
    expect(rateGapAt(300_000)).toBeGreaterThan(0.1);
  });

  it('carries provenance on every employer parameter', () => {
    const entries = [
      AUSTRIA_2026.employer.socialInsuranceRate,
      AUSTRIA_2026.employer.pensionFundRate,
      AUSTRIA_2026.employer.familyFundRate,
      AUSTRIA_2026.employer.familyFundSurchargeRate,
      AUSTRIA_2026.employer.municipalTaxRate,
      CANADA_PAYROLL_2026.employer.eiRate,
      CANADA_PAYROLL_2026.employer.eiMaximumPremium,
    ];
    for (const entry of entries) {
      expect(entry.source).toMatch(/^https:\/\//);
      expect(entry.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
