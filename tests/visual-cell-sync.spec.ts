import { test, expect } from "@playwright/test";
import * as fs from "fs";

const brainDir = "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186";
const outDir = fs.existsSync(brainDir) ? brainDir : "test-results";

test("Human Cell diagram class: verify authentic diagram asset, unfilled circles, pen highlighter, and bottom bar controls", async ({ page }) => {
  test.setTimeout(80000);
  await page.goto("http://127.0.0.1:3002");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);

  // Select Human Cell demo class from sidebar
  const cellBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: "Human Cell" });
  await expect(cellBtn).toBeVisible({ timeout: 5000 });
  await cellBtn.click();
  await page.waitForTimeout(600);

  // Verify the human_cell_diagram image is rendered on the whiteboard
  const cellImg = page.locator('.drawing-svg image, .canvas-layer-assets image').filter({
    has: page.locator('xpath=self::*[contains(@href, "human_cell_diagram.png") or contains(@src, "human_cell_diagram.png")]'),
  });
  await expect(cellImg.first()).toBeAttached({ timeout: 10000 });

  // Click Watch prerecorded class to begin demo lecture
  const watchBtn = page.getByRole("button", { name: /Watch/i }).first();
  await expect(watchBtn).toBeVisible({ timeout: 5000 });
  await watchBtn.click();

  // Verify the bottom bar lecture controls are active
  const bottomBarControls = page.getByRole("region", { name: "Prerecorded class player" });
  await expect(bottomBarControls).toBeVisible({ timeout: 10000 });

  // Wait 12 seconds so Chapter 0 scene with Cell Membrane, Cytoplasm, and pen highlighter is fully drawn
  await page.waitForTimeout(12000);

  // 1. Verify tutor circles on whiteboard are rendered with fill="none" (never blocking diagram visibility)
  const ellipses = page.locator(".drawing-svg .tutor-marks ellipse");
  await expect(ellipses.first()).toBeVisible({ timeout: 15000 });
  const count = await ellipses.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const fill = await ellipses.nth(i).getAttribute("fill");
    expect(fill).toBe("none");
  }

  // 2. Wait for cue 2 to draw translucent pen highlighter
  const highlighterPaths = page.locator('.drawing-svg .tutor-marks path[opacity="0.35"]');
  await expect(highlighterPaths.first()).toBeAttached({ timeout: 15000 });

  // 3. Take screenshot of Chapter 1
  await page.screenshot({
    path: `${outDir}/cell-chapter1-verification.png`,
    fullPage: true,
  });

  // 4. Test bottom bar controls: Click "Next chapter" to jump to Nucleus & Powerhouses
  const nextBtn = page.getByRole("button", { name: "Next chapter" });
  await expect(nextBtn).toBeVisible();
  await nextBtn.click();

  // Verify chapter title updated
  await expect(page.locator("text=Nucleus & Powerhouses")).toBeVisible({ timeout: 20000 });

  // Verify circles in Chapter 2 also have fill="none"
  const ch2Ellipses = page.locator(".drawing-svg .tutor-marks ellipse");
  await expect(ch2Ellipses.first()).toBeVisible({ timeout: 15000 });
  const ch2Count = await ch2Ellipses.count();
  expect(ch2Count).toBeGreaterThan(0);
  for (let i = 0; i < ch2Count; i++) {
    const fill = await ch2Ellipses.nth(i).getAttribute("fill");
    expect(fill).toBe("none");
  }

  // Allow Chapter 2 to advance into its mitochondria & ATP cues
  await page.waitForTimeout(6000);

  // Capture screenshot of Chapter 2 fully illustrated
  await page.screenshot({
    path: `${outDir}/cell-chapter2-verification.png`,
    fullPage: true,
  });

  // 5. Click "Next chapter" to jump to Protein Factories (Rough ER & Golgi)
  await nextBtn.click();
  await expect(page.locator("text=Identify the protein factories")).toBeVisible({ timeout: 10000 });

  // Wait for rough ER and Golgi to be drawn
  await page.waitForTimeout(10000);

  // 6. Capture full visual screenshot of Chapter 3
  await page.screenshot({
    path: `${outDir}/cell-chapter3-verification.png`,
    fullPage: true,
  });

  // 7. Test "Previous chapter" button
  const prevBtn = page.getByRole("button", { name: "Previous chapter" });
  await expect(prevBtn).toBeVisible();
  await prevBtn.click();
  await expect(page.locator("text=Nucleus & Powerhouses")).toBeVisible({ timeout: 10000 });

  // 8. Capture final verification screenshot
  await page.screenshot({
    path: `${outDir}/cell-bottom-bar-and-diagram-verification.png`,
    fullPage: true,
  });

  // 9. Capture dedicated close-up screenshot of the unified bottom control bar
  await page.locator(".meet-bottom-bar").screenshot({
    path: `${outDir}/unified-meet-control-bar.png`,
  });
});
