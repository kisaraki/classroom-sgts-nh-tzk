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
  await expect(page.locator("#engine-state")).toHaveAttribute("data-state-code", "MENU");
  await expect(page.locator("#simulation-canvas")).toBeVisible();
  await expect(page.locator("#map-data-status")).toContainText("地理區域");
  const positionBefore = await page.locator("#storm-position").textContent();

  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();
  await expect(page.locator("#engine-state")).toHaveAttribute("data-state-code", "RUNNING");
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);
  await expect(page.locator("#storm-wind")).not.toHaveText("每秒 15.0 公尺");
  await expect(page.locator("#storm-fingerprint")).toHaveText(/^[0-9a-f]{8}$/u);
  await expect(page.locator("#storm-position")).not.toHaveText(positionBefore);
  await expect(page.locator("#storm-motion")).toContainText("每小時");

  await page.locator("#pause-button").click();
  await expect(page.locator("#engine-state")).toHaveAttribute("data-state-code", "PAUSED");
  const pausedStep = await page.locator("#step-count").textContent();
  await page.waitForTimeout(350);
  await expect(page.locator("#step-count")).toHaveText(pausedStep);
  expect(consoleErrors).toEqual([]);
});

test("responsive layouts retain controls and narrow-screen guidance", async ({
  page
}) => {
  await page.setViewportSize({ height: 600, width: 1024 });
  await page.goto("./");

  const tabletLayout = await page.evaluate(() => {
    const control = document.querySelector(".control-panel");
    const diagnostics = document.querySelector(".diagnostics-panel");
    const viewport = document.querySelector(".viewport-panel");
    const controlBox = control.getBoundingClientRect();
    const diagnosticsBox = diagnostics.getBoundingClientRect();
    const viewportBox = viewport.getBoundingClientRect();

    return {
      clientWidth: document.documentElement.clientWidth,
      control: {
        bottom: controlBox.bottom,
        left: controlBox.left,
        right: controlBox.right,
        top: controlBox.top
      },
      diagnostics: {
        bottom: diagnosticsBox.bottom,
        left: diagnosticsBox.left,
        right: diagnosticsBox.right,
        top: diagnosticsBox.top
      },
      scrollWidth: document.documentElement.scrollWidth,
      viewport: {
        bottom: viewportBox.bottom,
        left: viewportBox.left,
        right: viewportBox.right,
        top: viewportBox.top
      }
    };
  });

  expect(tabletLayout.scrollWidth).toBe(tabletLayout.clientWidth);
  expect(tabletLayout.viewport.left).toBeCloseTo(tabletLayout.diagnostics.left, 0);
  expect(tabletLayout.viewport.right).toBeCloseTo(tabletLayout.control.right, 0);
  expect(tabletLayout.viewport.bottom).toBeLessThanOrEqual(tabletLayout.control.top);
  expect(tabletLayout.viewport.bottom).toBeLessThanOrEqual(tabletLayout.diagnostics.top);
  expect(tabletLayout.diagnostics.right).toBeLessThanOrEqual(tabletLayout.control.left);
  expect(tabletLayout.diagnostics.top).toBeCloseTo(tabletLayout.control.top, 0);
  expect(tabletLayout.diagnostics.bottom).toBeCloseTo(tabletLayout.control.bottom, 0);
  await expect(page.locator(".command-deck")).toBeVisible();

  const compactTabletDeck = await page.locator(".command-deck").evaluate(
    (deck) => {
      const buttons = [...deck.querySelectorAll(".control-stack button")];
      const boxes = buttons.map((button) => button.getBoundingClientRect());

      return {
        buttonHeights: boxes.map((box) => box.height),
        buttonTops: boxes.map((box) => box.top),
        height: deck.getBoundingClientRect().height
      };
    }
  );

  expect(compactTabletDeck.height).toBeLessThanOrEqual(145);
  expect(new Set(compactTabletDeck.buttonTops).size).toBe(1);
  expect(Math.min(...compactTabletDeck.buttonHeights)).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ height: 720, width: 1180 });

  const desktopLayout = await page.evaluate(() => {
    const deck = document.querySelector(".command-deck").getBoundingClientRect();
    const diagnostics = document.querySelector(".diagnostics-panel").getBoundingClientRect();
    const control = document.querySelector(".control-panel").getBoundingClientRect();
    const viewport = document.querySelector(".viewport-panel").getBoundingClientRect();

    return {
      control: { left: control.left, right: control.right, top: control.top },
      deckHeight: deck.height,
      diagnostics: { left: diagnostics.left, right: diagnostics.right, top: diagnostics.top },
      viewport: { bottom: viewport.bottom, left: viewport.left, right: viewport.right }
    };
  });

  expect(desktopLayout.deckHeight).toBeLessThanOrEqual(100);
  expect(desktopLayout.viewport.left).toBeCloseTo(desktopLayout.diagnostics.left, 0);
  expect(desktopLayout.viewport.right).toBeCloseTo(desktopLayout.control.right, 0);
  expect(desktopLayout.viewport.bottom).toBeLessThanOrEqual(desktopLayout.control.top);
  expect(desktopLayout.diagnostics.right).toBeLessThanOrEqual(desktopLayout.control.left);
  expect(desktopLayout.diagnostics.top).toBeCloseTo(desktopLayout.control.top, 0);

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
  await page.locator(".display-settings summary").click();
  await toggle.uncheck();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator("#storm-stage")).toHaveText("鬆散雲團");
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
    "2501 個網格 · 1° 間距"
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
  await expect(control.locator("[data-control-trend]")).toContainText(
    "反應時間 12 小時"
  );
});

