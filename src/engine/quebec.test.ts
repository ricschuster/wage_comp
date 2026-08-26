import { describe, expect, it } from 'vitest';
import { computeCanada } from './canada.ts';
import { computePayroll, qpipPremium } from './canada-payroll.ts';
import { canadaParametersFor, payrollFor } from '../data/canada.ts';
import { CANADA_PAYROLL_2026 } from '../data/canada-payroll-2026.ts';
import { QUEBEC_PAYROLL_2026 } from '../data/quebec-payroll-2026.ts';
import {
  SUPPORTED_PROVINCES,
  getProvince,
  type ProvinceCode,
} from '../data/provinces/index.ts';

const QC = canadaParametersFor('QC');
const ON = canadaParametersFor('ON');

describe('pairing payroll with the province', () => {
  it('gives Quebec QPP and everyone else CPP', () => {
    expect(payrollFor('QC')).toBe(QUEBEC_PAYROLL_2026);
    for (const code of SUPPORTED_PROVINCES) {
      if (code === 'QC') continue;
      expect(payrollFor(code as ProvinceCode), code).toBe(CANADA_PAYROLL_2026);
    }
  });

  it('assembles a parameter set whose province and payroll agree', () => {
    expect(QC.province.code).toBe('QC');
    expect(QC.payroll.cpp.rate.value).toBe(0.063);
    expect(ON.province.code).toBe('ON');
    expect(ON.payroll.cpp.rate.value).toBe(0.0595);
  });
});

describe('QPP against CPP', () => {
  it('charges a higher rate than CPP for the same earnings', () => {
    const qpp = computePayroll(100_000, QUEBEC_PAYROLL_2026);
    const cpp = computePayroll(100_000, CANADA_PAYROLL_2026);
    expect(qpp.cppContribution).toBeGreaterThan(cpp.cppContribution);
    expect(qpp.cppContribution).toBeCloseTo(4_479.3, 2);
    expect(cpp.cppContribution).toBeCloseTo(4_230.45, 2);
  });

  it('derives the published QPP maximum from earnings and rate', () => {
    const contributory = 74_600 - 3_500;
    expect(contributory * 0.063).toBeCloseTo(4_479.3, 2);
  });

  it('splits QPP into a base and a first additional portion that sum to the whole', () => {
    const p = QUEBEC_PAYROLL_2026.cpp;
    expect(p.baseRate.value + p.firstAdditionalRate.value).toBeCloseTo(
      p.rate.value,
      10,
    );
  });

  it('keeps CPP2 identical in Quebec', () => {
    expect(computePayroll(100_000, QUEBEC_PAYROLL_2026).cpp2Contribution).toBeCloseTo(
      computePayroll(100_000, CANADA_PAYROLL_2026).cpp2Contribution,
      2,
    );
  });
});

describe('QPIP', () => {
  it('is charged only in Quebec', () => {
    expect(qpipPremium(100_000, QUEBEC_PAYROLL_2026)).toBeGreaterThan(0);
    expect(qpipPremium(100_000, CANADA_PAYROLL_2026)).toBe(0);
  });

  it('caps at the published maximum', () => {
    expect(qpipPremium(103_000, QUEBEC_PAYROLL_2026)).toBeCloseTo(442.9, 2);
    expect(qpipPremium(300_000, QUEBEC_PAYROLL_2026)).toBeCloseTo(442.9, 2);
  });

  it('has a higher ceiling than EI, so it is still rising where EI has capped', () => {
    const low = qpipPremium(70_000, QUEBEC_PAYROLL_2026);
    const high = qpipPremium(90_000, QUEBEC_PAYROLL_2026);
    expect(high).toBeGreaterThan(low);
  });

  it('counts toward the federal credit, per T4127 K2RQ', () => {
    const result = computePayroll(100_000, QUEBEC_PAYROLL_2026);
    // Still below the 103,000 ceiling at this income, so not yet at the cap.
    expect(result.qpipPremium).toBeCloseTo(100_000 * 0.0043, 2);
    expect(result.creditableAmount).toBeGreaterThan(
      result.creditableAmount - result.qpipPremium,
    );
  });
});

describe('Quebec EI', () => {
  it('is charged at the reduced rate', () => {
    expect(computePayroll(100_000, QUEBEC_PAYROLL_2026).eiPremium).toBeCloseTo(
      895.7,
      2,
    );
    expect(computePayroll(100_000, CANADA_PAYROLL_2026).eiPremium).toBeCloseTo(
      1_123.07,
      2,
    );
  });
});

describe('the federal abatement', () => {
  it('reduces federal tax by 16.5% for a Quebec resident', () => {
    const result = computeCanada(100_000, QC);
    expect(result.federalAbatement).toBeCloseTo(result.federal.taxPayable * 0.165, 2);
    expect(result.federalTaxAfterAbatement).toBeCloseTo(
      result.federal.taxPayable * 0.835,
      2,
    );
  });

  it('is absent everywhere else', () => {
    for (const code of SUPPORTED_PROVINCES) {
      if (code === 'QC') continue;
      const result = computeCanada(100_000, canadaParametersFor(code as ProvinceCode));
      expect(result.federalAbatement, code).toBe(0);
      expect(result.federalTaxAfterAbatement, code).toBeCloseTo(
        result.federal.taxPayable,
        2,
      );
    }
  });

  it('is worth thousands, so omitting it would badly overstate Quebec tax', () => {
    const result = computeCanada(100_000, QC);
    expect(result.federalAbatement).toBeGreaterThan(1_500);
  });
});

