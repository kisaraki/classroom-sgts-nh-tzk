import assert from "node:assert/strict";
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
  await access(path.join(DIST, "js/app.js"));
  await access(path.join(DIST, "css/accessibility.css"));
  const html = await readFile(path.join(DIST, "index.html"), "utf8");
  const config = await readFile(path.join(DIST, "js/config.js"), "utf8");
  const files = await listFiles(DIST);
  assert.match(html, /src="\.\/js\/app\.js"/);
  assert.doesNotMatch(html, /node_modules|tests\/|SGTS-NH_MASTER_SPEC/);
  assert.equal(
    files.some((file) => path.basename(file).startsWith("._")),
    false
  );
  assert.doesNotMatch(config, /local-development/);
  assert.match(config, /buildCommit: "[0-9a-f]{7,40}(?:-dirty)?"/);
});
