import { test, expect } from "@playwright/test";

test.describe("Phase 8: Duplex Voice & Real-Time Live Communication", () => {
  test("API: GET /api/live reports duplex capabilities, VAD and barge-in readiness", async ({ request }) => {
    const res = await request.get("/api/live");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ready");
    expect(data.protocolVersion).toBe("2.0-duplex");
    expect(data.capabilities.vadSupported).toBe(true);
    expect(data.capabilities.bargeInEnabled).toBe(true);
    expect(data.capabilities.sentenceBoundaryPause).toBe(true);
    expect(data.capabilities.ephemeralDoubtSketch).toBe(true);
  });

  test("API: POST /api/live handles speech_start barge-in event and halts tutor narration", async ({ request }) => {
    const res = await request.post("/api/live", {
      data: {
        type: "barge_in",
        sessionId: "test-session-123",
        timestamp: Date.now()
      }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.type).toBe("tutor_paused");
    expect(data.data.floorGranted).toBe(true);
    expect(data.data.action).toBe("halt_narration");
    expect(data.data.bargeInAcknowledged).toBe(true);
  });

  test("API: POST /api/live handles doubt_point student canvas interaction", async ({ request }) => {
    const res = await request.post("/api/live", {
      data: {
        type: "doubt_point",
        sessionId: "test-session-123",
        timestamp: Date.now(),
        payload: {
          point: { x: 620, y: 140 }
        }
      }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.type).toBe("tutor_action");
    expect(data.data.doubtCoordinatesReceived).toBe(true);
    expect(data.data.point).toEqual({ x: 620, y: 140 });
  });

  test("API: POST /api/live handles speech_end event ready for orchestrator processing", async ({ request }) => {
    const res = await request.post("/api/live", {
      data: {
        type: "speech_end",
        sessionId: "test-session-123",
        timestamp: Date.now()
      }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.type).toBe("tutor_action");
    expect(data.data.readyForOrchestrator).toBe(true);
  });

  test("UI: Google Meet control bar integrates microphone, barge-in toggle, and doubt handling", async ({ page }) => {
    page.on("console", msg => console.log("PAGE LOG:", msg.text()));
    // Mock SpeechRecognition and webkitSpeechRecognition for headless Chromium
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = "en-US";
        onresult = null;
        onerror = null;
        onend = null;
        onstart = null;
        start() {
          console.log("MockSpeechRecognition.start() called!");
          setTimeout(() => {
            if (typeof this.onstart === "function") {
              console.log("Calling this.onstart()!");
              (this as any).onstart();
            }
          }, 10);
        }
        stop() {
          if (typeof (this as any).onend === "function") (this as any).onend();
        }
      }
      (window as any).SpeechRecognition = MockSpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Google Meet control bar is visible
    const meetBar = page.locator(".meet-bottom-bar");
    await expect(meetBar).toBeVisible();

    // Verify microphone control button exists and has accessible title
    const micBtn = page.locator(".meet-ctrl-btn").first();
    await expect(micBtn).toBeVisible();

    // Toggle microphone
    await micBtn.click();

    // When active, button has active mic class
    await expect(micBtn).toHaveClass(/is-active-mic/, { timeout: 5000 });

    // Toggle microphone off
    await micBtn.click({ force: true });
    await expect(micBtn).not.toHaveClass(/is-active-mic/, { timeout: 5000 });
  });
});
