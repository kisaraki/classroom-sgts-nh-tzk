import assert from "node:assert/strict";
import test from "node:test";

import { PROJECT_CONFIG } from "../js/config.js";
import { Typhoon } from "../js/model/Typhoon.js";
import {
  canvasCyclonicDirection,
  particleAngleAt,
  resolveTyphoonVisualMetrics
} from "../js/rendering/TyphoonVisuals.js";

const createTyphoon = (overrides = {}) =>
  new Typhoon({
    active: true,
    centralPressure: 970,
    eventHistory: [],
    galeRadius: 110,
    heading: 280,
    id: "visual-test",
    isOverLand: false,
    lat: 20,
    lon: 130,
    maxWind: 28,
    moisture: 0.78,
    name: "視覺測試",
    organization: 0.62,
    structureStage: "spiral",
    symmetry: 0.58,
    trackHistory: [],
    translationSpeed: 12,
    ...overrides
  });

test("visual storm size distinguishes lifecycle stages without changing physics", () => {
  const stages = [
    ["inactive", createTyphoon({ active: false, structureStage: "decaying" })],
    ["decaying", createTyphoon({ structureStage: "decaying" })],
    ["cluster", createTyphoon({ structureStage: "cluster" })],
    ["spiral", createTyphoon({ structureStage: "spiral" })],
    ["comma", createTyphoon({ structureStage: "comma" })],
    ["eye", createTyphoon({ structureStage: "eye" })]
  ];
  const radii = stages.map(([, typhoon]) =>
    resolveTyphoonVisualMetrics(typhoon).radius
  );

  assert.deepEqual([...radii].sort((first, second) => first - second), radii);
  assert.equal(new Set(radii).size, stages.length);

  for (const [, typhoon] of stages) {
    const before = typhoon.physicsSnapshot();
    const fingerprint = typhoon.fingerprint();

    resolveTyphoonVisualMetrics(typhoon);

    assert.deepEqual(typhoon.physicsSnapshot(), before);
    assert.equal(typhoon.fingerprint(), fingerprint);
  }
});

test("visual storm radius stays bounded and grows with physical gale radius", () => {
  const small = resolveTyphoonVisualMetrics(
    createTyphoon({ galeRadius: 45, structureStage: "spiral" })
  ).radius;
  const large = resolveTyphoonVisualMetrics(
    createTyphoon({ galeRadius: 420, structureStage: "spiral" })
  ).radius;
  const config = PROJECT_CONFIG.renderingConfig;

  assert.ok(small >= config.stormVisualMinimumPixelRadius);
  assert.ok(large <= config.stormVisualMaximumPixelRadius);
  assert.ok(large > small);
});

test("Northern Hemisphere Canvas rotation is counterclockwise", () => {
  const quarterTurnMinutes =
    Math.PI /
    2 /
    PROJECT_CONFIG.renderingConfig.particleAngularSpeed;
  const angle = particleAngleAt({
    angle: 0,
    lat: 20,
    simulationMinutes: quarterTurnMinutes,
    speedScale: 1
  });

  assert.equal(canvasCyclonicDirection(20), -1);
  assert.ok(Math.abs(angle + Math.PI / 2) < 1e-12);
  assert.ok(Math.sin(angle) < 0, "particle must move upward from map east");
});
