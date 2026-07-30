import { expect, test } from "@playwright/test";

test("application controls fixed-step simulation and pauses cleanly", async ({
  page
}) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("./");
  await expect(page.locator("#engine-state")).toHaveText("MENU");
  await expect(page.locator("#simulation-canvas")).toBeVisible();

  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();
  await expect(page.locator("#engine-state")).toHaveText("RUNNING");
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);

  await page.locator("#pause-button").click();
  await expect(page.locator("#engine-state")).toHaveText("PAUSED");
  const pausedStep = await page.locator("#step-count").textContent();
  await page.waitForTimeout(350);
  await expect(page.locator("#step-count")).toHaveText(pausedStep);
  expect(consoleErrors).toEqual([]);
});

test("responsive layouts retain controls and narrow-screen guidance", async ({
  page
}) => {
  await page.setViewportSize({ height: 768, width: 1024 });
  await page.goto("./");

  const tabletLayout = await page.evaluate(() => {
    const control = document.querySelector(".control-panel");
    const viewport = document.querySelector(".viewport-panel");

    return {
      clientWidth: document.documentElement.clientWidth,
      controlTop: control.getBoundingClientRect().top,
      scrollWidth: document.documentElement.scrollWidth,
      viewportTop: viewport.getBoundingClientRect().top
    };
  });

  expect(tabletLayout.scrollWidth).toBe(tabletLayout.clientWidth);
  expect(tabletLayout.controlTop).toBeGreaterThan(tabletLayout.viewportTop);

  await page.setViewportSize({ height: 844, width: 390 });

  await expect(page.locator(".narrow-screen-hint")).toBeVisible();
  await expect(page.locator("#start-button")).toBeVisible();
  await expect(page.locator("#simulation-canvas")).toBeVisible();

  const buttonHeight = await page
    .locator("#start-button")
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(buttonHeight).toBeGreaterThanOrEqual(44);
});

test("standalone browser harness passes from the Pages subpath", async ({
  page
}) => {
  await page.goto("./tests/engine-tests.html");
  await expect(page.locator("html")).toHaveAttribute(
    "data-test-status",
    "passed"
  );
  await expect(page.locator("#test-summary")).toHaveText("3/3 tests passed");
});
