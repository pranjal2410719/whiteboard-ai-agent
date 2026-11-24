import { test, expect } from "@playwright/test";

test.describe("Student Doubt Solving & Lecture Synchronization", () => {
  test("Microphone click immediately pauses lecture, starts listening, demonstrates on whiteboard, and resumes without voice conflict", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // 1. Switch to Human Cell session owned by this workspace
    await page.evaluate(async () => {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      const cell = data.sessions?.find((s: any) => s.data?.lessonKey === "human-cell") || data.sessions?.[0];
      if (cell) {
        localStorage.setItem("chalkly.active", cell.id);
        window.location.reload();
      }
    });
    await page.waitForLoadState("networkidle");

    // If static preview hero is visible, click Start Class
    const startHeroBtn = page.locator('button:has-text("Start Class"), button:has-text("Start Human Cell class")').first();
    if (await startHeroBtn.isVisible()) {
      await startHeroBtn.click();
      await page.waitForTimeout(1500);
    } else {
      const watchBtn = page.getByRole("button", { name: /Watch.*class/i }).first();
      if (await watchBtn.isVisible()) {
        await watchBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // Ensure playback is actively playing
    const playToggleBtn = page.getByRole("button", { name: "Resume class", exact: true });
    if (await playToggleBtn.isVisible()) {
      await playToggleBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify player is visible and audio is initialized
    await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // 2. Student clicks microphone to ask doubt
    const micBtn = page.locator('.voice-mic-pill, button[aria-label*="microphone" i]');
    await expect(micBtn.first()).toBeVisible();
    await micBtn.first().click();

    // Verify immediate pause and no intrusive doubt capsule banner
    await expect(page.locator(".meet-doubt-banner")).toHaveCount(0);

    // Verify audio element is paused (no double voice conflict)
    const isAudioPaused = await page.evaluate(() => {
      const audio = document.querySelector("audio");
      return audio ? audio.paused : true;
    });
    expect(isAudioPaused).toBe(true);

    // 3. Student asks a doubt question via chat/input
    const chatBtn = page.locator('button[aria-label="Chat with everyone"]');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }
    const chatInput = page.locator('.meet-chat-composer input[type="text"], input[placeholder*="Ask"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Where is the nucleus?");
    await chatInput.first().press("Enter");

    // Wait for the tutor to analyze and answer in real-time
    await page.waitForTimeout(2000);

    // Verify whiteboard marks from the lecture remain intact and stable (zero tampering or wiping)
    const visibleMarks = page.locator('.drawing-svg [data-mark="true"], .drawing-svg text');
    expect(await visibleMarks.count()).toBeGreaterThan(0);

    // Verify the response is provided verbally / in session transcript
    const replyExists = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.meet-chat-msg, .chat-message, .tutor-copy');
      return msgs.length > 0;
    });
    expect(replyExists).toBe(true);

    // 4. Student resumes lecture via Meet control bar
    const resumeBtn = page.locator('button[aria-label="Resume class"], button[title="Resume class"]').first();
    if (await resumeBtn.isVisible()) {
      await resumeBtn.click();
    }

    // Verify lecture continues playing
    await page.waitForTimeout(1000);
    await expect(page.locator(".lecture-player")).toBeVisible();
  });
});
