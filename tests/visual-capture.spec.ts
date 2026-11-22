import { test, expect } from "@playwright/test";
import * as fs from "fs";

const brainDir = "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186";
const outDir = fs.existsSync(brainDir) ? brainDir : "test-results";

test("capture unfilled circles and pen highlighter on heart diagram", async ({ page }) => {
  await page.goto("http://127.0.0.1:3002");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);

  await page.evaluate(async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    const heart = data.sessions?.find((s: any) => s.data?.lessonKey === "heart-diagram");
    if (heart) {
      localStorage.setItem("chalkly.active", heart.id);
      window.location.reload();
    }
  });
  await page.waitForLoadState("networkidle");

  const heartImg = page.locator('.canvas-layer-assets image[data-diagram="true"]');
  await expect(heartImg).toBeVisible({ timeout: 10000 });

  const watchBtn = page.getByRole("button", { name: /Watch/i }).first();
  await watchBtn.click();
  await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });

  // Navigate to Chapter 2 (Four chambers) where atria circles and chamber labels are drawn
  const nextBtn = page.getByRole("button", { name: "Next chapter" });
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(8000);
  } else {
    await page.waitForTimeout(12000);
  }

  // Verify tutor circles on whiteboard are rendered with fill="none" (never blocking the diagram)
  const ellipses = page.locator(".drawing-svg .tutor-marks ellipse");
  const count = await ellipses.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const fill = await ellipses.nth(i).getAttribute("fill");
    expect(fill).toBe("none");
  }

  await page.screenshot({
    path: `${outDir}/heart-unfilled-circles-verification.png`,
    fullPage: true,
  });
});
