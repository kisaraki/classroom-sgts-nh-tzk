import { execFile } from "node:child_process";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const OUTPUT_DIRECTORY = path.join(PROJECT_ROOT, "dist");
const STATIC_ENTRIES = Object.freeze([
  "assets",
  "css",
  "index.html",
  "js",
  "LICENSE"
]);
const execFileAsync = promisify(execFile);

await rm(OUTPUT_DIRECTORY, { force: true, recursive: true });
await mkdir(OUTPUT_DIRECTORY, { recursive: true });

for (const entry of STATIC_ENTRIES) {
  await cp(
    path.join(PROJECT_ROOT, entry),
    path.join(OUTPUT_DIRECTORY, entry),
    { recursive: true }
  );
}

const removeAppleDouble = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.name.startsWith("._")) {
      await rm(entryPath, { force: true, recursive: true });
    } else if (entry.isDirectory()) {
      await removeAppleDouble(entryPath);
    }
  }
};

const explicitCommit = process.env.SGTS_BUILD_COMMIT;
let buildCommit = explicitCommit;

if (!buildCommit) {
  const { stdout } = await execFileAsync(
    "git",
    ["rev-parse", "--short=12", "HEAD"],
    { cwd: PROJECT_ROOT }
  );
  const status = await execFileAsync(
    "git",
    ["status", "--porcelain", "--untracked-files=no"],
    { cwd: PROJECT_ROOT }
  );
  buildCommit = `${stdout.trim()}${status.stdout.trim() ? "-dirty" : ""}`;
}

if (!/^[0-9a-f]{7,40}(?:-dirty)?$/.test(buildCommit)) {
  throw new Error("SGTS_BUILD_COMMIT must be a Git commit hash.");
}

const builtConfigPath = path.join(OUTPUT_DIRECTORY, "js/config.js");
const builtConfig = await readFile(builtConfigPath, "utf8");
await writeFile(
  builtConfigPath,
  builtConfig.replace(
    'buildCommit: "local-development"',
    `buildCommit: "${buildCommit}"`
  )
);
await removeAppleDouble(OUTPUT_DIRECTORY);

process.stdout.write(
  `Built GitHub Pages artifact ${buildCommit} with ` +
    `${STATIC_ENTRIES.length} entries in dist/.\n`
);
