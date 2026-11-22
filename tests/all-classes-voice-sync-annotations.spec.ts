import { test, expect } from "@playwright/test";
import * as fs from "fs";

const brainDir = "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186";
const outDir = fs.existsSync(brainDir) ? brainDir : "test-results";

test.describe("Human Cell Modular Class End-to-End Voice, Sync & Doubt Annotations", () => {
  test("Class: Human Cell — Synchronous playback & Doubt resolution", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Switch to Human Cell session
    const cellBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: /Cell/i }).first();
    await expect(cellBtn).toBeVisible({ timeout: 5000 });
    await cellBtn.click();
    await page.waitForTimeout(800);

    const startBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verify Cell diagram image at x=610, y=14
    const cellImg = page.locator('.drawing-svg image[href*="human_cell_diagram.png"]');
    await expect(cellImg.first()).toBeVisible({ timeout: 10000 });
    expect(Number(await cellImg.first().getAttribute("x"))).toBe(610);
    expect(Number(await cellImg.first().getAttribute("y"))).toBe(14);

    // Verify audio loaded without errors
    await expect(page.locator(".class-audio-message")).not.toBeVisible();

    // Verify lecture player is active
    await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });

    // Voice mic for doubt
    const micBtn = page.locator('.voice-mic-pill, button[aria-label*="microphone" i]');
    await expect(micBtn.first()).toBeVisible();
    await micBtn.first().click();

    const doubtBanner = page.locator(".meet-doubt-banner");
    await expect(doubtBanner).toBeVisible({ timeout: 5000 });

    // Open chat and ask "Where is the nucleus?"
    const chatBtn = page.locator('button[aria-label="Chat with everyone"]');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }
    const chatInput = page.locator('.meet-chat-composer input[type="text"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Where is the nucleus?");
    await chatInput.first().press("Enter");

    await page.waitForTimeout(3000);

    // Verify tutor ellipse mark on nucleus (cx=726, cy=152)
    const doubtEllipses = page.locator('[data-layer="doubt-marks"] ellipse, [data-layer="teacher-annotations"] ellipse');
    await expect(doubtEllipses.first()).toBeVisible({ timeout: 10000 });
    const cx = Number(await doubtEllipses.first().getAttribute("cx"));
    const cy = Number(await doubtEllipses.first().getAttribute("cy"));
    expect(cx).toBe(726);
    expect(cy).toBe(152);

    await page.screenshot({
      path: `${outDir}/class04-cell-doubt-verification.png`,
      fullPage: true,
    });
  });
});
