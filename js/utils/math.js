import {
  assertFiniteNumber,
  assertPositiveNumber
} from "./validation.js";

export const clamp = (value, minimum, maximum) => {
  assertFiniteNumber(value, "value");
  assertFiniteNumber(minimum, "minimum");
  assertFiniteNumber(maximum, "maximum");

  if (minimum > maximum) {
    throw new RangeError("minimum must not exceed maximum.");
  }

  return Math.min(Math.max(value, minimum), maximum);
};

export const lerp = (start, end, amount) => {
  assertFiniteNumber(start, "start");
  assertFiniteNumber(end, "end");
  assertFiniteNumber(amount, "amount");

  return start + (end - start) * amount;
};

export const smoothstep = (edge0, edge1, value) => {
  assertFiniteNumber(edge0, "edge0");
  assertFiniteNumber(edge1, "edge1");
  assertFiniteNumber(value, "value");

  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

export const safeRatio = (numerator, denominator, fallback = 0) => {
  assertFiniteNumber(numerator, "numerator");
  assertFiniteNumber(denominator, "denominator");
  assertFiniteNumber(fallback, "fallback");

  return denominator === 0 ? fallback : numerator / denominator;
};

export const positiveModulo = (value, divisor) => {
  assertFiniteNumber(value, "value");
  assertPositiveNumber(divisor, "divisor");

  return ((value % divisor) + divisor) % divisor;
};
