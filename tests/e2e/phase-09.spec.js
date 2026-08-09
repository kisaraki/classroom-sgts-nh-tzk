import { expect, test } from "@playwright/test";

test("internal telemetry remains testable without developer information in the player view", async ({
  page
}) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  await expect(page.locator("#map-data-status")).toContainText(
    "Natural Earth II 真實地形圖層"
  );
  const canvasExport = await page.locator("#simulation-canvas").evaluate(
    (canvas) =>
      new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve({ size: blob?.size ?? 0, type: blob?.type ?? "" });
        }, "image/png");
      })
  );
  expect(canvasExport.type).toBe("image/png");
  expect(canvasExport.size).toBeGreaterThan(1000);
  await page.locator(".display-settings summary").click();
  await page.locator("#particle-profile").selectOption("high");
  await expect(page.locator("#particle-readout")).toHaveText("高｜1200");
  await expect(page.locator("#runtime-telemetry")).toBeHidden();
  await expect(page.locator(".developer-diagnostics, .time-strip")).toHaveCount(0);
  await expect(page.locator("#storm-fingerprint")).toBeHidden();
  await expect(page.getByText("模擬驗證碼", { exact: true })).toHaveCount(0);
  await expect(page.getByText("效能診斷", { exact: true })).toHaveCount(0);
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

