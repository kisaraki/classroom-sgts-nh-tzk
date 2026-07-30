import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIRECTORY, "../..");
const SERVER_SCRIPT = path.join(PROJECT_ROOT, "scripts/serve.mjs");
const BRAND = "KOSMOS TOOLKIT｜探真拓知酷";

const startServer = () =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SERVER_SCRIPT], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        SGTS_HOST: "127.0.0.1",
        SGTS_PORT: "0"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stderr = "";

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      reject(
        new Error(
          `Static server exited before startup with code ${code}: ${stderr}`
        )
      );
    });
    child.stdout.setEncoding("utf8");
    child.stdout.once("data", (chunk) => {
      const match = chunk.match(/http:\/\/127\.0\.0\.1:(\d+)\//);

      if (!match) {
        child.kill("SIGTERM");
        reject(new Error(`Unexpected server output: ${chunk}`));
        return;
      }

      resolve({
        baseUrl: `http://127.0.0.1:${match[1]}`,
        child
      });
    });
  });

test("static server supports root and GitHub Pages subpath", async (context) => {
  const { baseUrl, child } = await startServer();
  context.after(() => child.kill("SIGTERM"));

  for (const pathname of ["/", "/classroom-sgts-nh-tzk/"]) {
    const response = await fetch(`${baseUrl}${pathname}`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    assert.match(html, new RegExp(BRAND, "u"));
  }

  const moduleResponse = await fetch(
    `${baseUrl}/classroom-sgts-nh-tzk/js/app.js`
  );
  assert.equal(moduleResponse.status, 200);
  assert.match(
    moduleResponse.headers.get("content-type") ?? "",
    /text\/javascript/
  );

  const mapResponse = await fetch(
    `${baseUrl}/classroom-sgts-nh-tzk/assets/maps/northwest-pacific.json`
  );
  const mapData = await mapResponse.json();
  assert.equal(mapResponse.status, 200);
  assert.match(
    mapResponse.headers.get("content-type") ?? "",
    /application\/json/
  );
  assert.equal(mapData.metadata.formatVersion, "sgts-map-1");

  const steeringResponse = await fetch(
    `${baseUrl}/classroom-sgts-nh-tzk/js/simulation/SteeringModel.js`
  );
  assert.equal(steeringResponse.status, 200);
  assert.match(
    steeringResponse.headers.get("content-type") ?? "",
    /text\/javascript/
  );

  for (const modulePath of [
    "js/model/WeatherStation.js",
    "js/simulation/LandInteractionModel.js",
    "js/simulation/OceanCoolingModel.js",
    "js/simulation/RainfallModel.js",
    "js/simulation/ObservationModel.js"
  ]) {
    const response = await fetch(
      `${baseUrl}/classroom-sgts-nh-tzk/${modulePath}`
    );
    assert.equal(response.status, 200, modulePath);
    assert.match(
      response.headers.get("content-type") ?? "",
      /text\/javascript/,
      modulePath
    );
  }

  const missingResponse = await fetch(`${baseUrl}/missing-resource.json`);
  assert.equal(missingResponse.status, 404);
});
