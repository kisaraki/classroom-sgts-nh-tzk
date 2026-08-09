import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const DIST = path.join(PROJECT_ROOT, "dist");
const listFiles = async (directory) => {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }

  return files;
};

test("Pages artifact contains only the intentional static runtime surface", async () => {
  assert.deepEqual(
    (await readdir(DIST)).sort(),
    ["LICENSE", "assets", "css", "index.html", "js"]
  );
  await access(path.join(DIST, "assets/maps/northwest-pacific.json"));
  const terrainPath = path.join(
    DIST,
    "assets/maps/northwest-pacific-terrain-v1.webp"
  );
  const terrainMetadataPath = path.join(
    DIST,
    "assets/maps/northwest-pacific-terrain-v1.json"
  );
  await access(terrainPath);
  await access(terrainMetadataPath);
  await access(path.join(DIST, "js/app.js"));
  await access(path.join(DIST, "js/rendering/MapCamera.js"));
  await access(path.join(DIST, "js/ui/MapInteractionController.js"));
  await access(path.join(DIST, "js/ui/StationMapOverlay.js"));
  await access(path.join(DIST, "css/accessibility.css"));
  const html = await readFile(path.join(DIST, "index.html"), "utf8");
  const config = await readFile(path.join(DIST, "js/config.js"), "utf8");
  const terrain = await readFile(terrainPath);
  const terrainMetadata = JSON.parse(
    await readFile(terrainMetadataPath, "utf8")
  );
  const files = await listFiles(DIST);
  assert.match(html, /src="\.\/js\/app\.js"/);
  assert.match(html, /id="station-observations"/);
  assert.match(html, /id="map-zoom-in"/);
  assert.match(html, /id="map-view-reset"/);
  assert.doesNotMatch(html, /id="map-probe"|id="probe-/);
  assert.doesNotMatch(html, /點選或觸控地圖以查詢/);
  assert.doesNotMatch(html, /node_modules|tests\/|SGTS-NH_MASTER_SPEC/);
  assert.equal(
    files.some((file) => path.basename(file).startsWith("._")),
    false
  );
  assert.doesNotMatch(config, /local-development/);
  assert.match(config, /buildCommit: "[0-9a-f]{7,40}(?:-dirty)?"/);
  assert.equal(terrainMetadata.dimensions.width, 2400);
  assert.equal(terrainMetadata.dimensions.height, 1600);
  assert.equal(terrainMetadata.license.name, "Public domain");
  assert.equal(
    createHash("sha256").update(terrain).digest("hex"),
    terrainMetadata.sha256
  );
});
