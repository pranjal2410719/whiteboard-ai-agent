import { test, expect } from "@playwright/test";

test.describe("Phase 6: New Session Preparation Engine", () => {
  test("API: GET /api/curriculum returns structured subjects, chapters, and topics", async ({ request }) => {
    const res = await request.get("/api/curriculum");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.subjects).toBeDefined();
    expect(Array.isArray(data.subjects)).toBe(true);

    const subjectIds = data.subjects.map((s: any) => s.id);
    expect(subjectIds).toContain("biology");
    expect(subjectIds).toContain("physics");
    expect(subjectIds).toContain("earth-science");
    expect(subjectIds).toContain("mathematics");

    const biology = data.subjects.find((s: any) => s.id === "biology");
    expect(biology.chapters.length).toBeGreaterThanOrEqual(2);
    const cardio = biology.chapters.find((c: any) => c.id === "cardiovascular-system");
    expect(cardio).toBeDefined();
    const heartTopic = cardio.topics.find((t: any) => t.id === "heart-blood-flow");
    expect(heartTopic).toBeDefined();
    expect(heartTopic.assetKey).toBe("heart-diagram");
    expect(heartTopic.learningObjectives.length).toBeGreaterThan(0);
    expect(heartTopic.mandatoryConcepts).toContain("Right Atrium");
  });

  test("API: GET /api/curriculum?q=heart searches taxonomy across titles and concepts", async ({ request }) => {
    const res = await request.get("/api/curriculum?q=heart");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.results.length).toBeGreaterThan(0);
    const heartHit = data.results.find((r: any) => r.topic.id === "heart-blood-flow");
    expect(heartHit).toBeDefined();
    expect(heartHit.subject.id).toBe("biology");
    expect(heartHit.chapter.id).toBe("cardiovascular-system");
  });

  test("API: POST /api/curriculum previews classroom context and pre-rendered marks", async ({ request }) => {
    const res = await request.post("/api/curriculum", {
      data: {
        subjectId: "biology",
        chapterId: "cardiovascular-system",
        topicId: "heart-blood-flow",
        studentLevel: "advanced"
      }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.classroomContext).toBeDefined();
    expect(data.classroomContext.topic).toBe("Human Heart & Blood Flow");
    expect(data.classroomContext.studentLevel).toBe("advanced");
    expect(data.initialPage).toBeDefined();
    expect(data.initialPage.marks.length).toBeGreaterThan(5);
    expect(data.initialPage.regions.length).toBeGreaterThan(5);
    // Verifies image mark placed on layer assets
    const imgMark = data.initialPage.marks.find((m: any) => m.type === "image");
    expect(imgMark).toBeDefined();
    expect(imgMark.layer).toBe("assets");
  });

  test("API: POST /api/sessions creates a session with full ClassroomContext and regions", async ({ request }) => {
    const res = await request.post("/api/sessions", {
      data: {
        subjectId: "physics",
        chapterId: "dc-electricity",
        topicId: "dc-circuits-ohms-law",
        studentLevel: "intermediate"
      }
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.session).toBeDefined();
    expect(data.session.data.classroomContext).toBeDefined();
    expect(data.session.data.classroomContext.subjectId).toBe("physics");
    expect(data.session.data.classroomContext.topic).toBe("DC Electric Circuit & Ohm's Law");
    expect(data.session.data.pages[0].regions.length).toBeGreaterThan(0);
  });

  test("UI: 3-step Curriculum Wizard prepares and launches live classroom", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open New Session Dialog
    await page.getByRole("button", { name: "New session", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Switch to 3-Step Curriculum Explorer tab
    await page.getByRole("tab", { name: "3-Step Curriculum Explorer" }).click();
    await expect(page.getByTestId("curriculum-picker")).toBeVisible();
    await expect(page.getByTestId("step-subjects")).toBeVisible();

    // Step 1: Select Biology
    await page.getByTestId("subject-card-biology").click();
    await expect(page.getByTestId("step-chapters")).toBeVisible();

    // Step 2: Select Cardiovascular System
    await page.getByTestId("chapter-item-cardiovascular-system").click();
    await expect(page.getByTestId("step-topics")).toBeVisible();

    // Step 3: Topic & Classroom Preparation Card
    await expect(page.getByTestId("topic-preparation-card")).toBeVisible();
    await expect(page.getByText("PREPARATION ENGINE READY")).toBeVisible();
    await expect(page.getByText("Verified CIE Asset Ready")).toBeVisible();

    // Select Advanced pedagogical level
    await page.getByRole("button", { name: "Advanced Rigor, formulas & edge cases" }).click();

    // Launch Live Classroom
    await page.getByTestId("start-prepared-class-btn").click();

    // Classroom loads
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".board-heading h2")).toHaveText("Whiteboard");

    // Fast-forward drawing animation if active
    const finishBtn = page.getByRole("button", { name: "Finish drawing" });
    if (await finishBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await finishBtn.click();
    }

    // Verify whiteboard rendered asset, lesson title, and learning objectives
    const whiteboardSvg = page.locator(".drawing-svg");
    await expect(whiteboardSvg).toBeVisible();
    await expect(whiteboardSvg.locator("image")).toBeVisible({ timeout: 10000 });
    await expect(whiteboardSvg.locator("text", { hasText: "Human Heart & Blood Flow" })).toBeVisible();
    await expect(whiteboardSvg.locator("text", { hasText: "LEARNING OBJECTIVES" })).toBeVisible();

    // Verify tutor greeting mentions the topic
    await expect(page.locator(".tutor-copy")).toContainText("Human Heart & Blood Flow");
  });

  test("UI: Quick search bar directly navigates to Step 3 preparation card", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "New session", exact: true }).click();
    await page.getByRole("tab", { name: "3-Step Curriculum Explorer" }).click();

    // Type "circuit" in the search bar
    const searchInput = page.locator(".curriculum-search-bar input");
    await searchInput.fill("circuit");

    // Click on search result item
    const searchResult = page.locator(".search-result-item", { hasText: "DC Electric Circuit & Ohm's Law" });
    await expect(searchResult).toBeVisible();
    await searchResult.click();

    // Directly in Step 3
    await expect(page.getByTestId("step-topics")).toBeVisible();
    await expect(page.getByTestId("topic-preparation-card")).toBeVisible();
    await expect(page.getByRole("heading", { name: "DC Electric Circuit & Ohm's Law" })).toBeVisible();
  });
});
