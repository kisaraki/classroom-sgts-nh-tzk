import { PROJECT_CONFIG } from "../config.js";
import { assertExactObjectKeys } from "../utils/validation.js";
import { GridCell } from "./GridCell.js";

const freezeControl = (value = {}) => Object.freeze({ ...value });
const ENVIRONMENT_FIELDS = Object.freeze([
  "bounds",
  "cells",
  "controls",
  "gridResolution",
  "southwestMonsoon",
  "subtropicalHigh",
  "targetControls"
]);

export class Environment {
  constructor(input = {}) {
    assertExactObjectKeys(input, ENVIRONMENT_FIELDS, "Environment");
    const {
      bounds = PROJECT_CONFIG.geography.bounds,
      cells = [],
      controls = {},
      gridResolution = 1,
      southwestMonsoon = {},
      subtropicalHigh = {},
      targetControls = {}
    } = input;
    if (!Array.isArray(cells) || !cells.every((cell) => cell instanceof GridCell)) {
      throw new TypeError("Environment cells must be GridCell instances.");
    }

    if (!Number.isFinite(gridResolution) || gridResolution <= 0) {
      throw new TypeError("gridResolution must be a positive finite number.");
    }

    this.bounds = Object.freeze({ ...bounds });
    this.gridResolution = gridResolution;
    this.cells = Object.freeze([...cells]);
    this.subtropicalHigh = freezeControl(subtropicalHigh);
    this.southwestMonsoon = freezeControl(southwestMonsoon);
    this.controls = freezeControl(controls);
    this.targetControls = freezeControl(targetControls);
  }

  snapshot() {
    return Object.freeze({
      bounds: this.bounds,
      cells: Object.freeze(this.cells.map((cell) => cell.snapshot())),
      controls: this.controls,
      gridResolution: this.gridResolution,
      southwestMonsoon: this.southwestMonsoon,
      subtropicalHigh: this.subtropicalHigh,
      targetControls: this.targetControls
    });
  }
}
