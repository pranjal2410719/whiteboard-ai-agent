import { test, expect } from "@playwright/test";
import { LearnerAdaptiveModel } from "../src/lib/lam/adaptive-model";

test.describe("Phase 9: Learner Adaptive Model (LAM)", () => {
  test("1. BKT Mathematical Model updates probability of mastery correctly", () => {
    const prior = LearnerAdaptiveModel.DEFAULT_BKT.prior; // 0.35
    expect(prior).toBe(0.35);

    // Correct answer observation
    const correctResult = LearnerAdaptiveModel.computeUpdatedMastery(prior, true);
    expect(correctResult.posterior).toBeGreaterThan(prior);
    expect(correctResult.nextPrior).toBeGreaterThan(prior);
    // P(L|Correct) = (0.35 * 0.92) / (0.35 * 0.92 + 0.65 * 0.15) = 0.322 / (0.322 + 0.0975) = 0.767
    expect(correctResult.posterior).toBeCloseTo(0.768, 2);
    // nextPrior = posterior + (1 - posterior) * transit = 0.768 + 0.232 * 0.12 = 0.796
    expect(correctResult.nextPrior).toBeCloseTo(0.796, 2);

    // Incorrect answer observation
    const incorrectResult = LearnerAdaptiveModel.computeUpdatedMastery(prior, false);
    expect(incorrectResult.posterior).toBeLessThan(prior);
    // P(L|Incorrect) = (0.35 * 0.08) / (0.35 * 0.08 + 0.65 * 0.85) = 0.028 / (0.028 + 0.5525) = 0.048
    expect(incorrectResult.posterior).toBeCloseTo(0.048, 2);
    // nextPrior = 0.048 + (1 - 0.048) * 0.12 = 0.162
    expect(incorrectResult.nextPrior).toBeCloseTo(0.162, 2);

    // Consecutive learning sequence: 3 correct answers should elevate mastery above 0.90
    let currentMastery = prior;
    for (let i = 0; i < 3; i++) {
      const step = LearnerAdaptiveModel.computeUpdatedMastery(currentMastery, true);
      currentMastery = step.nextPrior;
    }
    expect(currentMastery).toBeGreaterThan(0.90);
  });

  test("2. Adaptive Directives generator crafts targeted cognitive guidance", () => {
    // Empty profile
    const initialDirectives = LearnerAdaptiveModel.generateAdaptiveDirectives([]);
    expect(initialDirectives).toContain("Initial Assessment");
    expect(initialDirectives).toContain("foundational conceptual scaffolding");

    // Struggling student profile
    const strugglingProfile = [
      {
        conceptId: "systemic_circulation",
        subjectId: "biology",
        topicId: "human_heart",
        masteryScore: 0.28,
        confidenceLevel: 0.55,
        misconceptions: ["aorta_carries_deoxygenated_blood"],
        attemptCount: 2,
        lastAssessedAt: new Date().toISOString(),
      },
    ];
    const strugglingDirectives = LearnerAdaptiveModel.generateAdaptiveDirectives(strugglingProfile);
    expect(strugglingDirectives).toContain("Areas Needing Remediation");
    expect(strugglingDirectives).toContain("systemic_circulation");
    expect(strugglingDirectives).toContain("aorta_carries_deoxygenated_blood");
    expect(strugglingDirectives).toContain("analogies");

    // Proficient student profile
    const proficientProfile = [
      {
        conceptId: "cardiac_cycle",
        subjectId: "biology",
        topicId: "human_heart",
        masteryScore: 0.92,
        confidenceLevel: 0.95,
        misconceptions: [],
        attemptCount: 4,
        lastAssessedAt: new Date().toISOString(),
      },
    ];
    const proficientDirectives = LearnerAdaptiveModel.generateAdaptiveDirectives(proficientProfile);
    expect(proficientDirectives).toContain("Mastered Concepts (1): cardiac_cycle");
    expect(proficientDirectives).toContain("strong conceptual fluency");
    expect(proficientDirectives).toContain("Accelerate pace");
  });

  test("3. REST API /api/lam records and retrieves concept mastery", async ({ request }) => {
    const testSubject = "biology";
    const testTopic = `test_topic_${Date.now()}`;
    const testConcept = "mitral_valve";

    // 3a. Initial GET should be empty for this new topic
    const getRes1 = await request.get(`/api/lam?subjectId=${testSubject}&topicId=${testTopic}`);
    expect(getRes1.status()).toBe(200);
    const getData1 = await getRes1.json();
    expect(getData1.profiles).toEqual([]);
    expect(getData1.adaptiveDirectives).toContain("Initial Assessment");

    // 3b. POST assessment with misconception
    const postRes1 = await request.post("/api/lam", {
      data: {
        subjectId: testSubject,
        topicId: testTopic,
        conceptId: testConcept,
        isCorrect: false,
        misconception: "valve_flows_bidirectionally",
      },
    });
    expect(postRes1.status()).toBe(200);
    const postData1 = await postRes1.json();
    expect(postData1.success).toBe(true);
    expect(postData1.profile.conceptId).toBe(testConcept);
    expect(postData1.profile.masteryScore).toBeLessThan(0.35);
    expect(postData1.profile.misconceptions).toContain("valve_flows_bidirectionally");

    // 3c. GET now returns updated profile with remedial directives
    const getRes2 = await request.get(`/api/lam?subjectId=${testSubject}&topicId=${testTopic}`);
    expect(getRes2.status()).toBe(200);
    const getData2 = await getRes2.json();
    expect(getData2.profiles.length).toBe(1);
    expect(getData2.adaptiveDirectives).toContain("Areas Needing Remediation");
    expect(getData2.adaptiveDirectives).toContain(testConcept);

    // 3d. POST correct assessment resolves the misconception and increases mastery
    const postRes2 = await request.post("/api/lam", {
      data: {
        subjectId: testSubject,
        topicId: testTopic,
        conceptId: testConcept,
        isCorrect: true,
      },
    });
    expect(postRes2.status()).toBe(200);
    const postData2 = await postRes2.json();
    expect(postData2.profile.masteryScore).toBeGreaterThan(postData1.profile.masteryScore);
    expect(postData2.profile.misconceptions.length).toBe(0);
    expect(postData2.profile.attemptCount).toBe(2);
  });

  test("4. REST API /api/lam validates input and returns appropriate error codes", async ({ request }) => {
    // Missing conceptId
    const res1 = await request.post("/api/lam", {
      data: {
        subjectId: "biology",
        topicId: "cell",
        isCorrect: true,
      },
    });
    expect(res1.status()).toBe(400);

    // Missing isCorrect
    const res2 = await request.post("/api/lam", {
      data: {
        subjectId: "biology",
        topicId: "cell",
        conceptId: "nucleus",
      },
    });
    expect(res2.status()).toBe(400);
  });
});
