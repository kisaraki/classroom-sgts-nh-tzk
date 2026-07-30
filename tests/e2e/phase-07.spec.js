import { expect, test } from "@playwright/test";

test("three data-driven levels switch without leaking dashboard state", async ({
  page
}) => {
  await page.goto("./");
  const levelSelect = page.locator("#level-select");

  await expect(levelSelect.locator("option")).toHaveCount(4);
  await levelSelect.selectOption("mountain-shield");
  await expect(page.locator("#level-dashboard")).toContainText("護國神山");
  await expect(page.locator("#level-dashboard")).toContainText("2015 蘇迪勒");
  await expect(page.locator("[data-level-remaining]")).toHaveText("216h 00m");
  await expect(page.locator(".objective-list > li")).toHaveCount(6);
  await expect(page.locator("#storm-position")).toContainText("13.60°N");

  await levelSelect.selectOption("wayne-three-entries");
  await expect(page.locator("#level-dashboard")).toContainText("韋恩三進");
  await expect(page.locator("#level-dashboard")).toContainText("1986 韋恩");
  await expect(page.locator("#level-dashboard")).toContainText(
    "警戒圈為教育用途"
  );
  await expect(page.locator("[data-level-remaining]")).toHaveText("360h 00m");
  await expect(page.locator(".objective-list > li")).toHaveCount(5);
  await expect(page.locator("#storm-position")).toContainText("16.00°N");
  await expect(page.locator("#start-button")).toContainText("韋恩三進");
  await expect(
    page.locator('.objective-list > li[data-status="pending"]')
  ).toHaveCount(5);
});
