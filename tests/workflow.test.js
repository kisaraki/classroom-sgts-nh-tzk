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
