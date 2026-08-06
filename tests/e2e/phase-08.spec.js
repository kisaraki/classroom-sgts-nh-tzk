import { expect, test } from "@playwright/test";

test("sandbox applies validated settings, has no win/loss, and restores preferences", async ({
  page
}) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  const levelSelect = page.locator("#level-select");
  await levelSelect.selectOption("sandbox");
  await expect(page.locator("#sandbox-settings")).toBeVisible();
  await expect(page.locator("#level-dashboard")).toContainText(
    "自由實驗｜不設勝敗"
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
    "北緯 18.50°、東經 132.50°"
  );

  await page.locator(".display-settings summary").click();
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
  await expect(page.locator("#engine-state")).toHaveAttribute("data-state-code", "RUNNING");
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);
  await expect(page.locator("#engine-state")).not.toHaveAttribute("data-state-code", /VICTORY|FAILURE/u);
  await page.locator("#pause-button").click();
  await expect(page.locator("#engine-state")).toHaveAttribute("data-state-code", "PAUSED");
  await page.locator("#reset-button").click();
  await expect(page.locator("#engine-state")).toHaveAttribute("data-state-code", "MENU");
  await expect(page.locator("#step-count")).toHaveText("0");
  await page.locator("#level-select").selectOption("naha-storm");
  await expect(page.locator("#level-dashboard")).toContainText("那霸風雨");
  await expect(page.locator("#level-dashboard")).not.toContainText(
    "自由實驗｜不設勝敗"
  );
  await expect(page.locator("#storm-position")).toHaveText(
    "北緯 14.00°、東經 145.00°"
  );
});

test("weather data import and export stay outside the player-facing interface", async ({
  page
}) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  await expect(page.locator("[data-back-office='simulation-io']")).toBeHidden();
  await expect(page.locator("[data-export]").first()).toBeHidden();
  await expect(page.locator("#import-json")).toBeHidden();
  await expect(page.locator("[data-back-office='simulation-io']")).toHaveAttribute(
    "aria-hidden",
    "true"
  );
});
