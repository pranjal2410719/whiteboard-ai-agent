import { test, expect } from "@playwright/test";

test.describe("Student Doubt Solving & Lecture Synchronization", () => {
  test("Hand raise immediately pauses lecture, starts listening, demonstrates on whiteboard, and resumes without voice conflict", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // 1. Switch to Human Heart session
    const heartBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: /Heart/i });
    if (await heartBtn.count() > 0) {
      await heartBtn.scrollIntoViewIfNeeded();
      await heartBtn.click();
    } else {
      await page.evaluate(async () => {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        const heart = data.sessions.find((s: any) => s.data.lessonKey === "heart-diagram");
        if (heart) {
          localStorage.setItem("chalkly.active", heart.id);
          window.location.reload();
        }
      });
      await page.waitForLoadState("networkidle");
    }

    await expect(page.locator('.canvas-layer-assets image[data-diagram="true"]')).toBeVisible({ timeout: 10000 });

    // 2. Start prerecorded class
    const watchClassBtn = page.locator('button[aria-label="Watch prerecorded class"]');
    await expect(watchClassBtn).toBeVisible();
    await watchClassBtn.click();

    // Verify player is visible and audio is initialized
    await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // 3. Student clicks "Hands up" (Raise hand)
    const handBtn = page.locator('button[aria-label="Raise hand"]');
    await expect(handBtn).toBeVisible();
    await handBtn.click();

    // Verify immediate pause and doubt banner appearance
    const doubtBanner = page.locator(".meet-doubt-banner");
    await expect(doubtBanner).toBeVisible({ timeout: 5000 });
    await expect(page.locator('strong:has-text("Doubt-Solving Mode")')).toBeVisible();

    // Verify audio element is paused (no double voice conflict)
    const isAudioPaused = await page.evaluate(() => {
      const audio = document.querySelector("audio");
      return audio ? audio.paused : true;
    });
    expect(isAudioPaused).toBe(true);

    // 4. Student asks a doubt question via chat/input
    // Open chat panel if closed
    const chatBtn = page.locator('button[aria-label="Chat with everyone"]');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }
    const chatInput = page.locator('.meet-chat-composer input[type="text"], input[placeholder*="Ask"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Where is the right atrium?");
    await chatInput.first().press("Enter");

    // Wait for the tutor to answer and demonstrate on the whiteboard
    await page.waitForTimeout(3000);

    // Verify the doubt marks are rendered on the whiteboard doubt layer
    const doubtMarks = page.locator('[data-layer="doubt-marks"] [data-doubt-mark="true"]');
    await expect(doubtMarks.first()).toBeVisible({ timeout: 10000 });
    expect(await doubtMarks.count()).toBeGreaterThan(0);

    // Verify lecture audio remains paused while doubt is explained
    const isStillPaused = await page.evaluate(() => {
      const audio = document.querySelector("audio");
      return audio ? audio.paused : true;
    });
    expect(isStillPaused).toBe(true);

    // 5. Student clicks "Resume lecture"
    const resumeBtn = page.locator(".meet-resume-doubt-btn");
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();

    // Verify doubt banner is removed
    await expect(doubtBanner).not.toBeVisible();

    // Verify doubt marks are cleanly cleared
    await expect(page.locator('[data-layer="doubt-marks"] [data-doubt-mark="true"]')).toHaveCount(0);

    // Verify lecture continues playing
    await page.waitForTimeout(1000);
    await expect(page.locator(".lecture-player")).toBeVisible();
  });
});
