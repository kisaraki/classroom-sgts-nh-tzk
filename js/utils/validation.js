export class ValidationError extends TypeError {
  constructor(message, details = {}) {
    super(message);
    this.name = "ValidationError";
    this.details = Object.freeze({ ...details });
  }
}

export const assertFiniteNumber = (value, name = "value") => {
  if (!Number.isFinite(value)) {
    throw new ValidationError(`${name} must be a finite number.`, {
      name,
      value
    });
  }

  return value;
};

export const assertInteger = (value, name = "value") => {
  assertFiniteNumber(value, name);

  if (!Number.isInteger(value)) {
    throw new ValidationError(`${name} must be an integer.`, {
      name,
      value
    });
  }

  return value;
};

export const assertPositiveNumber = (value, name = "value") => {
  assertFiniteNumber(value, name);

  if (value <= 0) {
    throw new ValidationError(`${name} must be greater than zero.`, {
      name,
      value
    });
  }

  return value;
};

export const assertNonNegativeNumber = (value, name = "value") => {
  assertFiniteNumber(value, name);

  if (value < 0) {
    throw new ValidationError(`${name} must not be negative.`, {
      name,
      value
    });
  }

  return value;
};

export const assertOneOf = (value, allowedValues, name = "value") => {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${name} must be one of: ${allowedValues.join(", ")}.`,
      {
        allowedValues: [...allowedValues],
        name,
        value
      }
    );
  }

  return value;
};

export const assertFunction = (value, name = "value") => {
  if (typeof value !== "function") {
    throw new ValidationError(`${name} must be a function.`, {
      name,
      type: typeof value
    });
  }

  return value;
};

export const assertExactObjectKeys = (
  value,
  allowedKeys,
  name = "value"
) => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    throw new ValidationError(`${name} must be a plain object.`, { name });
  }

  const unknownKeys = Object.keys(value).filter(
    (key) => !allowedKeys.includes(key)
  );

  if (unknownKeys.length > 0) {
    throw new ValidationError(
      `${name} contains unknown fields: ${unknownKeys.join(", ")}.`,
      { name, unknownKeys }
    );
  }

  return value;
};
