import { test, expect } from "@playwright/test";

test.describe("Human Cell Modular Class Runtime Independent Verification", () => {
  test("Class: Human Cell runtime verification", async ({ page }) => {
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
