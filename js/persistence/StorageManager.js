import {
  DEFAULT_SANDBOX_PRESET,
  validateSandboxPreset
} from "../data/sandbox.js";
import {
  ValidationError,
  assertExactObjectKeys,
  assertFiniteNumber
} from "../utils/validation.js";

export const STORAGE_KEY = "sgts-nh:progress";
export const STORAGE_VERSION = 1;
const STORAGE_FIELDS = Object.freeze([
  "bestScores",
  "lastSandboxPreset",
  "settings",
  "tutorialCompleted",
  "unlockedLevels",
  "version"
]);
const SETTING_FIELDS = Object.freeze([
  "environmentLayer",
  "particlesEnabled",
  "speed",
  "targetsLayer",
  "trackLayer"
]);

export const DEFAULT_SETTINGS = Object.freeze({
  environmentLayer: true,
  particlesEnabled: true,
  speed: 1,
  targetsLayer: true,
  trackLayer: true
});

export const createDefaultStorageRecord = () => ({
  bestScores: {},
  lastSandboxPreset: { ...DEFAULT_SANDBOX_PRESET },
  settings: { ...DEFAULT_SETTINGS },
  tutorialCompleted: false,
  unlockedLevels: [],
  version: STORAGE_VERSION
});

const validateSettings = (settings) => {
  assertExactObjectKeys(settings, SETTING_FIELDS, "settings");

  for (const name of [
    "environmentLayer",
    "particlesEnabled",
    "targetsLayer",
    "trackLayer"
  ]) {
    if (typeof settings[name] !== "boolean") {
      throw new ValidationError(`settings.${name} must be boolean.`);
    }
  }

  if (![1, 4, 12, 24].includes(settings.speed)) {
    throw new ValidationError("settings.speed is unsupported.");
  }

  return { ...settings };
};

export const validateStorageRecord = (input) => {
  assertExactObjectKeys(input, STORAGE_FIELDS, "storage");

  if (input.version !== STORAGE_VERSION) {
    throw new ValidationError("storage.version is unsupported.");
  }

  if (
    !Array.isArray(input.unlockedLevels) ||
    input.unlockedLevels.length > 32 ||
    input.unlockedLevels.some(
      (id) => typeof id !== "string" || id.length > 64
    ) ||
    new Set(input.unlockedLevels).size !== input.unlockedLevels.length
  ) {
    throw new ValidationError("unlockedLevels is invalid.");
  }

  if (
    input.bestScores === null ||
    typeof input.bestScores !== "object" ||
    Array.isArray(input.bestScores) ||
    Object.getPrototypeOf(input.bestScores) !== Object.prototype
  ) {
    throw new ValidationError("bestScores must be a plain object.");
  }

  for (const [id, score] of Object.entries(input.bestScores)) {
    if (!/^[a-z0-9-]{1,64}$/u.test(id)) {
      throw new ValidationError("bestScores contains an invalid level id.");
    }
    assertFiniteNumber(score, `bestScores.${id}`);
    if (score < 0) {
      throw new ValidationError("bestScores cannot contain negative values.");
    }
  }

  if (typeof input.tutorialCompleted !== "boolean") {
    throw new ValidationError("tutorialCompleted must be boolean.");
  }

  return Object.freeze({
    bestScores: Object.freeze({ ...input.bestScores }),
    lastSandboxPreset: validateSandboxPreset(input.lastSandboxPreset),
    settings: Object.freeze(validateSettings(input.settings)),
    tutorialCompleted: input.tutorialCompleted,
    unlockedLevels: Object.freeze([...input.unlockedLevels]),
    version: STORAGE_VERSION
  });
};

export const migrateStorageRecord = (input) => {
  if (input?.version === STORAGE_VERSION) {
    return validateStorageRecord(input);
  }

  throw new ValidationError("No migration is available for this storage version.");
};

export class StorageManager {
  #key;
  #storage;

  constructor(storage, { key = STORAGE_KEY } = {}) {
    if (
      !storage ||
      typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function"
    ) {
      throw new TypeError("StorageManager requires a Storage-compatible object.");
    }

    this.#storage = storage;
    this.#key = key;
  }

  load() {
    try {
      const text = this.#storage.getItem(this.#key);

      if (text === null) {
        return this.save(createDefaultStorageRecord());
      }

      return migrateStorageRecord(JSON.parse(text));
    } catch {
      try {
        this.#storage.removeItem?.(this.#key);
      } catch {
        // Storage can be unavailable in privacy modes; defaults remain usable.
      }
      return Object.freeze(createDefaultStorageRecord());
    }
  }

  save(record) {
    const validated = validateStorageRecord(record);
    this.#storage.setItem(this.#key, JSON.stringify(validated));
    return validated;
  }
}
