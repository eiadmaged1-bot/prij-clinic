import { expect, type Page } from "@playwright/test";
import {
  createDemoPatient,
  expectCleanPage,
  expectNoCodeLikeText,
  loginAsOwner,
  loginAsReceptionist,
  visibleBodyText
} from "../v094/helpers";

export {
  createDemoPatient,
  expectCleanPage,
  expectNoCodeLikeText,
  loginAsOwner,
  loginAsReceptionist,
  visibleBodyText
};

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    windowWidth: window.innerWidth
  }));
  const width = Math.max(overflow.clientWidth, overflow.windowWidth);
  expect(
    overflow.scrollWidth,
    `document overflow: ${JSON.stringify(overflow)}`
  ).toBeLessThanOrEqual(width + 2);
  expect(
    overflow.bodyScrollWidth,
    `body overflow: ${JSON.stringify(overflow)}`
  ).toBeLessThanOrEqual(width + 2);
}

export async function expectMobilePageClean(page: Page) {
  await expect(page.locator("body")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectCleanPage(page);
}
