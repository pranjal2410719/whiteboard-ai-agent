import { test, expect } from "@playwright/test";

test.describe("Four Modular Classes Runtime Independent Verification", () => {
  test("Class 01: Human Heart & Double Circulation runtime verification", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Select Human Heart demo class
    const heartBtn = page.locator('button:has-text("Human Heart")').first();
    await expect(heartBtn).toBeVisible();
    await heartBtn.click();
    await page.waitForTimeout(600);

    // Verify static preview hero
    const hero = page.locator(".class-preview-hero");
    await expect(hero).toBeVisible();
    await expect(hero).toContainText("Human Heart");

    // Verify Heart diagram asset is rendered
    const diagram = page.locator('.drawing-svg image[href*="heart"]');
    await expect(diagram).toBeVisible();

    // Start class via hero play button
    const playBtn = page.locator(".class-hero-play-button");
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Verify hero transitions out into lecture playback
    await expect(hero).toHaveCount(0, { timeout: 4000 });
  });

  test("Class 02: DC Electric Circuit runtime verification", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Select DC Electric Circuit
    const circuitBtn = page.locator('button:has-text("DC Electric Circuit")').first();
    await expect(circuitBtn).toBeVisible();
    await circuitBtn.click();
    await page.waitForTimeout(600);

    // Verify static preview hero
    const hero = page.locator(".class-preview-hero");
    await expect(hero).toBeVisible();
    await expect(hero).toContainText("DC Electric Circuit");

    // Verify schematic is rendered
    const schematic = page.locator('.drawing-svg [data-layer="assets"], .drawing-svg [data-layer="teacher-permanent"]');
    await expect(schematic.first()).toBeVisible();

    // Start class
    const playBtn = page.locator(".class-hero-play-button");
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Verify hero transitions out
    await expect(hero).toHaveCount(0, { timeout: 4000 });
  });

  test("Class 03: Pythagoras Theorem runtime verification", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Select Pythagoras from sidebar navigation
    const pythagorasBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: /Pythagor/i });
    if (await pythagorasBtn.count() > 0) {
      await pythagorasBtn.click();
    } else {
      const altBtn = page.locator('button:has-text("Pythagor")').first();
      await altBtn.click();
    }
    await page.waitForTimeout(600);

    // Verify whiteboard SVG or preview hero is rendered
    const whiteboard = page.locator(".board-card");
    await expect(whiteboard).toBeVisible();

    const hero = page.locator(".class-preview-hero");
    if (await hero.count() > 0) {
      await expect(hero).toContainText("Pythagor");
      const playBtn = page.locator(".class-hero-play-button");
      await playBtn.click();
      await expect(hero).toHaveCount(0, { timeout: 4000 });
    } else {
      // If already started, verify right-triangle or math marks
      const drawingSvg = page.locator(".drawing-svg");
      await expect(drawingSvg).toBeVisible();
    }
  });

  test("Class 04: Human Cell runtime verification", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Select Human Cell
    const cellBtn = page.locator('button:has-text("Human Cell")').first();
    await expect(cellBtn).toBeVisible();
    await cellBtn.click();
    await page.waitForTimeout(600);

    // Verify static preview hero
    const hero = page.locator(".class-preview-hero");
    await expect(hero).toBeVisible();
    await expect(hero).toContainText("Human Cell");

    // Verify Human Cell image asset
    const cellImg = page.locator('.drawing-svg image[href*="human_cell_diagram.png"]');
    await expect(cellImg).toBeVisible();

    // Start class
    const playBtn = page.locator(".class-hero-play-button");
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Verify hero transitions out
    await expect(hero).toHaveCount(0, { timeout: 4000 });
  });
});
