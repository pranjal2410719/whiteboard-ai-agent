import { test, expect } from "@playwright/test";

test.describe("Human Cell Organelle Annotations & Doubt Pinpointing", () => {
  test("Accurately circles nucleus and highlights mitochondria during Human Cell session", async ({ page }) => {
    test.setTimeout(60000);
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

    // Verify Doubt-Solving banner appears and audio is paused
    const doubtBanner = page.locator(".meet-doubt-banner");
    await expect(doubtBanner).toBeVisible({ timeout: 5000 });

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

    // 6. Resume lecture
    const resumeBtn = page.locator(".meet-resume-doubt-btn");
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();

    // Verify doubt marks cleared and lecture resumes
    await expect(doubtBanner).not.toBeVisible();
    await expect(page.locator('[data-layer="doubt-marks"] [data-doubt-mark="true"]')).toHaveCount(0);
    await expect(page.locator(".lecture-player")).toBeVisible();
  });
});
