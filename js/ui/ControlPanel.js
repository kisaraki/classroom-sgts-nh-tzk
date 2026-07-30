import { PROJECT_CONFIG } from "../config.js";
import { Environment } from "../model/Environment.js";

const TREND_LABELS = Object.freeze({
  "-1": "↓ 下降",
  "0": "→ 穩定",
  "1": "↑ 上升"
});

export const formatControlValue = (name, value) => {
  const definition = PROJECT_CONFIG.environmentControls[name];

  if (!definition) {
    throw new TypeError(`Unknown environment control: ${name}.`);
  }

  if (definition.unit === "%") {
    return `${(value * 100).toFixed(0)}%`;
  }

  return `${value.toFixed(definition.step < 1 ? 1 : 0)} ${definition.unit}`;
};

export const describeControlTrend = (trend) =>
  TREND_LABELS[String(Math.sign(trend))];

export class ControlPanel {
  #environment;
  #onControlChange;
  #onError;
  #records;

  constructor(
    root,
    {
      allowedControls = Object.keys(PROJECT_CONFIG.environmentControls),
      environment,
      onControlChange = () => {},
      onError = () => {}
    }
  ) {
    if (!root || typeof root.querySelectorAll !== "function") {
      throw new TypeError("ControlPanel requires a DOM root.");
    }

    if (!(environment instanceof Environment)) {
      throw new TypeError("ControlPanel requires an Environment.");
    }

    if (
      typeof onError !== "function" ||
      typeof onControlChange !== "function"
    ) {
      throw new TypeError("ControlPanel callbacks must be functions.");
    }

    this.#environment = environment;
    this.#onControlChange = onControlChange;
    this.#onError = onError;
    const inputs = [...root.querySelectorAll("[data-environment-control]")];
    const expectedCount = Object.keys(PROJECT_CONFIG.environmentControls).length;

    if (inputs.length !== expectedCount) {
      throw new Error(
        `Environment controls are incomplete: ${inputs.length}/${expectedCount}.`
      );
    }

    this.#records = inputs.map((input) => {
      const name = input.dataset.environmentControl;
      const definition = PROJECT_CONFIG.environmentControls[name];

      if (!definition) {
        throw new Error(`Unknown environment control element: ${name}.`);
      }

      const container = input.closest("[data-control-name]");
      const actual = container?.querySelector("[data-control-actual]");
      const target = container?.querySelector("[data-control-target]");
      const trend = container?.querySelector("[data-control-trend]");

      if (!container || !actual || !target || !trend) {
        throw new Error(`Environment control ${name} is incomplete.`);
      }

      input.min = String(definition.minimum);
      input.max = String(definition.maximum);
      input.step = String(definition.step);
      const listener = () => {
        try {
          const value = Number(input.value);
          this.#environment.setTargetControl(name, value);
          this.#onControlChange({ control: name, value });
          this.render();
        } catch (error) {
          this.#onError(error);
        }
      };
      input.addEventListener("input", listener);

      return { actual, input, listener, name, target, trend };
    });

    this.setAllowedControls(allowedControls);
    this.render({ syncInputs: true });
  }

  setEnvironment(environment) {
    if (!(environment instanceof Environment)) {
      throw new TypeError("ControlPanel requires an Environment.");
    }

    this.#environment = environment;
    this.render({ syncInputs: true });
  }

  setAllowedControls(allowedControls) {
    if (!Array.isArray(allowedControls)) {
      throw new TypeError("allowedControls must be an array.");
    }

    const allowed = new Set(allowedControls);

    for (const record of this.#records) {
      const isAllowed = allowed.has(record.name);
      record.input.disabled = !isAllowed;
      record.input.closest("[data-control-name]")?.setAttribute(
        "data-control-allowed",
        String(isAllowed)
      );
    }
  }

  render({ syncInputs = false } = {}) {
    for (const record of this.#records) {
      const state = this.#environment.getControlState(record.name);

      if (syncInputs) {
        record.input.value = String(state.target);
      }

      record.actual.textContent = formatControlValue(
        record.name,
        state.actual
      );
      record.target.textContent = formatControlValue(
        record.name,
        state.target
      );
      record.trend.textContent =
        `${describeControlTrend(state.trend)} · τ ${state.responseHours}h`;
      record.trend.dataset.trend = String(state.trend);
    }
  }

  destroy() {
    for (const { input, listener } of this.#records) {
      input.removeEventListener("input", listener);
    }
  }
}
