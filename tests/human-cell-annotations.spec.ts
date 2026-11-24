import { test, expect } from "@playwright/test";

test.describe("Human Cell Organelle Annotations & Doubt Pinpointing", () => {
  test("Accurately circles nucleus and highlights mitochondria during Human Cell session", async ({ page }) => {
    test.setTimeout(120000);
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // 1. Switch to Human Cell session
    const recent = page.getByRole("navigation", { name: "Recent sessions" });
    const cellBtn = recent.getByRole("button", { name: "Human Cell", exact: true });
    await expect(cellBtn).toBeVisible({ timeout: 5000 });
    await cellBtn.click();
    await page.waitForTimeout(800);

    // Verify diagram image is mounted at expected layout (610, 14, 232, 310)
    const img = page.locator('.drawing-svg image[href*="human_cell_diagram.png"]');
    await expect(img).toBeVisible({ timeout: 8000 });
    const imgX = Number(await img.getAttribute("x"));
    const imgY = Number(await img.getAttribute("y"));
    expect(imgX).toBe(610);
    expect(imgY).toBe(14);

    // 2. Start prerecorded class
    const startBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();
    await page.waitForTimeout(2000);

    // Verify lecture player is active
    await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });

    // 3. Student activates voice mic to pause lecture for doubt solving
    const micBtn = page.locator('.voice-mic-pill, button[aria-label*="microphone" i]');
    await expect(micBtn.first()).toBeVisible();
    await micBtn.first().click();

    // Verify no intrusive doubt capsule banner appears
    await expect(page.locator(".meet-doubt-banner")).toHaveCount(0);

    // 4. Open chat panel and ask "Where is the nucleus?"
    const chatBtn = page.locator('button[aria-label="Chat with everyone"]');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }
    const chatInput = page.locator('.meet-chat-composer input[type="text"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Where is the nucleus?");
    await chatInput.first().press("Enter");

    // Wait for tutor response
    await page.waitForTimeout(3000);

    // Verify tutor ellipse mark on the doubt layer is centered around nucleus (726, 152)
    const doubtEllipses = page.locator('[data-layer="doubt-marks"] ellipse');
    await expect(doubtEllipses.first()).toBeVisible({ timeout: 10000 });
    const cx = Number(await doubtEllipses.first().getAttribute("cx"));
    const cy = Number(await doubtEllipses.first().getAttribute("cy"));
    expect(Math.abs(cx - 726)).toBeLessThanOrEqual(25);
    expect(Math.abs(cy - 152)).toBeLessThanOrEqual(25);

    // 5. Ask "Highlight the mitochondria"
    await chatInput.first().fill("Highlight the mitochondria");
    await chatInput.first().press("Enter");
    await page.waitForTimeout(3000);

    // Verify highlighter path on doubt layer is attached and within whiteboard vertical bounds (y < 300)
    const mitoHighlight = page.locator('[data-layer="doubt-marks"] path[opacity="0.36"], [data-layer="doubt-marks"] path[stroke-width="36"]');
    await expect(mitoHighlight.first()).toBeAttached({ timeout: 10000 });
    const d = await mitoHighlight.first().getAttribute("d") || "";
    const match = d.match(/M\s*(\d+)\s+(\d+)/);
    expect(match).toBeTruthy();
    if (match) {
      const pathX = Number(match[1]);
      const pathY = Number(match[2]);
      expect(pathX).toBeGreaterThanOrEqual(600);
      expect(pathX).toBeLessThanOrEqual(750);
      expect(pathY).toBeGreaterThanOrEqual(180);
      expect(pathY).toBeLessThanOrEqual(260); // Must be on diagram, NOT y > 330!
    }

    // 6. Resume lecture via Meet bar
    const resumeBtn = page.locator('button[aria-label="Resume class"], button[title="Resume class"]').first();
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();

    // Verify doubt marks are permanently preserved across lecture resume
    await expect(page.locator(".meet-doubt-banner")).toHaveCount(0);
    const preservedCount = await page.locator('[data-layer="doubt-marks"] [data-doubt-mark="true"]').count();
    expect(preservedCount).toBeGreaterThan(0);
    await expect(page.locator(".lecture-player")).toBeVisible();

    // 7. Advance to Chapter 2 (Nucleus & Powerhouses)
    const nextBtn = page.getByRole("button", { name: "Next chapter" });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page.locator("text=Nucleus & Powerhouses")).toBeVisible({ timeout: 20000 });

    // Verify Chapter 2 slide is completely visible with diagram and organelle marks
    const ch2Marks = page.locator('.drawing-svg .active-scene [data-tutor-mark]');
    expect(await ch2Marks.count()).toBeGreaterThan(0);

    // Verify Chapter 1 doubt marks are permanently preserved in .canvas-journey-history
    const historyDoubtMarks = page.locator('.drawing-svg .canvas-journey-history [data-layer="doubt-marks"] [data-doubt-mark="true"]');
    expect(await historyDoubtMarks.count()).toBeGreaterThan(0);
  });
});
