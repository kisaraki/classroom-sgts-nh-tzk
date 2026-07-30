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
  await expect(page.locator("#map-data-status")).toContainText("regions");

  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();
  await expect(page.locator("#engine-state")).toHaveText("RUNNING");
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);
  await expect(page.locator("#storm-wind")).not.toHaveText("15.0 m/s");
  await expect(page.locator("#storm-fingerprint")).toHaveText(/^[0-9a-f]{8}$/u);
  await expect(page.locator("#storm-position")).not.toHaveText(
    "15.00°N, 135.00°E"
  );
  await expect(page.locator("#storm-motion")).toContainText("km/h");

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
  await expect(page.locator("#test-summary")).toHaveText("6/6 tests passed");
});

test("particle control is explicitly visual-only and preserves the dashboard", async ({
  page
}) => {
  await page.goto("./");
  const toggle = page.locator("#particles-enabled");

  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator("#storm-stage")).toHaveText("cluster");
  await expect(page.locator('[data-factor="developmentPotential"]')).toHaveText(
    /%$/u
  );
  await expect(page.locator(".particle-toggle")).toContainText("不參與物理");
});

test("environment target changes are delayed and never directly move the storm", async ({
  page
}) => {
  await page.goto("./");
  await expect(page.locator("#environment-grid-status")).toHaveText(
    "2501 cells · 1°"
  );
  const control = page.locator(
    '[data-control-name="subtropicalHighIntensity"]'
  );
  const slider = control.locator("[data-environment-control]");
  const positionBefore = await page.locator("#storm-position").textContent();

  await slider.fill("1");
  await expect(control.locator("[data-control-target]")).toHaveText("100%");
  await expect(control.locator("[data-control-actual]")).toHaveText("72%");
  await expect(page.locator("#storm-position")).toHaveText(positionBefore);

  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();
  await expect
    .poll(async () => control.locator("[data-control-actual]").textContent())
    .not.toBe("72%");
  await expect(control.locator("[data-control-actual]")).not.toHaveText("100%");
  await expect(control.locator("[data-control-trend]")).toContainText("τ 12h");
});

test("map query identifies Taiwan and stays aligned after resize", async ({
  page
}) => {
  const selectCoordinate = async ({ lat, lon }) => {
    const canvas = page.locator("#simulation-canvas");
    const box = await canvas.boundingBox();
    const x = 38 + ((lon - 100) / 60) * (box.width - 38 - 12);
    const y = 14 + ((40 - lat) / 40) * (box.height - 14 - 26);

    await page.mouse.click(box.x + x, box.y + y);
  };

  await page.goto("./");
  await expect(page.locator("#map-data-status")).toContainText("regions");
  await selectCoordinate({ lat: 23.7, lon: 121 });
  await expect(page.locator("#probe-coordinate")).toHaveText(
    "23.70°N, 121.00°E"
  );
  await expect(page.locator("#probe-surface")).toContainText(
    "taiwan-main"
  );

  await page.setViewportSize({ height: 844, width: 390 });
  await selectCoordinate({ lat: 23.7, lon: 121 });
  await expect(page.locator("#probe-coordinate")).toHaveText(
    "23.70°N, 121.00°E"
  );
  await expect(page.locator("#probe-station")).toContainText("km");
});