test("terrain image failure safely falls back without stopping simulation", async ({
  page
}) => {
  await page.route("**/northwest-pacific-terrain-v1.webp", (route) =>
    route.abort()
  );
  await page.goto("/classroom-sgts-nh-tzk/");
  await expect(page.locator("#map-data-status")).toContainText(
    "簡化地形（地形影像載入失敗）"
  );
  await expect(page.locator("#app-error")).toBeHidden();
  await page.locator("#start-button").click();
  await expect
    .poll(async () => Number(await page.locator("#step-count").textContent()))
    .toBeGreaterThan(0);
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

test("map wheel, drag, buttons, and keyboard change only the view camera", async ({
  page
}) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  const canvas = page.locator("#simulation-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const frame = await canvas.boundingBox();
  expect(frame).not.toBeNull();
  const fingerprint = await page.locator("#storm-fingerprint").textContent();
  const step = await page.locator("#step-count").textContent();

  await page.mouse.move(
    frame.x + frame.width * 0.5,
    frame.y + frame.height * 0.45
  );
  await page.mouse.wheel(0, -420);
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-map-zoom")))
    .toBeGreaterThan(1);

  const longitudeBeforeDrag = Number(
    await canvas.getAttribute("data-map-center-lon")
  );
  await page.mouse.down();
  await page.mouse.move(
    frame.x + frame.width * 0.5 + 80,
    frame.y + frame.height * 0.45 + 24,
    { steps: 4 }
  );
  await page.mouse.up();
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-map-center-lon")))
    .toBeLessThan(longitudeBeforeDrag);

  await page.locator("#map-view-reset").click();
  await expect(canvas).toHaveAttribute("data-map-zoom", "1.000000");
  await expect(canvas).toHaveAttribute("data-map-center-lon", "130.000000");
  await canvas.focus();
  await page.keyboard.press("+");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-map-zoom")))
    .toBeCloseTo(1.4, 5);
  await page.keyboard.press("Home");
  await expect(canvas).toHaveAttribute("data-map-zoom", "1.000000");

  await expect(page.locator("#step-count")).toHaveText(step);
  await expect(page.locator("#storm-fingerprint")).toHaveText(fingerprint);
  await expect(page.locator("#map-view-status")).toContainText("縮放 100%");
});

test("map accepts a two-point Chrome touch gesture", async ({ page }) => {
  await page.goto("/classroom-sgts-nh-tzk/");
  const canvas = page.locator("#simulation-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const frame = await canvas.boundingBox();
  expect(frame).not.toBeNull();
  const client = await page.context().newCDPSession(page);
  const center = {
    x: frame.x + frame.width * 0.5,
    y: frame.y + frame.height * 0.45
  };

  await client.send("Input.dispatchTouchEvent", {
    touchPoints: [
      { id: 1, x: center.x - 35, y: center.y },
      { id: 2, x: center.x + 35, y: center.y }
    ],
    type: "touchStart"
  });
  await client.send("Input.dispatchTouchEvent", {
    touchPoints: [
      { id: 1, x: center.x - 90, y: center.y + 20 },
      { id: 2, x: center.x + 90, y: center.y + 20 }
    ],
    type: "touchMove"
  });
  await client.send("Input.dispatchTouchEvent", {
    touchPoints: [],
    type: "touchEnd"
  });

  await expect
    .poll(async () => Number(await canvas.getAttribute("data-map-zoom")))
    .toBeGreaterThan(1.5);
  await expect(canvas).not.toHaveAttribute("data-map-dragging", "true");
});

test("idle rendering does not remeasure the map overlay every frame", async ({
  page
}) => {
  await page.addInitScript(() => {
    const original = globalThis.Element.prototype.getBoundingClientRect;
    globalThis.__mapRectCounts = {
      canvas: 0,
      cards: 0,
      controls: 0,
      overlay: 0
    };
    globalThis.Element.prototype.getBoundingClientRect = function (...args) {
      if (this.id === "simulation-canvas") {
        globalThis.__mapRectCounts.canvas += 1;
      } else if (this.id === "station-observations") {
        globalThis.__mapRectCounts.overlay += 1;
      } else if (this.classList?.contains("station-card")) {
        globalThis.__mapRectCounts.cards += 1;
      } else if (this.classList?.contains("map-controls")) {
        globalThis.__mapRectCounts.controls += 1;
      }
      return original.apply(this, args);
    };
  });
  await page.goto("/classroom-sgts-nh-tzk/");
  await expect(page.locator("#map-data-status")).toContainText(
    "Natural Earth II 真實地形圖層"
  );
  await page.evaluate(() => {
    for (const key of Object.keys(globalThis.__mapRectCounts)) {
      globalThis.__mapRectCounts[key] = 0;
    }
  });
  await page.waitForTimeout(500);
  const counts = await page.evaluate(() => ({ ...globalThis.__mapRectCounts }));

  expect(counts.cards).toBe(0);
  expect(counts.controls).toBe(0);
  expect(counts.overlay).toBe(0);
  expect(counts.canvas).toBeLessThanOrEqual(5);
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
  await page.keyboard.press("+");
  await expect(page.locator("#map-view-status")).toContainText("縮放 140%");
  await expect(page.locator("#map-zoom-in")).toHaveAttribute(
    "aria-label",
    "放大地圖"
  );
  await expect(page.locator("#map-zoom-out")).toHaveAttribute(
    "aria-label",
    "縮小地圖"
  );
  await expect(page.locator("#map-view-reset")).toHaveAttribute(
    "aria-label",
    "重設完整西北太平洋視角"
  );
  const card = page.locator('[data-station-id="taipei"]');
  await card.focus();
  await expect(card).toHaveAttribute(
    "aria-keyshortcuts",
    "ArrowUp ArrowDown ArrowLeft ArrowRight Home Escape"
  );
  const before = await card.boundingBox();
  const defaultRelativePosition = await card.evaluate((element) => {
    const cardRect = element.getBoundingClientRect();
    const frameRect = element.closest(".canvas-frame").getBoundingClientRect();
    return {
      x: cardRect.left - frameRect.left,
      y: cardRect.top - frameRect.top
    };
  });
  const zoomBeforeCardMove = await page
    .locator("#simulation-canvas")
    .getAttribute("data-map-zoom");
  await page.keyboard.press("ArrowRight");
  const after = await card.boundingBox();
  expect(after.x).toBeGreaterThan(before.x + 7);
  await page.keyboard.press("Shift+ArrowRight");
  const afterLargeStep = await card.boundingBox();
  expect(afterLargeStep.x).toBeGreaterThan(after.x + 31);
  await expect(card).toHaveAttribute("data-placement", "custom");
  await expect(page.locator("#simulation-canvas")).toHaveAttribute(
    "data-map-zoom",
    zoomBeforeCardMove
  );
  await page.keyboard.press("Home");
  await expect(card).toHaveAttribute("data-placement", "default");
  await expect(page.locator("[data-station-placement-status]")).toContainText(
    "臺北模型觀測卡已回到預設位置"
  );
  await expect
    .poll(async () =>
      card.evaluate((element, expected) => {
        const cardRect = element.getBoundingClientRect();
        const frameRect = element.closest(".canvas-frame").getBoundingClientRect();
        return Math.max(
          Math.abs(cardRect.left - frameRect.left - expected.x),
          Math.abs(cardRect.top - frameRect.top - expected.y)
        );
      }, defaultRelativePosition)
    )
    .toBeLessThan(1);
});
