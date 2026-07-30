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
  const positionBefore = await page.locator("#storm-position").textContent();

  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();
  await expect(page.locator("#engine-state")).toHaveText("RUNNING");
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);
  await expect(page.locator("#storm-wind")).not.toHaveText("15.0 m/s");
  await expect(page.locator("#storm-fingerprint")).toHaveText(/^[0-9a-f]{8}$/u);
  await expect(page.locator("#storm-position")).not.toHaveText(positionBefore);
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
  await expect(page.locator("#test-summary")).toHaveText("8/8 tests passed");
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
  await expect(control.locator("[data-control-actual]")).toHaveText("82%");
  await expect(page.locator("#storm-position")).toHaveText(positionBefore);

  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();
  await expect
    .poll(async () => control.locator("[data-control-actual]").textContent())
    .not.toBe("82%");
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

test("cold wake and six model stations update, then reset completely", async ({
  page
}) => {
  await page.goto("./");
  await expect(page.locator("#station-observations article")).toHaveCount(6);
  await expect(page.locator("#center-cold-wake")).toContainText("0.00 °C");

  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(8);
  await expect(page.locator("#center-cold-wake")).not.toContainText("0.00 °C");
  await expect(
    page.locator('[data-station-rain="hualien"]')
  ).toContainText("累積");
  await expect(
    page.locator('[data-station-wind="hualien"]')
  ).toContainText("陣風");

  await page.locator("#reset-button").click();
  await expect(page.locator("#engine-state")).toHaveText("MENU");
  await expect(page.locator("#step-count")).toHaveText("0");
  await expect(page.locator("#center-cold-wake")).toContainText("0.00 °C");
  await expect(page.locator("#surface-events")).toHaveText("尚無海陸轉換");

  for (const row of await page
    .locator("#station-observations article")
    .all()) {
    await expect(row).toContainText("累積 0.0 mm");
  }
});

test("Naha objectives expose thresholds, progress, and time metadata", async ({
  page
}) => {
  await page.goto("./");

  await expect(page.locator("#level-dashboard")).toContainText("那霸風雨");
  await expect(page.locator("#level-dashboard")).toContainText("2018 潭美");
  await expect(page.locator("[data-level-remaining]")).toHaveText("168h 00m");
  await expect(page.locator(".objective-list > li")).toHaveCount(4);
  await expect(
    page.locator('[data-objective-id="naha-proximity"]')
  ).toHaveAttribute("data-status", "pending");
  await expect(page.locator("#tutorial-panel")).toContainText("先觀察副高");
  await expect(page.locator("#result-dialog")).toBeHidden();
});

test("golden browser replay wins, settles once, and restarts cleanly", async ({
  page
}) => {
  test.setTimeout(60_000);
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("./");
  await page
    .locator('[data-control-name="verticalWindShear"] [data-environment-control]')
    .fill("4");
  await page
    .locator(
      '[data-control-name="subtropicalHighIntensity"] [data-environment-control]'
    )
    .fill("0.85");
  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();

  await expect
    .poll(async () => page.locator("#engine-state").textContent(), {
      timeout: 45_000
    })
    .toBe("VICTORY");
  await expect(page.locator("#step-count")).toHaveText("861");
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-dialog")).toHaveAttribute(
    "data-outcome",
    "victory"
  );
  await expect(page.locator("[data-result-score]")).toHaveText("5519 / 6250");
  await expect(
    page.locator('.objective-list > li[data-status="completed"]')
  ).toHaveCount(4);
  const settledStep = await page.locator("#step-count").textContent();
  await page.waitForTimeout(350);
  await expect(page.locator("#step-count")).toHaveText(settledStep);

  await page.locator("[data-result-restart]").click();
  await expect(page.locator("#engine-state")).toHaveText("MENU");
  await expect(page.locator("#step-count")).toHaveText("0");
  await expect(page.locator("#result-dialog")).toBeHidden();
  await expect(
    page.locator('.objective-list > li[data-status="pending"]')
  ).toHaveCount(4);
  await expect(page.locator("#center-cold-wake")).toContainText("0.00 °C");

  for (const row of await page
    .locator("#station-observations article")
    .all()) {
    await expect(row).toContainText("累積 0.0 mm");
  }

  expect(consoleErrors).toEqual([]);
});
