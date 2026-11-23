import { test, expect } from "@playwright/test";
import { getPageOffset } from "@/components/Whiteboard";
import * as fs from "fs";

const brainDir = "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186";
const outDir = fs.existsSync(brainDir) ? brainDir : "test-results";

test.describe("Spatial Zig-Zag Continuous Whiteboard Canvas", () => {
  test("1. Mathematical verification of zig-zag diagonal scroll trajectory", () => {
    // Page 0 (initial): (0, 0)
    const p0 = getPageOffset(0);
    expect(p0.x).toBe(0);
    expect(p0.y).toBe(0);

    // Page 1: scrolls diagonally left (x < 0, y > 0)
    const p1 = getPageOffset(1);
    expect(p1.x).toBe(-1050);
    expect(p1.y).toBe(360);
    const delta0to1 = { dx: p1.x - p0.x, dy: p1.y - p0.y };
    expect(delta0to1.dx).toBe(-1050); // Leftward shift
    expect(delta0to1.dy).toBe(360);   // Downward shift
    expect(delta0to1.dx < 0 && delta0to1.dy > 0).toBe(true); // Diagonal down-left!

    // Page 2: swipes diagonally right (x > 0 relative to page 1, y > 0)
    const p2 = getPageOffset(2);
    expect(p2.x).toBe(0);
    expect(p2.y).toBe(720);
    const delta1to2 = { dx: p2.x - p1.x, dy: p2.y - p1.y };
    expect(delta1to2.dx).toBe(1050);  // Rightward shift
    expect(delta1to2.dy).toBe(360);   // Downward shift
    expect(delta1to2.dx > 0 && delta1to2.dy > 0).toBe(true); // Diagonal down-right!

    // Page 3: scrolls diagonally left
    const p3 = getPageOffset(3);
    expect(p3.x).toBe(-1050);
    expect(p3.y).toBe(1080);
    const delta2to3 = { dx: p3.x - p2.x, dy: p3.y - p2.y };
    expect(delta2to3.dx).toBe(-1050); // Leftward shift
    expect(delta2to3.dy).toBe(360);   // Downward shift
    expect(delta2to3.dx < 0 && delta2to3.dy > 0).toBe(true); // Diagonal down-left!

    // Page 4: swipes diagonally right
    const p4 = getPageOffset(4);
    expect(p4.x).toBe(0);
    expect(p4.y).toBe(1440);
    const delta3to4 = { dx: p4.x - p3.x, dy: p4.y - p3.y };
    expect(delta3to4.dx).toBe(1050);  // Rightward shift
    expect(delta3to4.dy).toBe(360);   // Downward shift
    expect(delta3to4.dx > 0 && delta3to4.dy > 0).toBe(true); // Diagonal down-right!
  });

  test("2. Whiteboard UI: previous chapter content is NOT wiped out and coexists in canvas", async ({ page }) => {
    test.setTimeout(80000);
    await page.goto("http://127.0.0.1:3002/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Select Human Cell demo class
    const cellBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: "Human Cell" });
    await expect(cellBtn).toBeVisible({ timeout: 5000 });
    await cellBtn.click();
    await page.waitForTimeout(600);

    // Start lecture
    const watchBtn = page.getByRole("button", { name: /Watch/i }).first();
    await expect(watchBtn).toBeVisible({ timeout: 5000 });
    await watchBtn.click();

    const startBtn = page.getByRole("button", { name: /Start Class/i });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
    }

    // Wait 10 seconds for Chapter 1 cues to draw
    await page.waitForTimeout(10000);

    // Advance to Chapter 2 (Nucleus & Powerhouses)
    const nextBtn = page.getByRole("button", { name: "Next chapter" });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Verify Chapter 2 title is visible
    await expect(page.locator("text=Nucleus & Powerhouses")).toBeVisible({ timeout: 20000 });

    // CRITICAL ASSERTION: Chapter 1 content was NOT wiped out!
    // Chapter 1 is preserved in .canvas-journey-history in the same whiteboard SVG!
    const historyLayer = page.locator(".drawing-svg .canvas-journey-history");
    await expect(historyLayer).toBeAttached();

    // Verify Chapter 1 text is still present on the whiteboard
    const historyText = historyLayer.locator("text");
    const histTextCount = await historyText.count();
    expect(histTextCount).toBeGreaterThan(0);

    // Verify Chapter 1 cell image is still present on the whiteboard
    const historyImages = historyLayer.locator("image");
    expect(await historyImages.count()).toBeGreaterThan(0);

    // Verify Chapter 1 ellipses are still present on the whiteboard
    const historyEllipses = historyLayer.locator("ellipse");
    expect(await historyEllipses.count()).toBeGreaterThan(0);

    // Verify connector trail between Chapter 1 and Chapter 2 is rendered
    const connectors = page.locator(".drawing-svg .canvas-journey-connectors path");
    await expect(connectors.first()).toBeAttached();

    // Verify Chapter 2 active marks are also rendering
    const activeScene = page.locator(".drawing-svg .tutor-marks.active-scene");
    await expect(activeScene).toBeAttached();

    // Advance to Chapter 3 (Identify the protein factories)
    await nextBtn.click();
    await expect(page.locator("text=Identify the protein factories")).toBeVisible({ timeout: 20000 });

    // Both Chapter 1 and Chapter 2 are now preserved in the continuous whiteboard history!
    const historyPages = historyLayer.locator(".journey-page");
    expect(await historyPages.count()).toBeGreaterThanOrEqual(2);

    // Capture screenshot of the continuous zig-zag whiteboard
    await page.screenshot({
      path: `${outDir}/zigzag-continuous-canvas-verification.png`,
      fullPage: true,
    });
  });
});
