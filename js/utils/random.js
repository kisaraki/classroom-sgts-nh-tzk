export const PRNG_ALGORITHM = "mulberry32";
export const PRNG_VERSION = "mulberry32-v1";
export const RANDOM_STREAM_NAMES = Object.freeze([
  "intensity",
  "steering",
  "environment",
  "visual"
]);

const UINT32_RANGE = 0x1_0000_0000;
const FINGERPRINT_DECIMAL_PLACES = 8;

export const hashStringToUint32 = (value) => {
  const text = String(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

export const deriveSeed = (seed, streamName) =>
  hashStringToUint32(`${PRNG_VERSION}:${String(seed)}:${streamName}`);

export class SeededRandom {
  #initialState;
  #state;

  constructor(seed) {
    const normalizedSeed =
      typeof seed === "number" && Number.isFinite(seed)
        ? seed >>> 0
        : hashStringToUint32(seed);
    this.#initialState = normalizedSeed;
    this.#state = normalizedSeed;
  }

  get algorithm() {
    return PRNG_ALGORITHM;
  }

  get version() {
    return PRNG_VERSION;
  }

  nextFloat() {
    return this.nextUint32() / UINT32_RANGE;
  }

  nextRange(minimum, maximum) {
    if (
      !Number.isFinite(minimum) ||
      !Number.isFinite(maximum) ||
      maximum < minimum
    ) {
      throw new TypeError("Random range must contain finite ascending bounds.");
    }

    return minimum + (maximum - minimum) * this.nextFloat();
  }

  nextUint32() {
    this.#state = (this.#state + 0x6d2b79f5) >>> 0;
    let value = this.#state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  }

  reset() {
    this.#state = this.#initialState;
  }

  snapshot() {
    return Object.freeze({
      algorithm: PRNG_ALGORITHM,
      initialState: this.#initialState,
      state: this.#state,
      version: PRNG_VERSION
    });
  }
}

export const createRandomStreams = (seed) =>
  Object.freeze(
    Object.fromEntries(
      RANDOM_STREAM_NAMES.map((name) => [
        name,
        new SeededRandom(deriveSeed(seed, name))
      ])
    )
  );

const stableSerialize = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Number.isInteger(value)
      ? value
      : Number(value.toFixed(FINGERPRINT_DECIMAL_PLACES));
    return JSON.stringify(Object.is(normalized, -0) ? 0 : normalized);
  }

  return JSON.stringify(value);
};

export const createFingerprint = (value) =>
  hashStringToUint32(stableSerialize(value)).toString(16).padStart(8, "0");