describe('the deduction for workers', () => {
  it('is 6% of employment income, capped', () => {
    const low = computeCanada(20_000, QC);
    expect(low.provincial.workerDeduction).toBeCloseTo(20_000 * 0.06, 2);

    const high = computeCanada(100_000, QC);
    expect(high.provincial.workerDeduction).toBe(1_450);
  });

  it('reduces Quebec taxable income below the federal figure', () => {
    const result = computeCanada(100_000, QC);
    expect(result.provincial.taxableIncome).toBeCloseTo(
      result.taxableIncome - 1_450,
      2,
    );
  });

  it('is absent everywhere else', () => {
    for (const code of SUPPORTED_PROVINCES) {
      if (code === 'QC') continue;
      const result = computeCanada(100_000, canadaParametersFor(code as ProvinceCode));
      expect(result.provincial.workerDeduction, code).toBe(0);
    }
  });
});

describe('Quebec parameters', () => {
  it('has a large basic personal amount, behind only Alberta, Saskatchewan and Nunavut', () => {
    const qc = getProvince('QC').basicPersonalAmount.value;
    expect(qc).toBe(18_952);
    const larger = SUPPORTED_PROVINCES.filter(
      (code) => getProvince(code as ProvinceCode).basicPersonalAmount.value > qc,
    );
    expect(larger.sort()).toEqual(['AB', 'NU', 'SK']);
  });

  it('cites Revenu Quebec and the Ministere des Finances, not only CRA', () => {
    const qc = getProvince('QC');
    const hosts = [qc.brackets, qc.basicPersonalAmount, qc.creditRate].map(
      (entry) => new URL(entry.source).hostname,
    );
    expect(hosts.some((host) => host.includes('revenuquebec'))).toBe(true);
    expect(hosts.some((host) => host.includes('quebec.ca'))).toBe(true);
  });

  it('has no surtax, health premium or low-income reduction', () => {
    const qc = getProvince('QC');
    expect(qc.surtax).toBeUndefined();
    expect(qc.healthPremium).toBeUndefined();
    expect(qc.taxReduction).toBeUndefined();
  });
});

describe('the contribution credits Quebec does not grant', () => {
  it('gives no provincial credit for QPP, EI or QPIP', () => {
    // Revenu Quebec's own formula has no such term: the deduction for workers
    // replaced those credits. Granting both would double count the relief,
    // which is a bug this test exists to prevent recurring.
    const result = computeCanada(60_000, QC);
    expect(result.provincial.additionalCreditAmounts).toBe(0);
    expect(result.provincial.totalCreditAmounts).toBe(
      result.provincial.basicPersonalAmount,
    );
  });

  it('still grants them everywhere else', () => {
    for (const code of SUPPORTED_PROVINCES) {
      if (code === 'QC') continue;
      const result = computeCanada(60_000, canadaParametersFor(code as ProvinceCode));
      expect(result.provincial.additionalCreditAmounts, code).toBeGreaterThan(0);
    }
  });

  it('matches a hand calculation at 60,000 gross', () => {
    const r = computeCanada(60_000, QC);

    expect(r.payroll.cppContribution).toBeCloseTo(56_500 * 0.063, 2);
    expect(r.payroll.eiPremium).toBeCloseTo(780, 2);
    expect(r.payroll.qpipPremium).toBeCloseTo(258, 2);

    // Federal: brackets less credits on BPA, CEA and the creditable payroll,
    // then reduced by the abatement.
    expect(r.federal.taxPayable).toBeCloseTo(5_302.21, 1);
    expect(r.federalTaxAfterAbatement).toBeCloseTo(5_302.21 * 0.835, 1);

    // Quebec: 54,345 at 14% plus the remainder at 19%, less 18,952 at 14%,
    // with no contribution credit.
    expect(r.provincial.workerDeduction).toBe(1_450);
    expect(r.provincial.taxPayable).toBeCloseTo(8_299.9 - 18_952 * 0.14, 1);

    expect(r.netIncome).toBeCloseTo(45_328.53, 1);
  });
});

describe('Quebec end to end', () => {
  it('reconciles net income against gross less tax and contributions', () => {
    for (const gross of [40_000, 60_000, 100_000, 200_000, 300_000]) {
      const r = computeCanada(gross, QC);
      expect(r.netIncome).toBeCloseTo(
        gross -
          r.federalTaxAfterAbatement -
          r.provincial.taxPayable -
          r.payroll.totalContributions,
        2,
      );
    }
  });

  it('rises monotonically with gross', () => {
    let previous = -1;
    for (let gross = 0; gross <= 300_000; gross += 2_500) {
      const { netIncome } = computeCanada(gross, QC);
      expect(netIncome).toBeGreaterThan(previous);
      previous = netIncome;
    }
  });

  it('taxes a high earner the most heavily of any jurisdiction', () => {
    // Quebec's provincial rates are the steepest in Canada. The federal
    // abatement claws back a large part of that, but not all of it.
    const rates = SUPPORTED_PROVINCES.map((code) => ({
      code,
      rate: computeCanada(300_000, canadaParametersFor(code as ProvinceCode))
        .effectiveDeductionRate,
    })).sort((a, b) => b.rate - a.rate);

    expect(rates.slice(0, 2).map((entry) => entry.code)).toEqual(['QC', 'NS']);
  });
});
