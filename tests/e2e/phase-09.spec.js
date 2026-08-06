import { expect, test } from "@playwright/test";

test("Phase 9 exposes performance profiles, diagnostics, and Canvas text", async ({
  page
}) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  await expect(page.locator("#map-data-status")).toContainText("地理區域");
  await page.locator(".display-settings summary").click();
  await page.locator("#particle-profile").selectOption("high");
  await expect(page.locator("#particle-readout")).toHaveText("高｜1200");
  await page.locator("#start-button").click();
  await expect
    .poll(async () =>
      Number(
        await page.locator("#timing-readout").getAttribute("data-median-fps")
      )
    )
    .toBeGreaterThan(0);
  await expect(page.locator("#fps-range-readout")).not.toHaveText("0 / 0");
  await expect(page.locator("#canvas-summary")).toContainText("風暴 KOSMOS-06");
  await expect(page.locator("#canvas-summary")).toContainText("中心氣壓");
  await expect(page.locator("#app-error")).toHaveAttribute("role", "alert");
});

test("reduced motion disables animated particles without disabling physics", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/classroom-sgts-nh-tzk/");
  await expect(page.locator("#particles-enabled")).toBeDisabled();
  await expect(page.locator("#particle-profile")).toBeDisabled();
  await expect(page.locator("#particle-readout")).toContainText("減少動態");
  await page.locator("#start-button").click();
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);
});

test("keyboard focus, labels, and non-color state text remain available", async ({
  page
}) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await expect(page.locator('label[for="particle-profile"]')).toContainText(
    "畫面粒子數量"
  );
  await expect(page.locator("[data-control-trend]").first()).toContainText(
    /[→↑↓]/u
  );
  await page.locator("#simulation-canvas").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#probe-coordinate")).toHaveText(
    "北緯 23.70°、東經 121.00°"
  );
});