test("six model stations use non-blocking glass cards on the map", async ({
  page
}) => {
  await page.goto("./");
  await expect(page.locator("#map-data-status")).toContainText("地理區域");
  await expect(page.locator("#map-probe, [id^='probe-']")).toHaveCount(0);
  await expect(
    page.locator(".canvas-frame > #station-observations .station-card")
  ).toHaveCount(6);
  const cardStyle = await page.locator(".station-card").first().evaluate(
    (card) => {
      const style = globalThis.getComputedStyle(card);
      return {
        backdrop: style.backdropFilter || style.webkitBackdropFilter,
        pointerEvents: style.pointerEvents
      };
    }
  );
  expect(cardStyle.backdrop).toContain("blur");
  expect(cardStyle.pointerEvents).toBe("none");
  for (const text of [
    "模擬更新時間",
    "與颱風中心距離",
    "持續風",
    "最大陣風",
    "當前雨率",
    "累積雨量",
    "地形修正"
  ]) {
    await expect(page.locator(".station-card").first()).toContainText(text);
  }

  for (let count = 0; count < 5; count += 1) {
    await page.locator("#map-zoom-in").click();
  }
  await expect(page.locator("#simulation-canvas")).toHaveAttribute(
    "data-map-zoom",
    "4.000000"
  );
  await expect(page.locator(".station-card:visible")).toHaveCount(6);
  await page.locator("#map-view-reset").click();

  await page.setViewportSize({ height: 844, width: 390 });
  await expect(page.locator("#station-observations")).toHaveAttribute(
    "data-layout",
    "compact"
  );
  const compactGeometry = await page.evaluate(() => {
    const frame = document.querySelector(".canvas-frame").getBoundingClientRect();
    const cards = [...document.querySelectorAll(".station-card")].map((card) => {
      const box = card.getBoundingClientRect();
      return {
        bottom: box.bottom,
        clipped:
          card.scrollHeight > card.clientHeight + 1 ||
          card.scrollWidth > card.clientWidth + 1,
        id: card.dataset.stationId,
        left: box.left,
        right: box.right,
        top: box.top
      };
    });
    const controls = document
      .querySelector(".map-controls")
      .getBoundingClientRect();
    const markerPoints = [
      ...document.querySelectorAll("[data-station-marker]")
    ].map((marker) => ({
      id: marker.dataset.stationMarker,
      x: frame.left + Number(marker.getAttribute("cx")),
      y: frame.top + Number(marker.getAttribute("cy"))
    }));
    const overlap = cards.some((first, firstIndex) =>
      cards.some(
        (second, secondIndex) =>
          secondIndex > firstIndex &&
          first.left < second.right &&
          first.right > second.left &&
          first.top < second.bottom &&
          first.bottom > second.top
      )
    );
    const controlsOverlap = cards.some(
      (card) =>
        card.left < controls.right &&
        card.right > controls.left &&
        card.top < controls.bottom &&
        card.bottom > controls.top
    );
    const coveredMarkers = markerPoints.flatMap((point) =>
      cards
        .filter(
          (card) =>
            point.x > card.left &&
            point.x < card.right &&
            point.y > card.top &&
            point.y < card.bottom
        )
        .map((card) => `${point.id}:${card.id}`)
    );
    return {
      cards,
      clientWidth: document.documentElement.clientWidth,
      controlsOverlap,
      frame: {
        bottom: frame.bottom,
        left: frame.left,
        right: frame.right,
        top: frame.top
      },
      coveredMarkers,
      overlap,
      scrollWidth: document.documentElement.scrollWidth
    };
  });
  expect(compactGeometry.overlap).toBe(false);
  expect(compactGeometry.controlsOverlap).toBe(false);
  expect(compactGeometry.coveredMarkers).toEqual([]);
  expect(compactGeometry.scrollWidth).toBe(compactGeometry.clientWidth);
  for (const card of compactGeometry.cards) {
    expect(card.clipped).toBe(false);
    expect(card.left).toBeGreaterThanOrEqual(compactGeometry.frame.left);
    expect(card.right).toBeLessThanOrEqual(compactGeometry.frame.right);
    expect(card.top).toBeGreaterThanOrEqual(compactGeometry.frame.top);
    expect(card.bottom).toBeLessThanOrEqual(compactGeometry.frame.bottom);
  }
});

