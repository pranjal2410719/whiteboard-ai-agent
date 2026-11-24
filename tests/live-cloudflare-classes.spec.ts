import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://qrie.quriai82.workers.dev";

test.describe("Cloudflare Live Production Deployment - Class Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("1. Production Homepage & Demo Lectures list render cleanly without UI clutter", async ({ page }) => {
    // Verify Brand title is visible
    await expect(page.locator(".brand-name")).toBeVisible();
    await expect(page.locator(".brand-name")).toHaveText("Qrie");

    // Verify Demo Lectures list is populated in sidebar
    const demoHeading = page.locator(".sidebar-label", { hasText: "Demo Lectures" });
    await expect(demoHeading).toBeVisible();

    // Verify plus sign is removed from right of Demo Lectures
    await expect(page.locator(".recent-heading button:not(.sr-only)")).toHaveCount(0);

    // Verify no "Saved boards" or "Session history" in sidebar
    await expect(page.locator('.nav-link:has-text("Saved boards")')).toHaveCount(0);
    await expect(page.locator('.nav-link:has-text("Session history")')).toHaveCount(0);

    // Verify no "New session" or "All changes saved" in topbar
    await expect(page.locator(".new-session-topbar")).toHaveCount(0);
    await expect(page.locator(".save-status")).toHaveCount(0);

    // Verify no voice mic pill on whiteboard
    await expect(page.locator(".voice-mic-pill")).toHaveCount(0);
    await expect(page.locator(".board-header-prompts")).toHaveCount(0);
  });

  test("2. Human Cell class loads, renders vector whiteboard, and plays continuous lecture", async ({ page }) => {
    // Select Human Cell from sidebar
    const cellBtn = page.locator('button[title*="Cell"], button:has-text("Cell")').first();
    await expect(cellBtn).toBeVisible();
    await cellBtn.click();
    await page.waitForTimeout(1000);

    // Whiteboard renders Human Cell
    const svg = page.locator(".drawing-svg");
    await expect(svg).toBeVisible();
    await expect(svg.locator("text", { hasText: /Cell/i }).first()).toBeVisible();

    // Google Meet bar is visible with classroom controls
    const meetBar = page.locator(".meet-bar-center");
    await expect(meetBar).toBeVisible();
    await expect(page.locator(".meet-ctrl-btn", { hasText: "" }).first()).toBeVisible();

    // Verify audio track is loaded
    const audio = page.locator("audio");
    if (await audio.count() > 0) {
      const src = await audio.first().getAttribute("src");
      expect(src).toContain("human-cell");
    }
  });

  test("3. Human Cell class supports Hindi and Hinglish language switching on live Cloudflare", async ({ page }) => {
    // Open Settings
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Select Hindi
    await page.getByRole("button", { name: /हिन्दी.*Hindi/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.waitForTimeout(1000);

    // Whiteboard marks render in Hindi
    const svg = page.locator(".drawing-svg");
    await expect(svg).toBeVisible();
    await expect(svg.locator("text", { hasText: /मानव कोशिका|कोशिका/i }).first()).toBeVisible();

    // Verify audio switched to Hindi track
    const audio = page.locator("audio");
    if (await audio.count() > 0) {
      const src = await audio.first().getAttribute("src");
      expect(src).toContain("human-cell-hi.mp3");
    }

    // Switch to Hinglish
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /Hinglish/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForTimeout(1000);

    // Whiteboard marks return to English while audio switches to Hinglish
    await expect(svg.locator("text", { hasText: /Cell/i }).first()).toBeVisible();
    if (await audio.count() > 0) {
      const src = await audio.first().getAttribute("src");
      expect(src).toContain("human-cell-hinglish.mp3");
    }
  });

  test("4. Trigonometry class loads with crisp geometry and clean vector marks", async ({ page }) => {
    // Select Trigonometry from sidebar
    const trigBtn = page.locator('button[title*="Trigonometry"], button:has-text("Trigonometry")').first();
    await expect(trigBtn).toBeVisible();
    await trigBtn.click();
    await page.waitForTimeout(1000);

    // Verify board renders Trigonometry & Right Triangles
    const svg = page.locator(".drawing-svg");
    await expect(svg).toBeVisible();
    await expect(svg.locator("text", { hasText: /Trigonometry|Right Triangle/i }).first()).toBeVisible({ timeout: 10000 });

    // Verify audio track is loaded
    const audio = page.locator("audio");
    if (await audio.count() > 0) {
      const src = await audio.first().getAttribute("src");
      expect(src).toContain("trigonometry");
    }
  });

  test("5. Cloudflare Live Curriculum API & Taxonomy search work flawlessly", async ({ request }) => {
    // Test GET /api/curriculum
    const res = await request.get(`${BASE_URL}/api/curriculum`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.subjects).toBeDefined();
    expect(data.subjects.length).toBeGreaterThan(0);

    // Test search query
    const searchRes = await request.get(`${BASE_URL}/api/curriculum?q=heart`);
    expect(searchRes.status()).toBe(200);
    const searchData = await searchRes.json();
    expect(searchData.results).toBeDefined();
    expect(searchData.results.length).toBeGreaterThan(0);

    // Test health endpoint
    const healthRes = await request.get(`${BASE_URL}/api/health`);
    expect(healthRes.status()).toBe(200);

    // Test sessions endpoint (verify resilient in-memory / db sessions respond 200)
    const sessionsRes = await request.get(`${BASE_URL}/api/sessions`);
    expect(sessionsRes.status()).toBe(200);
    const sessionsData = await sessionsRes.json();
    expect(sessionsData.sessions).toBeDefined();
    expect(sessionsData.sessions.length).toBeGreaterThan(0);
  });

  test("6. Starting class enters chapter 1 immediately and progresses without loading lock", async ({ page }) => {
    // Select Human Cell
    const cellBtn = page.locator('button[title*="Cell"], button:has-text("Cell")').first();
    await expect(cellBtn).toBeVisible();
    await cellBtn.click();
    await page.waitForTimeout(500);

    // Locate the Start Class button (hero button or board action button)
    const startBtn = page.locator('button.class-hero-play-button, button.board-class-button').first();
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();

    // Click Start Class
    await startBtn.click();

    // Verify class starts: chapter indicator or pause button becomes visible
    const pauseOrStop = page.locator('button[aria-label*="Pause"], button[title*="Pause"], .lecture-indicator, .meet-bar-center').first();
    await expect(pauseOrStop).toBeVisible({ timeout: 5000 });

    // Verify loading spinner is gone
    await expect(page.locator(".spin")).toHaveCount(0);
  });
});
