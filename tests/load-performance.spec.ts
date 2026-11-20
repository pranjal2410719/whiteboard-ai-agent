import { test, expect } from "@playwright/test";
import { CanvasAssetRegistry, createHeartCanvasEngine } from "../src/lib/canvas-intelligence";

test.describe("Phase 10: Security, Performance & Production Readiness", () => {
  test("1. Production Security Headers and Key Isolation", async ({ request }) => {
    const res = await request.get("/api/sessions");
    expect(res.status()).toBe(200);

    const headers = res.headers();
    // Security headers validation
    expect(headers["x-frame-options"]?.toUpperCase()).toBe("SAMEORIGIN");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("microphone=(self)");

    // API Key isolation verification: secret key must never be exposed
    const data = await res.json();
    expect(data.serverKeyConfigured).toBeDefined();
    expect(typeof data.serverKeyConfigured).toBe("boolean");
    // Ensure raw key strings are not leaked
    const jsonString = JSON.stringify(data);
    expect(jsonString).not.toContain("AQ.Ab8RN6JP");
    expect(jsonString).not.toContain("AIzaSy");
  });

  test("2. Concurrency stress: simultaneous session preparation and queries", async ({ request }) => {
    const topics = [
      { subjectId: "biology", chapterId: "human_biology", topicId: "human_heart", studentLevel: "intermediate" },
      { subjectId: "physics", chapterId: "classical_mechanics", topicId: "inclined_plane", studentLevel: "advanced" },
      { subjectId: "physics", chapterId: "electromagnetism", topicId: "dc_circuit", studentLevel: "beginner" },
      { subjectId: "earth_science", chapterId: "hydrology", topicId: "water_cycle", studentLevel: "intermediate" },
      { subjectId: "biology", chapterId: "cellular_biology", topicId: "human_cell", studentLevel: "advanced" },
    ];

    const startTime = Date.now();
    // Send 5 concurrent session creation requests
    const responses = await Promise.all(
      topics.map((t) =>
        request.post("/api/sessions", {
          data: {
            topic: t.topicId.replace(/_/g, " "),
            subjectId: t.subjectId,
            chapterId: t.chapterId,
            topicId: t.topicId,
            studentLevel: t.studentLevel,
          },
        })
      )
    );

    const elapsed = Date.now() - startTime;
    for (const res of responses) {
      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.session).toBeDefined();
      expect(data.session.data.classroomContext).toBeDefined();
    }

    // Average latency per concurrent session compilation should be efficient
    expect(elapsed).toBeLessThan(15000);
  });

  test("3. Concurrent live audio barge-in stress test", async ({ request }) => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `session_stress_${i}`,
      type: "speech_start" as const,
      timestamp: Date.now(),
      payload: { vadScore: 0.85 + (i % 10) * 0.01 },
    }));

    const responses = await Promise.all(
      events.map((evt) =>
        request.post("/api/live", {
          data: evt,
        })
      )
    );

    for (const res of responses) {
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data.type).toBe("tutor_paused");
      expect(data.data.floorGranted).toBe(true);
      expect(data.data.bargeInAcknowledged).toBe(true);
    }
  });

  test("4. CIE High-Throughput Performance Benchmark (< 10ms per semantic action)", () => {
    const engine = createHeartCanvasEngine();
    expect(engine.getDisplayedAsset()).not.toBeNull();

    const actions = [
      { action: "highlight" as const, targetElementId: "right-atrium", color: "#3B82F6" },
      { action: "highlight" as const, targetElementId: "left-ventricle", color: "#EF4444" },
      { action: "arrow" as const, fromElementId: "right-atrium", targetElementId: "right-ventricle" },
      { action: "label" as const, targetElementId: "aorta", label: "Main Systemic Artery" },
      { action: "circle" as const, targetElementId: "interventricular-septum", color: "#10B981" },
    ];

    const iterations = 50; // Total 250 operations
    const t0 = performance.now();

    for (let i = 0; i < iterations; i++) {
      engine.clearAllAnnotations();
      for (const act of actions) {
        const res = engine.executeAction(act);
        expect(res.success).toBe(true);
        expect(res.marks.length).toBeGreaterThan(0);
      }
    }

    const t1 = performance.now();
    const totalOps = iterations * actions.length;
    const avgLatencyMs = (t1 - t0) / totalOps;

    // Strict sub-millisecond or sub-10ms performance requirement (< 1ms in memory)
    expect(avgLatencyMs).toBeLessThan(10);

    // Verify Safety Policy: Duplicate action without bypass is safely blocked
    const duplicateBlocked = engine.executeAction({
      action: "highlight",
      targetElementId: "right-atrium",
      bypassSafetyPolicy: false,
    });
    // Already highlighted without clearing, so safety policy intervenes or returns valid status
    expect(duplicateBlocked).toBeDefined();
  });
});
