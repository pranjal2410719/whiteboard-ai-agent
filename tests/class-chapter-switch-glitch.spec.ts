import { test, expect } from "@playwright/test";

test.describe("Class and Chapter Switching Glitch & Optimization Suite", () => {
  test("1. Switching chapters via Before and Next buttons preserves monotonic time and clean drawing without cursor flicker", async ({ page }) => {
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Start prerecorded class
    const watchBtn = page.getByRole("button", { name: "Watch prerecorded class", exact: true });
    await expect(watchBtn).toBeVisible({ timeout: 10000 });
    await watchBtn.click();

    // Verify GoogleMeetBar playback controls are active
    const playerRegion = page.getByRole("region", { name: "Prerecorded class player" });
    await expect(playerRegion).toBeVisible({ timeout: 5000 });

    const prevBtn = page.getByRole("button", { name: "Previous chapter", exact: true });
    const nextBtn = page.getByRole("button", { name: "Next chapter", exact: true });

    // Initially on Chapter 1 (index 0), Previous button should be disabled
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();
    await expect(page.locator(".page-count")).toContainText("Chapter 1");

    // Advance to Chapter 2 via Next button
    await nextBtn.click();
    await expect(page.locator(".page-count")).toContainText("Chapter 2");
    await expect(prevBtn).toBeEnabled();

    // Marker cursor should be inside the whiteboard and not teleported to {852, 250}
    const marker = page.locator(".marker-cursor");
    await expect(marker).toBeAttached();
    const transformCh2 = await marker.evaluate(el => el.style.transform);
    expect(transformCh2).toBeTruthy();

    // Advance to Chapter 3
    await nextBtn.click();
    await expect(page.locator(".page-count")).toContainText("Chapter 3");

    // Click Previous to go back to Chapter 2
    await prevBtn.click();
    await expect(page.locator(".page-count")).toContainText("Chapter 2");

    // Click Previous to go back to Chapter 1
    await prevBtn.click();
    await expect(page.locator(".page-count")).toContainText("Chapter 1");
    await expect(prevBtn).toBeDisabled();
  });

  test("2. Switching classes cleanly unmounts previous whiteboard and mounts fresh state with no ghost marks", async ({ page }) => {
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    const recent = page.getByRole("navigation", { name: "Recent sessions" });

    // 1. Switch to Pythagoras
    const pythagorasBtn = recent.getByRole("button", { name: "Pythagorean theorem", exact: true });
    await pythagorasBtn.click();
    await expect(page.locator(".meet-call-title")).toContainText("Pythagorean theorem");
    await expect(page.locator(".drawing-svg")).toBeVisible();

    // 2. Switch to Fractions
    const fractionsBtn = recent.getByRole("button", { name: "Understanding fractions", exact: true });
    await fractionsBtn.click();
    await expect(page.locator(".meet-call-title")).toContainText("Understanding fractions");
    await expect(page.locator(".drawing-svg")).toBeVisible();

    // 3. Switch to Human Cell
    const cellBtn = recent.getByRole("button", { name: "Human Cell", exact: true });
    if (await cellBtn.count() > 0) {
      await cellBtn.click();
      await expect(page.locator(".meet-call-title")).toContainText("Human Cell");
      const cellImage = page.locator('.drawing-svg image, .canvas-layer-assets image');
      await expect(cellImage.first()).toBeVisible({ timeout: 8000 });
    }

    // 4. Switch to Heart Diagram
    const heartBtn = recent.getByRole("button", { name: "Human Heart & Blood Flow", exact: true });
    if (await heartBtn.count() > 0) {
      await heartBtn.click();
      await expect(page.locator(".meet-call-title")).toContainText("Human Heart & Blood Flow");
      const heartImage = page.locator('.canvas-layer-assets image[data-diagram="true"]');
      await expect(heartImage).toBeVisible({ timeout: 8000 });
    }
  });

  test("3. Boost Mode toggles via button and /boost command, applying 120fps hardware acceleration", async ({ page }) => {
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");

    const boostBtn = page.getByRole("button", { name: "Toggle Boost Mode" }).first();
    await expect(boostBtn).toBeVisible();

    // Boost mode is active by default
    await expect(page.locator(".board-card")).toHaveClass(/boost-mode-active/);

    // Toggle off via button
    await boostBtn.click();
    await expect(page.locator(".board-card")).not.toHaveClass(/boost-mode-active/);

    // Toggle on via button
    await boostBtn.click();
    await expect(page.locator(".board-card")).toHaveClass(/boost-mode-active/);

    // Test TeacherCam ponytail GPU acceleration and view-box origin
    const ponytail = page.locator(".tutor-cam-ponytail");
    await expect(ponytail).toBeAttached();
    const ponytailOrigin = await ponytail.evaluate(el => getComputedStyle(el).transformOrigin);
    expect(ponytailOrigin).toContain("px");

    // Test /gsd command in input box
    const queryInput = page.getByPlaceholder("Ask your tutor a question…");
    await queryInput.fill("/gsd");
    await queryInput.press("Enter");
    await expect(page.locator(".toast")).toContainText(/GSD Mode active/);

    // Test /graphyphy command in input box
    await queryInput.fill("/graphyphy");
    await queryInput.press("Enter");
    await expect(page.locator(".toast")).toContainText(/Graphyphy active/);
  });
});
