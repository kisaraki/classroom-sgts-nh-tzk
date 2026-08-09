import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PROJECT_CONFIG } from "../js/config.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIRECTORY, "..");
const BRAND = "KOSMOS TOOLKIT｜探真拓知酷";

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "SGTS-NH_MASTER_SPEC.md",
  "index.html",
  "js/app.js",
  "js/config.js",
  "docs/ARCHITECTURE.md",
  "docs/PHYSICS-MODEL.md",
  "docs/DATA-SCHEMA.md",
  "docs/TESTING.md",
  "docs/DEPLOYMENT.md",
  "docs/SOURCES.md",
  "docs/DECISIONS.md",
  "docs/PHASE-STATUS.md"
];

test("Phase 0 required files exist", async () => {
  await Promise.all(
    requiredFiles.map((file) => access(path.join(PROJECT_ROOT, file)))
  );
});

test("project identity is stable and frozen", () => {
  assert.equal(PROJECT_CONFIG.brand, BRAND);
  assert.equal(PROJECT_CONFIG.repository, "kisaraki/classroom-sgts-nh-tzk");
  assert.equal(
    PROJECT_CONFIG.pagesUrl,
    "https://kisaraki.github.io/classroom-sgts-nh-tzk/"
  );
  assert.equal(Object.isFrozen(PROJECT_CONFIG), true);
});

test("main specification is version 1.0.6", async () => {
  const specification = await readFile(
    path.join(PROJECT_ROOT, "SGTS-NH_MASTER_SPEC.md"),
    "utf8"
  );

  assert.match(specification, /\| 文件版本 \| 1\.0\.6 \|/);
  assert.match(specification, new RegExp(BRAND, "u"));
});

test("foundation page uses relative resources and required identity", async () => {
  const html = await readFile(path.join(PROJECT_ROOT, "index.html"), "utf8");

  assert.match(html, new RegExp(BRAND, "u"));
  assert.match(html, /Not for Forecasting/);
  assert.match(html, /不適用於真實天氣預報/);
  assert.doesNotMatch(html, /(?:href|src)=["']\/(?!\/)/);
  assert.match(html, /type="module" src="\.\/js\/app\.js"/);
  assert.match(html, /id="station-observations"/);
  assert.match(html, /id="map-zoom-in"/);
  assert.match(html, /id="map-view-reset"/);
  assert.doesNotMatch(html, /id="map-probe"|id="probe-/);
  assert.doesNotMatch(html, /點選或觸控地圖以查詢/);
});
