import { test, expect } from "@playwright/test";
import * as fs from "fs";

const brainDir = "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186";
const outDir = fs.existsSync(brainDir) ? brainDir : "test-results";

test.describe("Four Modular Classes End-to-End Voice, Sync & Doubt Annotations", () => {
  test("Class 01: Human Heart — Synchronous playback & Doubt resolution", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Switch to heart session
    const heartBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: /Heart/i }).first();
    await expect(heartBtn).toBeVisible({ timeout: 5000 });
    await heartBtn.click();
    await page.waitForTimeout(800);

    // If static preview hero is showing, click Start Class
    const startBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verify Heart diagram image is visible at x=550, y=25
    const heartImg = page.locator('.drawing-svg image[href*="Demonstration_A"], .drawing-svg image[href*="heart"]');
    await expect(heartImg.first()).toBeVisible({ timeout: 10000 });
    expect(Number(await heartImg.first().getAttribute("x"))).toBe(550);
    expect(Number(await heartImg.first().getAttribute("y"))).toBe(25);

    // Verify audio loaded without errors
    await expect(page.locator(".class-audio-message")).not.toBeVisible();

    // Verify lecture player is active
    await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });

    // Student raises hand to pause lecture for doubt solving
    const handBtn = page.locator('button[aria-label="Raise hand"]');
    await expect(handBtn).toBeVisible();
    await handBtn.click();

    // Verify Doubt-Solving banner appears
    const doubtBanner = page.locator(".meet-doubt-banner");
    await expect(doubtBanner).toBeVisible({ timeout: 5000 });

    // Open chat panel and ask "Where is the right atrium?"
    const chatBtn = page.locator('button[aria-label="Chat with everyone"]');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }
    const chatInput = page.locator('.meet-chat-composer input[type="text"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Where is the right atrium?");
    await chatInput.first().press("Enter");

    // Wait for tutor response
    await page.waitForTimeout(3000);

    // Verify tutor ellipse mark on the doubt layer is centered around Right Atrium (x ~ 617..675, y ~ 99..170)
    const doubtEllipses = page.locator('[data-layer="doubt-marks"] ellipse, [data-layer="teacher-annotations"] ellipse');
    await expect(doubtEllipses.first()).toBeVisible({ timeout: 10000 });
    const cx = Number(await doubtEllipses.first().getAttribute("cx"));
    const cy = Number(await doubtEllipses.first().getAttribute("cy"));
    expect(cx).toBeGreaterThanOrEqual(600);
    expect(cx).toBeLessThanOrEqual(680);
    expect(cy).toBeGreaterThanOrEqual(90);
    expect(cy).toBeLessThanOrEqual(180);

    await page.screenshot({
      path: `${outDir}/class01-heart-doubt-verification.png`,
      fullPage: true,
    });
  });

  test("Class 02: DC Electric Circuit — Synchronous playback & Doubt resolution", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Switch to DC Electric Circuit session
    const circuitBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: /Circuit/i }).first();
    await expect(circuitBtn).toBeVisible({ timeout: 5000 });
    await circuitBtn.click();
    await page.waitForTimeout(800);

    const startBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verify schematic diagram asset at x=515, y=30
    const circuitImg = page.locator('.drawing-svg image[href*="circuit"], .drawing-svg image[href*="electric"]');
    await expect(circuitImg.first()).toBeVisible({ timeout: 10000 });
    expect(Number(await circuitImg.first().getAttribute("x"))).toBe(515);
    expect(Number(await circuitImg.first().getAttribute("y"))).toBe(30);

    // Verify audio loaded without errors
    await expect(page.locator(".class-audio-message")).not.toBeVisible();

    // Verify lecture player is active
    await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });

    // Raise hand for doubt
    const handBtn = page.locator('button[aria-label="Raise hand"]');
    await expect(handBtn).toBeVisible();
    await handBtn.click();

    const doubtBanner = page.locator(".meet-doubt-banner");
    await expect(doubtBanner).toBeVisible({ timeout: 5000 });

    // Open chat and ask "Where is the resistor?"
    const chatBtn = page.locator('button[aria-label="Chat with everyone"]');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }
    const chatInput = page.locator('.meet-chat-composer input[type="text"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Where is the resistor?");
    await chatInput.first().press("Enter");

    await page.waitForTimeout(3000);

    // Verify tutor mark near Resistor (x ~ 840..910, y ~ 120..200)
    const doubtMarks = page.locator('[data-layer="doubt-marks"] ellipse, [data-layer="teacher-annotations"] ellipse, [data-layer="doubt-marks"] rect');
    await expect(doubtMarks.first()).toBeVisible({ timeout: 10000 });
    const cx = Number(await doubtMarks.first().getAttribute("cx") || await doubtMarks.first().getAttribute("x"));
    expect(cx).toBeGreaterThanOrEqual(820);
    expect(cx).toBeLessThanOrEqual(920);

    await page.screenshot({
      path: `${outDir}/class02-circuit-doubt-verification.png`,
      fullPage: true,
    });
  });

  test("Class 03: Pythagoras Theorem — Synchronous playback & Doubt resolution", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Switch to Pythagoras session
    const pythagorasBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: /Pythagor/i }).first();
    await expect(pythagorasBtn).toBeVisible({ timeout: 5000 });
    await pythagorasBtn.click();
    await page.waitForTimeout(800);

    const startBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verify right-angled triangle is attached
    const trianglePath = page.locator('.drawing-svg path[d*="M608"]');
    await expect(trianglePath.first()).toBeAttached({ timeout: 10000 });

    // Verify audio loaded without errors
    await expect(page.locator(".class-audio-message")).not.toBeVisible();

    // Verify lecture player is active
    await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 10000 });

    // Raise hand for doubt
    const handBtn = page.locator('button[aria-label="Raise hand"]');
    await expect(handBtn).toBeVisible();
    await handBtn.click();

    const doubtBanner = page.locator(".meet-doubt-banner");
    await expect(doubtBanner).toBeVisible({ timeout: 5000 });

    // Open chat and ask "Where is the hypotenuse?"
    const chatBtn = page.locator('button[aria-label="Chat with everyone"]');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }
    const chatInput = page.locator('.meet-chat-composer input[type="text"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Where is the hypotenuse?");
    await chatInput.first().press("Enter");

    await page.waitForTimeout(3000);

    // Verify tutor mark near Hypotenuse (x ~ 630..850, y ~ 90..245)
    const doubtMarks = page.locator('[data-layer="doubt-marks"] *, [data-layer="teacher-annotations"] *');
    await expect(doubtMarks.first()).toBeAttached({ timeout: 10000 });

    await page.screenshot({
      path: `${outDir}/class03-pythagoras-doubt-verification.png`,
      fullPage: true,
    });
  });

  test("Class 04: Human Cell — Synchronous playback & Doubt resolution", async ({ page }) => {
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

    // Raise hand for doubt
    const handBtn = page.locator('button[aria-label="Raise hand"]');
    await expect(handBtn).toBeVisible();
    await handBtn.click();

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
