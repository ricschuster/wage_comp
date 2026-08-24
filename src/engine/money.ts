/**
 * Currency arithmetic helpers.
 *
 * Tax math accumulates many small products, so rounding has to be deliberate
 * and consistent rather than left to whatever the last operation produced.
 */

/** Rounds to whole cents, half away from zero. */
export function roundToCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`roundToCents expects a finite number, got ${amount}`);
  }

  const scaled = Math.abs(amount) * 100;
  // Binary representation can leave an exact half a hair below .5 (for example
  // 1.005 * 100 is 100.49999999999999). Nudge by a relative epsilon so those
  // round the way a person reading the decimal would expect.
  const rounded = Math.round(scaled + scaled * Number.EPSILON);
  const result = (Math.sign(amount) * rounded) / 100;

  // Normalise -0 so equality checks and formatting behave.
  return result === 0 ? 0 : result;
}

/**
 * Floors a value at zero.
 *
 * Non-refundable credits cannot push tax below zero, so they clamp here. This
 * is deliberately not used for Austrian SV-Rückerstattung, which is a genuine
 * negative tax and must be allowed to stay negative.
 */
export function clampToZero(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`clampToZero expects a finite number, got ${amount}`);
  }
  return amount > 0 ? amount : 0;
}

/**
 * Returns `amount` limited to `ceiling`.
 *
 * Used for contributory earnings subject to a maximum, which both the Canadian
 * payroll programs and the two Austrian social insurance regimes apply.
 */
export function capAt(amount: number, ceiling: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(ceiling)) {
    throw new RangeError(`capAt expects finite numbers, got ${amount} and ${ceiling}`);
  }
  if (ceiling < 0) {
    throw new RangeError(`capAt expects a non-negative ceiling, got ${ceiling}`);
  }
  return amount < ceiling ? amount : ceiling;
}
