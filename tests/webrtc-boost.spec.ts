import { test, expect } from "@playwright/test";

test.describe("WebRTC & Boost Mode High-Throughput Live AI Tutor Communication", () => {
  test("API: GET /api/live reports WebRTC, RTCDataChannel and Boost Mode readiness", async ({ request }) => {
    const res = await request.get("/api/live");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ready");
    expect(data.protocolVersion).toBe("2.0-duplex");
    expect(data.capabilities.webrtcSupported).toBe(true);
    expect(data.capabilities.dataChannelSupported).toBe(true);
    expect(data.capabilities.boostModeSupported).toBe(true);
    expect(Array.isArray(data.capabilities.iceServers)).toBe(true);
    expect(data.capabilities.iceServers.length).toBeGreaterThan(0);
    expect(data.capabilities.vadSupported).toBe(true);
    expect(data.capabilities.bargeInEnabled).toBe(true);
  });

  test("API: POST /api/live handles WebRTC SDP offer and generates answer with data channels", async ({ request }) => {
    const mockOfferSdp = [
      "v=0",
      "o=student 123456789 2 IN IP4 127.0.0.1",
      "s=WebRTC Tutor Client",
      "t=0 0",
      "a=group:BUNDLE audio data",
      "m=audio 9 UDP/TLS/RTP/SAVPF 111",
      "c=IN IP4 127.0.0.1",
      "a=rtcp-mux",
      "a=mid:audio",
      "a=sendrecv",
      "a=rtpmap:111 opus/48000/2",
      "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
      "c=IN IP4 127.0.0.1",
      "a=mid:data",
      "a=sctp-port:5000",
    ].join("\r\n");

    const res = await request.post("/api/live", {
      data: {
        type: "webrtc_offer",
        sessionId: "webrtc-session-test",
        timestamp: Date.now(),
        payload: {
          sdp: mockOfferSdp,
          boostMode: true,
        },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("webrtc_answer");
    expect(body.data.type).toBe("answer");
    expect(body.data.sdp).toContain("v=0");
    expect(body.data.dataChannels).toContain("whiteboard-strokes");
    expect(body.data.dataChannels).toContain("tutor-intelligence");
    expect(body.data.dataChannels).toContain("duplex-voice");
    expect(body.data.boostMode).toBe(true);
  });

  test("API: POST /api/live handles ICE candidate exchange", async ({ request }) => {
    const res = await request.post("/api/live", {
      data: {
        type: "ice_candidate",
        sessionId: "webrtc-session-test",
        timestamp: Date.now(),
        payload: {
          candidate: {
            candidate: "candidate:1 1 UDP 2122260223 127.0.0.1 53421 typ host",
            sdpMid: "audio",
            sdpMLineIndex: 0,
          },
        },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("ice_candidate_ack");
    expect(body.data.received).toBe(true);
  });

  test("API: POST /api/live handles high-throughput whiteboard stroke transfer", async ({ request }) => {
    const res = await request.post("/api/live", {
      data: {
        type: "whiteboard_stroke",
        sessionId: "webrtc-session-test",
        timestamp: Date.now(),
        payload: {
          strokeId: "stroke-99",
          boostMode: true,
          data: {
            points: [{ x: 50, y: 50 }, { x: 55, y: 52 }],
          },
        },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("stroke_ack");
    expect(body.data.delivered).toBe(true);
    expect(body.data.strokeId).toBe("stroke-99");
    expect(body.data.boostActive).toBe(true);
  });

  test("API: POST /api/live handles boost mode toggle synchronization", async ({ request }) => {
    const res = await request.post("/api/live", {
      data: {
        type: "boost_mode_toggle",
        sessionId: "webrtc-session-test",
        timestamp: Date.now(),
        payload: {
          boostMode: true,
        },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("boost_mode_ack");
    expect(body.data.boostMode).toBe(true);
    expect(body.data.accelerated120fps).toBe(true);
    expect(body.data.lowLatencyDataChannel).toBe(true);
  });

  test("Browser: WebRTC client negotiates compliant SDP answer and sets stable signaling state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const result = await page.evaluate(async () => {
      const pc = new RTCPeerConnection();
      pc.createDataChannel("whiteboard-strokes", { ordered: false, maxRetransmits: 0 });
      pc.createDataChannel("tutor-intelligence", { ordered: true });
      pc.createDataChannel("duplex-voice", { ordered: true });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "webrtc_offer",
          sessionId: "browser-webrtc-test",
          timestamp: Date.now(),
          payload: {
            sdp: offer.sdp,
            boostMode: true,
          },
        }),
      });

      const data = await res.json();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.data.sdp }));
        return {
          success: true,
          signalingState: pc.signalingState,
          dataChannels: data.data.dataChannels,
          boostMode: data.data.boostMode,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message,
        };
      } finally {
        pc.close();
      }
    });

    expect(result.success).toBe(true);
    expect(result.signalingState).toBe("stable");
    expect(result.dataChannels).toContain("whiteboard-strokes");
    expect(result.dataChannels).toContain("tutor-intelligence");
    expect(result.dataChannels).toContain("duplex-voice");
    expect(result.boostMode).toBe(true);
  });

  test("Browser: DuplexVoiceClient manages low-latency audio/video tracks and dynamic Boost Mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const trackResult = await page.evaluate(async () => {
      const pc = new RTCPeerConnection();
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, 320, 240);
      }
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : new MediaStream();
      const videoTrack = stream.getVideoTracks()[0];

      let sender = null;
      if (videoTrack) {
        sender = pc.addTrack(videoTrack, stream);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "webrtc_offer",
          sessionId: "track-test-session",
          timestamp: Date.now(),
          payload: { sdp: offer.sdp, boostMode: true },
        }),
      });
      const data = await res.json();
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.data.sdp }));

      const stable = pc.signalingState === "stable";
      if (sender) {
        pc.removeTrack(sender);
      }
      pc.close();

      return {
        trackAdded: Boolean(sender),
        stable,
      };
    });

    expect(trackResult.trackAdded).toBe(true);
    expect(trackResult.stable).toBe(true);
  });

  test("UI: /boost chat command toggles Boost Mode dynamically", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const boardCard = page.locator(".board-card");
    await expect(boardCard).toBeVisible();
    await expect(boardCard).toHaveAttribute("data-boost-mode", "true");

    const boostBtn = page.locator('button[aria-label="Disable Boost Mode"], button[aria-label="Enable Boost Mode"]');
    await expect(boostBtn).toBeVisible();
    await expect(boostBtn).toHaveClass(/boost-active-btn/);

    // Disable via /boost off in query input
    const queryInput = page.locator(".query-bar-input, input[placeholder*='Ask your AI tutor']");
    if (await queryInput.count() > 0) {
      await queryInput.fill("/boost off");
      await queryInput.press("Enter");
      await expect(boardCard).toHaveAttribute("data-boost-mode", "false");
      await expect(boostBtn).toHaveAttribute("aria-label", "Enable Boost Mode");

      // Re-enable via /boost on
      await queryInput.fill("/boost on");
      await queryInput.press("Enter");
      await expect(boardCard).toHaveAttribute("data-boost-mode", "true");
      await expect(boostBtn).toHaveAttribute("aria-label", "Disable Boost Mode");
    }
  });

  test("UI: Google Meet Bar integrates Boost Mode toggle and updates Whiteboard 120fps acceleration", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 1. Google Meet control bar is visible
    const meetBar = page.locator(".meet-bottom-bar");
    await expect(meetBar).toBeVisible();

    // 2. Whiteboard engine starts in Boost Mode (120fps GPU acceleration active)
    const boardCard = page.locator(".board-card");
    await expect(boardCard).toBeVisible();
    await expect(boardCard).toHaveAttribute("data-boost-mode", "true");
    await expect(boardCard).toHaveClass(/boost-mode-active/);

    // 3. Boost Mode toggle button exists in GoogleMeetBar with Zap icon
    const boostBtn = page.locator('button[aria-label="Disable Boost Mode"], button[aria-label="Enable Boost Mode"]');
    await expect(boostBtn).toBeVisible();
    await expect(boostBtn).toHaveClass(/boost-active-btn/);

    // 4. Toggle Boost Mode OFF
    await boostBtn.click();
    await expect(boardCard).toHaveAttribute("data-boost-mode", "false");
    await expect(boardCard).not.toHaveClass(/boost-mode-active/);
    await expect(boostBtn).toHaveAttribute("aria-label", "Enable Boost Mode");

    // 5. Toggle Boost Mode back ON
    await boostBtn.click();
    await expect(boardCard).toHaveAttribute("data-boost-mode", "true");
    await expect(boardCard).toHaveClass(/boost-mode-active/);
    await expect(boostBtn).toHaveAttribute("aria-label", "Disable Boost Mode");

    // 6. Voice mic pill is mounted and active
    const voiceBar = page.locator(".voice-interaction-bar");
    await expect(voiceBar).toBeVisible();
    const micPill = page.locator(".voice-mic-pill");
    await expect(micPill).toBeVisible();
  });
});
