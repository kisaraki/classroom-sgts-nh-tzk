import { expect, test } from "@playwright/test";

test("sandbox applies validated settings, has no win/loss, and restores preferences", async ({
  page
}) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  const levelSelect = page.locator("#level-select");
  await levelSelect.selectOption("sandbox");
  await expect(page.locator("#sandbox-settings")).toBeVisible();
  await expect(page.locator("#level-dashboard")).toContainText(
    "SANDBOX · NO WIN / LOSS"
  );
  await expect(page.locator("#level-dashboard")).toContainText("無勝敗");

  await page.locator('[data-sandbox-field="seed"]').fill("e2e-sandbox-seed");
  await page.locator('[data-sandbox-field="lat"]').fill("18.5");
  await page.locator('[data-sandbox-field="lon"]').fill("132.5");
  await page.locator('[data-sandbox-field="seaSurfaceTemperature"]').fill("30");
  await page.locator('[data-sandbox-field="oceanHeatContent"]').fill("0.9");
  await page.locator("#apply-sandbox-button").click();
  await expect(page.locator("#io-status")).toContainText("已驗證、儲存並套用");
  await expect(page.locator("#storm-position")).toHaveText(
    "18.50°N, 132.50°E"
  );

  await page.locator("#track-layer").uncheck();
  await page.locator('[data-speed="12"]').click();
  await page.reload();
  await expect(page.locator("#track-layer")).not.toBeChecked();
  await expect(page.locator('[data-speed="12"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(
    page.locator('[data-sandbox-field="seed"]')
  ).toHaveValue("e2e-sandbox-seed");

  await page.locator("#level-select").selectOption("sandbox");
  await page.locator("#start-button").click();
  await expect(page.locator("#engine-state")).toHaveText("RUNNING");
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);
  await expect(page.locator("#engine-state")).not.toHaveText(/VICTORY|FAILURE/u);
  await page.locator("#pause-button").click();
  await expect(page.locator("#engine-state")).toHaveText("PAUSED");
  await page.locator("#reset-button").click();
  await expect(page.locator("#engine-state")).toHaveText("MENU");
  await expect(page.locator("#step-count")).toHaveText("0");
  await page.locator("#level-select").selectOption("naha-storm");
  await expect(page.locator("#level-dashboard")).toContainText("那霸風雨");
  await expect(page.locator("#level-dashboard")).not.toContainText(
    "SANDBOX · NO WIN / LOSS"
  );
  await expect(page.locator("#storm-position")).toHaveText(
    "14.00°N, 145.00°E"
  );
});

test("CSV, simulation JSON, PNG, and safe JSON import work in Chrome", async ({
  page
}) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  await page.locator("#level-select").selectOption("sandbox");
  await page.locator("#start-button").click();
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);
  await page.locator("#pause-button").click();

  const csvDownloadPromise = page.waitForEvent("download");
  await page.locator('[data-export="csv"]').click();
  const csvDownload = await csvDownloadPromise;
  const csvStream = await csvDownload.createReadStream();
  let csv = "";
  for await (const chunk of csvStream) {
    csv += chunk.toString();
  }
  expect(csvDownload.suggestedFilename()).toMatch(/track\.csv$/u);
  expect(csv).toContain('"name","stepIndex","simulationMinutes"');

  const jsonDownloadPromise = page.waitForEvent("download");
  await page.locator('[data-export="simulation-json"]').click();
  const jsonDownload = await jsonDownloadPromise;
  const jsonStream = await jsonDownload.createReadStream();
  const chunks = [];
  for await (const chunk of jsonStream) {
    chunks.push(chunk);
  }
  const jsonBuffer = Buffer.concat(chunks);
  const parsed = JSON.parse(jsonBuffer.toString("utf8"));
  expect(parsed.exportType).toBe("simulation");
  expect(parsed.schemaVersion).toBe(1);
  expect(parsed.buildCommit).toBeTruthy();
  expect(parsed.operations).toBeInstanceOf(Array);

  const pngDownloadPromise = page.waitForEvent("download");
  await page.locator('[data-export="png"]').click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toMatch(/\.png$/u);

  await page.locator("#reset-button").click();
  await page.locator("#import-json").setInputFiles({
    buffer: jsonBuffer,
    mimeType: "application/json",
    name: "simulation.json"
  });
  await expect(page.locator("#io-status")).toContainText("模擬 JSON 已驗證");

  await page.locator("#import-json").setInputFiles({
    buffer: Buffer.from('{"__proto__":{"polluted":true}}'),
    mimeType: "application/json",
    name: "invalid.json"
  });
  await expect(page.locator("#io-status")).toContainText("匯入失敗");
  await expect(page.locator("#engine-state")).toHaveText("MENU");
});
