import assert from "node:assert/strict";
import test from "node:test";

import { PROJECT_CONFIG } from "../js/config.js";
import { ParticleRenderer } from "../js/rendering/ParticleRenderer.js";

test("particle renderer supports deterministic Phase 9 profile sizes", () => {
  const renderer = new ParticleRenderer({ count: 300 });

  assert.equal(renderer.count, 300);
  renderer.setCount(700);
  assert.equal(renderer.count, 700);
  renderer.setCount(1200);
  assert.equal(renderer.count, 1200);
  assert.throws(() => renderer.setCount(2001), /0 to 2000/);
});

test("particle renderer moves Northern Hemisphere circulation counterclockwise", () => {
  const values = [0, 0.5, 1, 1, 1];
  const random = {
    nextRange: () => values.shift()
  };
  const renderer = new ParticleRenderer({ count: 1, random });
  const createContext = () => ({
    arcs: [],
    arc(x, y) {
      this.arcs.push({ x, y });
    },
    beginPath() {},
    fill() {},
    restore() {},
    save() {}
  });
  const typhoon = {
    active: true,
    galeRadius: 110,
    lat: 20,
    lon: 130,
    structureStage: "spiral"
  };
  const shared = {
    bounds: { maxLat: 40, maxLon: 160, minLat: 0, minLon: 100 },
    height: 200,
    padding: { bottom: 0, left: 0, right: 0, top: 0 },
    typhoon,
    width: 300
  };
  const initialContext = createContext();
  const quarterTurnContext = createContext();
  const quarterTurnMinutes =
    Math.PI /
    2 /
    PROJECT_CONFIG.renderingConfig.particleAngularSpeed;

  renderer.draw({
    ...shared,
    context: initialContext,
    simulationMinutes: 0
  });
  renderer.draw({
    ...shared,
    context: quarterTurnContext,
    simulationMinutes: quarterTurnMinutes
  });

  assert.ok(initialContext.arcs[0].x > 150);
  assert.ok(Math.abs(initialContext.arcs[0].y - 100) < 1e-10);
  assert.ok(quarterTurnContext.arcs[0].y < 100);
});
