import { chromium } from "@playwright/test";

const baseURL =
  process.env.SGTS_PERF_URL ??
  "http://127.0.0.1:4173/classroom-sgts-nh-tzk/";
const durationMs = Number.parseInt(
  process.env.SGTS_PERF_DURATION_MS ?? "15000",
  10
);
const profiles = ["low", "medium", "high"];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];

try {
  for (const profile of profiles) {
    const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });
    await page.goto(baseURL);
    await page.locator("#start-button").waitFor({ state: "visible" });
    await page.waitForFunction(
      "() => document.querySelector('#map-data-status')?.textContent" +
        ".includes('Natural Earth II 真實地形圖層')"
    );
    if (!await page.locator("#particle-profile").isVisible()) {
      await page.locator(".display-settings summary").click();
    }
    await page.locator("#particle-profile").selectOption(profile);
    await page.locator("#start-button").click();
    await page.waitForTimeout(durationMs);
    const metrics = await page.locator("#timing-readout").evaluate((element) => ({
      ...element.dataset
    }));

    results.push({
      durationMs,
      particleCount:
        profile === "low" ? 300 : profile === "high" ? 1200 : 700,
      profile,
      ...Object.fromEntries(
        Object.entries(metrics).map(([key, value]) => [key, Number(value)])
      )
    });
    await page.close();
  }
} finally {
  await browser.close();
}

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
