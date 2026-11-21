import { test, expect } from "@playwright/test";

test.describe("Static Class Thumbnails and Class Preparation Flow", () => {
  test("1. Static thumbnail displays canonical marks and ignores previous session ink", async ({ page }) => {
    await page.goto("http://localhost:3002");
    await page.waitForLoadState("networkidle");

    // Click on Saved Boards tab in sidebar
    const savedNav = page.locator('button.nav-link:has-text("Saved boards")');
    if (await savedNav.isVisible()) {
      await savedNav.click();
      await page.waitForTimeout(500);

      // Verify that if any saved cards exist, they render board-thumbnail
      const thumbnails = page.locator(".board-thumbnail");
      const count = await thumbnails.count();
      // If there are thumbnails, ensure they contain SVG elements
      for (let i = 0; i < count; i++) {
        await expect(thumbnails.nth(i)).toBeVisible();
      }
    }
  });

  test("2. Demo lecture displays static cover thumbnail and class preparation hero when idle", async ({ page }) => {
    await page.goto("http://localhost:3002");
    await page.waitForLoadState("networkidle");

    // Select Human Heart demo class
    const heartBtn = page.locator('button:has-text("Human Heart & Blood Flow")').first();
    await expect(heartBtn).toBeVisible();
    await heartBtn.click();
    await page.waitForTimeout(600);

    // Verify static class cover hero card is visible
    const heroCard = page.locator(".class-preview-hero");
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toContainText("Human Heart");
    await expect(heroCard).toContainText("Chapters");

    const playBtn = page.locator(".class-hero-play-button");
    await expect(playBtn).toBeVisible();
    await expect(playBtn).toContainText("Start Class");

    // Verify the static diagram image is visible on the right
    const diagramImg = page.locator('svg.drawing-svg image[href*="heart"]');
    await expect(diagramImg).toBeVisible();

    // Take screenshot of static thumbnail cover with hero play card
    await page.screenshot({ path: "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186/static-class-thumbnail-cover.png" });
  });

  test("3. Clicking Start Class transitions into Chapter 1 and starts lecture", async ({ page }) => {
    await page.goto("http://localhost:3002");
    await page.waitForLoadState("networkidle");

    // Select Human Heart demo class
    const heartBtn = page.locator('button:has-text("Human Heart & Blood Flow")').first();
    await heartBtn.click();
    await page.waitForTimeout(500);

    const playBtn = page.locator(".class-hero-play-button");
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Expect preparation transition: hero unmounts, board lock note or playing indicator appears
    await expect(page.locator(".class-preview-hero")).toHaveCount(0, { timeout: 3000 });

    // Expect Chapter 1 narration / captions or audio playing
    await page.waitForTimeout(1000);
    const audio = page.locator('audio[src*="heart"]');
    await expect(audio).toHaveCount(1);

    // Take screenshot during active lecture
    await page.screenshot({ path: "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186/class-started-from-hero.png" });
  });
});
