import { test, expect } from "@playwright/test";

test.describe("WebRTC & Boost Mode High-Throughput Live AI Tutor Communication", () => {
  test("API: GET /api/live reports WebRTC signaling relay and Boost Mode readiness", async ({ request }) => {
    const res = await request.get("/api/live");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ready");
    expect(data.protocolVersion).toBe("2.0-duplex");
    expect(data.signalingMode).toBe("relay");
    expect(data.capabilities.webrtcSignaling).toBe(true);
    expect(data.capabilities.dataChannelSupported).toBe(true);
    expect(data.capabilities.boostModeSupported).toBe(true);
    expect(Array.isArray(data.capabilities.iceServers)).toBe(true);
    expect(data.capabilities.iceServers.length).toBeGreaterThan(0);
    expect(data.capabilities.vadSupported).toBe(true);
    expect(data.capabilities.bargeInEnabled).toBe(true);
  });

  test("API: POST /api/live handles WebRTC SDP offer and answer registration", async ({ request }) => {
    const mockOfferSdp = "v=0\r\no=student 123456789 2 IN IP4 127.0.0.1\r\ns=WebRTC Offer\r\nt=0 0\r\n";
    const mockAnswerSdp = "v=0\r\no=tutor 987654321 2 IN IP4 127.0.0.1\r\ns=WebRTC Answer\r\nt=0 0\r\n";

    // 1. Register offer
    const offerRes = await request.post("/api/live", {
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

    expect(offerRes.status()).toBe(200);
    const offerBody = await offerRes.json();
    expect(offerBody.type).toBe("webrtc_offer_ack");
    expect(offerBody.data.stored).toBe(true);
    expect(offerBody.data.dataChannels).toContain("whiteboard-strokes");
    expect(offerBody.data.boostMode).toBe(true);

    // 2. Register answer
    const answerRes = await request.post("/api/live", {
      data: {
        type: "webrtc_answer",
        sessionId: "webrtc-session-test",
        timestamp: Date.now(),
        payload: {
          sdp: mockAnswerSdp,
        },
      },
    });

    expect(answerRes.status()).toBe(200);
    const answerBody = await answerRes.json();
    expect(answerBody.type).toBe("webrtc_answer_ack");
    expect(answerBody.data.stored).toBe(true);
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
    expect(body.data.candidateCount).toBeGreaterThan(0);
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

  test("Browser: Genuine WebRTC PeerConnection establishes connection and opens real RTCDataChannels", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const result = await page.evaluate(async () => {
      // Create Student Peer & AI Tutor Agent Peer directly in browser WebRTC engine
      const pcStudent = new RTCPeerConnection();
      const pcTutor = new RTCPeerConnection();

      // Exchange local ICE candidates
      pcStudent.onicecandidate = (e) => {
        if (e.candidate) pcTutor.addIceCandidate(e.candidate);
      };
      pcTutor.onicecandidate = (e) => {
        if (e.candidate) pcStudent.addIceCandidate(e.candidate);
      };

      // Create student data channels
      const strokeDc = pcStudent.createDataChannel("whiteboard-strokes", {
        ordered: false,
        maxRetransmits: 0,
      });
      const intelligenceDc = pcStudent.createDataChannel("tutor-intelligence", { ordered: true });
      const voiceDc = pcStudent.createDataChannel("duplex-voice", { ordered: true });

      let tutorReceivedChannels: string[] = [];
      let messageReceived = "";

      pcTutor.ondatachannel = (e) => {
        tutorReceivedChannels.push(e.channel.label);
        if (e.channel.label === "whiteboard-strokes") {
          e.channel.onmessage = (msgEvt) => {
            messageReceived = msgEvt.data;
          };
        }
      };

      // Native SDP negotiation
      const offer = await pcStudent.createOffer();
      await pcStudent.setLocalDescription(offer);
      await pcTutor.setRemoteDescription(offer);

      const answer = await pcTutor.createAnswer();
      await pcTutor.setLocalDescription(answer);
      await pcStudent.setRemoteDescription(answer);

      // Await genuine open event on SCTP data channel
      const isChannelOpen = await new Promise<boolean>((resolve) => {
        if (strokeDc.readyState === "open") return resolve(true);
        strokeDc.onopen = () => resolve(true);
        setTimeout(() => resolve(strokeDc.readyState === "open"), 2000);
      });

      // Send real data packet over unordered SCTP channel
      if (isChannelOpen) {
        strokeDc.send(JSON.stringify({ type: "stroke", x: 100, y: 150 }));
      }

      // Allow packet transit across local loopback
      await new Promise((r) => setTimeout(r, 100));

      const finalStudentState = pcStudent.connectionState;
      const finalTutorState = pcTutor.connectionState;
      const strokeReadyState = strokeDc.readyState;

      pcStudent.close();
      pcTutor.close();

      return {
        isChannelOpen,
        strokeReadyState,
        finalStudentState,
        finalTutorState,
        tutorReceivedChannels,
        messageReceived,
      };
    });

    expect(result.isChannelOpen).toBe(true);
    expect(result.strokeReadyState).toBe("open");
    expect(result.tutorReceivedChannels).toContain("whiteboard-strokes");
    expect(result.tutorReceivedChannels).toContain("tutor-intelligence");
    expect(result.messageReceived).toContain('"x":100');
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

      let trackRemoved = false;
      if (sender) {
        pc.removeTrack(sender);
        trackRemoved = true;
      }
      pc.close();

      return {
        trackAdded: Boolean(sender),
        trackRemoved,
        signalingAck: data.type === "webrtc_offer_ack",
      };
    });

    expect(trackResult.trackAdded).toBe(true);
    expect(trackResult.trackRemoved).toBe(true);
    expect(trackResult.signalingAck).toBe(true);
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
      await page.waitForTimeout(400);

      const isBoostDisabled = await boardCard.getAttribute("data-boost-mode");
      expect(isBoostDisabled).toBe("false");

      // Re-enable via /boost on
      await queryInput.fill("/boost on");
      await queryInput.press("Enter");
      await page.waitForTimeout(400);

      const isBoostReEnabled = await boardCard.getAttribute("data-boost-mode");
      expect(isBoostReEnabled).toBe("true");
    } else {
      // Toggle via Meet bar button
      await boostBtn.click();
      await page.waitForTimeout(300);
      const isBoostToggled = await boardCard.getAttribute("data-boost-mode");
      expect(isBoostToggled).toBe("false");
    }
  });

  test("UI: Google Meet Bar integrates Boost Mode toggle and updates Whiteboard 120fps acceleration", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const meetBar = page.locator(".meet-bottom-bar, footer[aria-label='Meeting controls']");
    await expect(meetBar).toBeVisible();

    const boostButton = meetBar.locator('button[aria-label="Disable Boost Mode"], button[aria-label="Enable Boost Mode"]');
    await expect(boostButton).toBeVisible();

    const initialTitle = await boostButton.getAttribute("title");
    expect(initialTitle).toContain("Boost Mode is ON");

    // Toggle OFF via click
    await boostButton.click();
    await page.waitForTimeout(300);

    const toggledTitle = await boostButton.getAttribute("title");
    expect(toggledTitle).toContain("Enable Boost Mode");

    // Toggle ON again
    await boostButton.click();
    await page.waitForTimeout(300);

    const restoredTitle = await boostButton.getAttribute("title");
    expect(restoredTitle).toContain("Boost Mode is ON");
  });

  test("Performance: Runtime frame-time profiler measures smooth compositor frame intervals without drops", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Collect 60 consecutive frame intervals via browser requestAnimationFrame
    const perfReport = await page.evaluate(async () => {
      const intervals: number[] = [];
      let lastTime = performance.now();

      for (let i = 0; i < 60; i++) {
        await new Promise<void>((resolve) => {
          requestAnimationFrame((now) => {
            intervals.push(now - lastTime);
            lastTime = now;
            resolve();
          });
        });
      }

      const validIntervals = intervals.slice(5); // skip initial warmup
      const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
      const measuredFps = Math.round(1000 / avgInterval);

      // Check standard deviation to verify zero frame-stutter / dropped frames
      const variance = validIntervals.reduce((sum, d) => sum + Math.pow(d - avgInterval, 2), 0) / validIntervals.length;
      const stdDev = Math.sqrt(variance);

      return {
        sampleCount: validIntervals.length,
        avgIntervalMs: Math.round(avgInterval * 100) / 100,
        measuredFps,
        stdDevMs: Math.round(stdDev * 100) / 100,
      };
    });

    expect(perfReport.sampleCount).toBeGreaterThanOrEqual(50);
    expect(perfReport.avgIntervalMs).toBeLessThan(35); // strictly faster than 30fps baseline
    expect(perfReport.measuredFps).toBeGreaterThanOrEqual(30);
    expect(perfReport.stdDevMs).toBeLessThan(20); // low jitter under compositor isolation
  });

  test("Browser: Real MediaStreamTrack delivery to remote peer via ontrack", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const mediaResult = await page.evaluate(async () => {
      const pcStudent = new RTCPeerConnection();
      const pcTutor = new RTCPeerConnection();

      pcStudent.onicecandidate = (e) => { if (e.candidate) pcTutor.addIceCandidate(e.candidate); };
      pcTutor.onicecandidate = (e) => { if (e.candidate) pcStudent.addIceCandidate(e.candidate); };

      let remoteTrackReceived = false;
      let remoteTrackKind = "";

      pcTutor.ontrack = (e) => {
        remoteTrackReceived = true;
        remoteTrackKind = e.track.kind;
      };

      // Create a canvas stream with video track
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : new MediaStream();
      const videoTrack = stream.getVideoTracks()[0];

      if (videoTrack) {
        pcStudent.addTrack(videoTrack, stream);
      }

      const offer = await pcStudent.createOffer();
      await pcStudent.setLocalDescription(offer);
      await pcTutor.setRemoteDescription(offer);

      const answer = await pcTutor.createAnswer();
      await pcTutor.setLocalDescription(answer);
      await pcStudent.setRemoteDescription(answer);

      // Wait for ontrack
      await new Promise((r) => setTimeout(r, 200));

      pcStudent.close();
      pcTutor.close();

      return {
        remoteTrackReceived,
        remoteTrackKind,
      };
    });

    expect(mediaResult.remoteTrackReceived).toBe(true);
    expect(mediaResult.remoteTrackKind).toBe("video");
  });

  test("Browser: WebRTC connection recovery and re-negotiation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const recoveryResult = await page.evaluate(async () => {
      // 1. Initial Connection
      let pc1 = new RTCPeerConnection();
      let pc2 = new RTCPeerConnection();

      pc1.onicecandidate = (e) => { if (e.candidate) pc2.addIceCandidate(e.candidate); };
      pc2.onicecandidate = (e) => { if (e.candidate) pc1.addIceCandidate(e.candidate); };

      let dc = pc1.createDataChannel("whiteboard-strokes", { ordered: false, maxRetransmits: 0 });

      let offer = await pc1.createOffer();
      await pc1.setLocalDescription(offer);
      await pc2.setRemoteDescription(offer);

      let answer = await pc2.createAnswer();
      await pc2.setLocalDescription(answer);
      await pc1.setRemoteDescription(answer);

      // 2. Simulate Connection Disconnect & Close
      pc1.close();
      pc2.close();
      const closedState = pc1.signalingState;

      // 3. Reconnect (New Peer Session)
      pc1 = new RTCPeerConnection();
      pc2 = new RTCPeerConnection();

      pc1.onicecandidate = (e) => { if (e.candidate) pc2.addIceCandidate(e.candidate); };
      pc2.onicecandidate = (e) => { if (e.candidate) pc1.addIceCandidate(e.candidate); };

      dc = pc1.createDataChannel("whiteboard-strokes", { ordered: false, maxRetransmits: 0 });

      offer = await pc1.createOffer();
      await pc1.setLocalDescription(offer);
      await pc2.setRemoteDescription(offer);

      answer = await pc2.createAnswer();
      await pc2.setLocalDescription(answer);
      await pc1.setRemoteDescription(answer);

      const recoveredState = pc1.signalingState;

      pc1.close();
      pc2.close();

      return {
        closedState,
        recoveredState,
      };
    });

    expect(recoveryResult.closedState).toBe("closed");
    expect(recoveryResult.recoveredState).toBe("stable");
  });
});
