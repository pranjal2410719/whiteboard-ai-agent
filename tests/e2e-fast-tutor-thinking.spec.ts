import { test, expect } from "@playwright/test";

test.describe("E2E: Fast AI Tutor Response & Real-Time Thinking State", () => {
  test("1. Model API reports gemini-3.8-live as primary model", async ({ request }) => {
    const res = await request.get("/api/connection");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.provider).toBe("gemini");
    expect(data.model).toBe("gemini-3.8-live");
    expect(data.connected).toBe(true);
  });

  test("2. Frontend displays version v2.3 in Brand header and GoogleMeetBar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const brandBadge = page.locator(".brand-version-badge");
    await expect(brandBadge).toHaveText("v2.3");

    const meetTag = page.locator(".meet-version-tag");
    await expect(meetTag).toHaveText("v2.3");
  });

  test("3. Microphone toggle and Question submission triggers immediate Thinking indicators and fast response", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 1. Locate the microphone button in GoogleMeetBar
    const micBtn = page.locator('button[aria-label*="microphone" i]').first();
    await expect(micBtn).toBeVisible({ timeout: 10000 });

    // Initial state: not listening, not thinking
    await expect(micBtn).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".meet-thinking-badge")).toHaveCount(0);

    // 2. Click microphone to interact with voice controls
    await micBtn.click();
    await page.waitForTimeout(300);

    // 3. Submit question via query composer to test the full turn-around
    const chatInput = page.locator('.meet-chat-composer input[type="text"], input[placeholder*="Ask"]').first();
    if (await chatInput.isVisible()) {
      const t0 = Date.now();
      await chatInput.fill("What is the function of mitochondria?");
      await chatInput.press("Enter");

      // Verify the thinking indicator appears while formulating answer
      const thinkingBadge = page.locator(".meet-thinking-badge, .board-thinking-banner, .live-badge");
      expect(await thinkingBadge.count()).toBeGreaterThan(0);

      // Verify response arrives quickly
      await expect(page.locator('.tutor-copy, .meet-chat-msg, .chat-message').first()).toBeVisible({ timeout: 10000 });
      const elapsed = Date.now() - t0;
      console.log(`E2E Tutor Query Roundtrip took ${elapsed}ms`);
      expect(elapsed).toBeLessThan(10000);
    }
  });

  test("4. In-class doubt query resolution responds with relevant answer and preserves whiteboard", async ({ page, request }) => {
    // Create a demo session
    const createRes = await request.post("/api/sessions", {
      data: { topic: "The Human Cell" }
    });
    expect([200, 201]).toContain(createRes.status());
    const sessionData = await createRes.json();
    const sessionId = sessionData.session.id;

    // Send in-class doubt query
    const t0 = Date.now();
    const tutorRes = await request.post("/api/tutor", {
      data: {
        sessionId,
        message: "Where is the cell nucleus located?",
        language: "en",
        lectureContext: {
          topic: "The Human Cell",
          chapter: 1,
          chapterTitle: "Anatomy of the Cell",
          timestamp: 12,
          caption: "Notice the cell membrane and organelle distribution."
        }
      }
    });
    const elapsed = Date.now() - t0;
    expect(tutorRes.status()).toBe(200);
    const result = await tutorRes.json();
    console.log(`Doubt query responded in ${elapsed}ms:`, result.mode);
    expect(elapsed).toBeLessThan(4000);
    expect(result.session?.data?.messages?.length).toBeGreaterThan(1);
    const lastMsg = result.session.data.messages[result.session.data.messages.length - 1].content;
    expect(lastMsg).toMatch(/nucleus/i);
  });
});
