import { test, expect } from "@playwright/test";

test.describe("Human Cell Slide 2 Visibility & Whiteboard Cumulative Persistence", () => {
  test("1. Slide 2 (Chapter 2: Nucleus & Powerhouses) is fully visible during tutoring and paused state", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Select Human Cell demo class
    const cellBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: "Human Cell" });
    await expect(cellBtn).toBeVisible({ timeout: 5000 });
    await cellBtn.click();
    await page.waitForTimeout(600);

    // Start prerecorded class
    const startBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();
    await page.waitForTimeout(1500);

    // Verify player is active
    await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });

    // Pause the lecture into tutoring / doubt-solving state via Meet mic
    const micBtn = page.locator('.voice-mic-pill, button[aria-label*="microphone" i]').first();
    await expect(micBtn).toBeVisible();
    await micBtn.click();

    // Advance to Chapter 2 (Nucleus & Powerhouses) while paused / tutoring
    const nextBtn = page.getByRole("button", { name: "Next chapter" });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Verify Chapter 2 title is visible
    await expect(page.locator("text=Nucleus & Powerhouses")).toBeVisible({ timeout: 20000 });

    // CRITICAL: Verify Chapter 2 marks are fully visible on the whiteboard
    const ch2Marks = page.locator('.drawing-svg .active-scene [data-tutor-mark]');
    const count = await ch2Marks.count();
    expect(count).toBeGreaterThanOrEqual(15);

    // Verify the cell diagram and Mitochondria images are visible on Chapter 2
    const cellImg = page.locator('.drawing-svg .active-scene image[href*="human_cell_diagram.png"]');
    await expect(cellImg).toBeVisible();
    const mitoImg = page.locator('.drawing-svg .active-scene image[href*="Mitochondria.png"]');
    await expect(mitoImg).toBeVisible();

    // Verify text marks on Chapter 2 are visible (have non-zero width and no zero-width clip rect)
    const ch2Text = page.locator('.drawing-svg .active-scene text:has-text("Nucleus: master DNA instruction library")');
    await expect(ch2Text).toBeVisible();

    // Verify Chapter 1 content is permanently preserved in .canvas-journey-history
    const historyLayer = page.locator(".drawing-svg .canvas-journey-history");
    await expect(historyLayer).toBeAttached();
    expect(await historyLayer.locator("image").count()).toBeGreaterThan(0);
    expect(await historyLayer.locator("text").count()).toBeGreaterThan(0);
  });

  test("2. Elements drawn, dropped, or answered as doubts are permanently preserved ('once written never erased')", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Switch to Human Cell
    const cellBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: "Human Cell" });
    await cellBtn.click();
    await page.waitForTimeout(600);

    // Start class
    const startBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    await startBtn.click();
    await page.waitForTimeout(1500);

    // Click mic to pause lecture for doubt solving
    const micBtn = page.locator('.voice-mic-pill, button[aria-label*="microphone" i]').first();
    await micBtn.click();

    // Ask doubt via chat: "Where is the nucleus?"
    const chatBtn = page.locator('button[aria-label="Chat with everyone"]');
    if (await chatBtn.isVisible()) await chatBtn.click();
    const chatInput = page.locator('.meet-chat-composer input[type="text"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Where is the nucleus?");
    await chatInput.first().press("Enter");

    // Wait for tutor doubt answer
    await page.waitForTimeout(3000);

    // Verify tutor ellipse mark appears on the doubt layer
    const doubtMarks = page.locator('[data-layer="doubt-marks"] [data-doubt-mark="true"]');
    await expect(doubtMarks.first()).toBeVisible({ timeout: 10000 });
    const countBeforeResume = await doubtMarks.count();
    expect(countBeforeResume).toBeGreaterThan(0);

    // Resume lecture
    const resumeBtn = page.locator('button[aria-label="Resume class"], button[title="Resume class"]').first();
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();
    await page.waitForTimeout(1000);

    // CRITICAL: Doubt marks MUST NOT be erased upon resume!
    const countAfterResume = await page.locator('[data-layer="doubt-marks"] [data-doubt-mark="true"]').count();
    expect(countAfterResume).toBe(countBeforeResume);

    // Advance to Chapter 2
    const nextBtn = page.getByRole("button", { name: "Next chapter" });
    await nextBtn.click();
    await expect(page.locator("text=Nucleus & Powerhouses")).toBeVisible({ timeout: 20000 });

    // CRITICAL: Chapter 1 doubt marks are permanently preserved in .canvas-journey-history!
    const historyDoubtMarks = page.locator('.drawing-svg .canvas-journey-history [data-layer="doubt-marks"] [data-doubt-mark="true"]');
    expect(await historyDoubtMarks.count()).toBeGreaterThan(0);

    // Ask doubt on Chapter 2: "Where is the nucleus?"
    await chatInput.first().fill("Where is the nucleus?");
    await chatInput.first().press("Enter");
    await page.waitForTimeout(3000);

    // Verify Chapter 2 nucleus doubt mark is calibrated for Chapter 2 (cx around 553)
    const ch2Doubt = page.locator('.drawing-svg .canvas-layer-doubt ellipse');
    await expect(ch2Doubt.first()).toBeVisible({ timeout: 10000 });
    const cx = Number(await ch2Doubt.first().getAttribute("cx"));
    expect(Math.abs(cx - 553)).toBeLessThanOrEqual(30);

    // Switch back to Chapter 1 via Previous chapter button
    const prevBtn = page.getByRole("button", { name: "Previous chapter" });
    await prevBtn.click();
    await expect(page.locator(".page-count")).toContainText("Chapter 1");

    // Verify Chapter 1 still retains all its marks and doubt marks!
    const ch1Marks = page.locator('.drawing-svg .active-scene [data-tutor-mark]');
    expect(await ch1Marks.count()).toBeGreaterThan(0);
    const ch1Doubt = page.locator('.drawing-svg .canvas-layer-doubt [data-doubt-mark="true"]');
    expect(await ch1Doubt.count()).toBeGreaterThan(0);
  });
});