test("cold wake and six model stations update, then reset completely", async ({
  page
}) => {
  await page.goto("./");
  await expect(page.locator("#station-observations article")).toHaveCount(6);
  await expect(page.locator("#center-cold-wake")).toContainText("攝氏 0.00 度");

  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(8);
  await expect(page.locator("#center-cold-wake")).not.toContainText("攝氏 0.00 度");
  await expect(
    page.locator('[data-station-rain="hualien"]')
  ).toContainText("累積");
  await expect(
    page.locator('[data-station-wind="hualien"]')
  ).toContainText("陣風");

  await page.locator("#reset-button").click();
  await expect(page.locator("#engine-state")).toHaveAttribute("data-state-code", "MENU");
  await expect(page.locator("#step-count")).toHaveText("0");
  await expect(page.locator("#center-cold-wake")).toContainText("攝氏 0.00 度");
  await expect(page.locator("#surface-events")).toHaveText("尚無海陸轉換");

  for (const row of await page
    .locator("#station-observations article")
    .all()) {
    await expect(row).toContainText("累積雨量");
    await expect(row).toContainText("0.0 毫米");
  }
});

test("Naha objectives expose thresholds, progress, and time metadata", async ({
  page
}) => {
  await page.goto("./");

  await expect(page.locator("#level-dashboard")).toContainText("那霸風雨");
  await expect(page.locator("#level-dashboard")).toContainText("2018 潭美");
  await expect(page.locator("[data-level-remaining]")).toHaveText("168 小時 00 分鐘");
  await expect(page.locator(".objective-list > li")).toHaveCount(4);
  await expect(
    page.locator('[data-objective-id="naha-proximity"]')
  ).toHaveAttribute("data-status", "pending");
  await expect(page.locator("#tutorial-panel")).toContainText(
    "先觀察太平洋副熱帶高壓"
  );
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
    .fill("0.9");
  await page
    .locator(
      '[data-control-name="subtropicalHighWestwardExtent"] [data-environment-control]'
    )
    .fill("121");
  await page
    .locator(
      '[data-control-name="southwestMonsoonIntensity"] [data-environment-control]'
    )
    .fill("0.8");
  await page
    .locator(
      '[data-control-name="southwestMonsoonMoisture"] [data-environment-control]'
    )
    .fill("0.95");
  await page.locator("[data-speed='24']").click();
  await page.locator("#start-button").click();

  await expect
    .poll(async () => page.locator("#engine-state").getAttribute("data-state-code"), {
      timeout: 45_000
    })
    .toBe("VICTORY");
  await expect(page.locator("#step-count")).toHaveText("751");
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-dialog")).toHaveAttribute(
    "data-outcome",
    "victory"
  );
  await expect(page.locator("[data-result-score]")).toHaveText("5539 / 6250");
  await expect(
    page.locator('.objective-list > li[data-status="completed"]')
  ).toHaveCount(4);
  const settledStep = await page.locator("#step-count").textContent();
  await page.waitForTimeout(350);
  await expect(page.locator("#step-count")).toHaveText(settledStep);

  await page.locator("[data-result-restart]").click();
  await expect(page.locator("#engine-state")).toHaveAttribute("data-state-code", "MENU");
  await expect(page.locator("#step-count")).toHaveText("0");
  await expect(page.locator("#result-dialog")).toBeHidden();
  await expect(
    page.locator('.objective-list > li[data-status="pending"]')
  ).toHaveCount(4);
  await expect(page.locator("#center-cold-wake")).toContainText("攝氏 0.00 度");

  for (const row of await page
    .locator("#station-observations article")
    .all()) {
    await expect(row).toContainText("累積雨量");
    await expect(row).toContainText("0.0 毫米");
  }

  expect(consoleErrors).toEqual([]);
});
