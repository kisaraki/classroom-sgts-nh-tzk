import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIRECTORY, "..");

test("Phase 1 test workflow is pinned and runs the local check command", async () => {
  const workflow = await readFile(
    path.join(PROJECT_ROOT, ".github/workflows/test.yml"),
    "utf8"
  );

  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /uses: actions\/checkout@v7/);
  assert.match(workflow, /uses: actions\/setup-node@v7/);
  assert.match(workflow, /node-version-file: \.node-version/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.match(workflow, /run: npm run check/);
});

test("Phase 9 Pages workflow gates deployment on tests and a narrow artifact", async () => {
  const workflow = await readFile(
    path.join(PROJECT_ROOT, ".github/workflows/pages.yml"),
    "utf8"
  );

  assert.match(workflow, /uses: actions\/checkout@v7/);
  assert.match(workflow, /uses: actions\/setup-node@v7/);
  assert.match(workflow, /run: npm run check/);
  assert.match(workflow, /uses: actions\/configure-pages@v6/);
  assert.match(workflow, /uses: actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /path: dist/);
  assert.match(workflow, /needs: build/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /uses: actions\/deploy-pages@v5/);
});
