import { test, expect } from "@playwright/test";
import { getClass, getAllClasses, isClassKey, trigBoardRegions } from "@/classes";
import { CanvasAssetRegistry } from "@/lib/canvas-intelligence/registry";
import { recordedClass } from "@/lib/recorded-classes";
import { guidedAnnotation } from "@/lib/annotate";

test.describe("Trigonometry Modular Class & Lecture Verification", () => {
  test("1. Modular Class Definition & Registry verification", async () => {
    expect(isClassKey("trigonometry")).toBe(true);

    const cls = getClass("trigonometry");
    expect(cls).toBeDefined();
    expect(cls?.metadata.key).toBe("trigonometry");
    expect(cls?.metadata.title).toBe("Trigonometry & Right Triangles");
    expect(cls?.metadata.subject).toBe("Mathematics");
    expect(cls?.metadata.totalSeconds).toBe(120);
    expect(cls?.metadata.audioPath).toBe("/class-audio/trigonometry-v2.mp3");

    // Verify 4 chapters
    expect(cls?.script.chapters).toHaveLength(4);
    expect(cls?.script.chapters[0].title).toBe("Right Triangles and Reference Angles");
    expect(cls?.script.chapters[1].title).toBe("The Primary Ratios: Sine and Cosine");
    expect(cls?.script.chapters[2].title).toBe("Tangent and the SOH-CAH-TOA Memory Tool");
    expect(cls?.script.chapters[3].title).toBe("Pythagorean Identity and Real-World Power");

    // Verify notes and practice
    expect(cls?.notes.notes).toHaveLength(3);
    expect(cls?.notes.practice.question).toContain("sin(θ)");
    expect(cls?.notes.practice.answer).toContain("0.6");
  });

  test("2. Recorded Class Lecture Scenes & Cues", async () => {
    const rec = recordedClass("trigonometry");
    expect(rec).toBeDefined();
    expect(rec.title).toBe("Trigonometry & Right Triangles");
    expect(rec.totalSeconds).toBe(120);
    expect(rec.scenes).toHaveLength(4);

    // Verify Chapter 1 scene
    const scene1 = rec.scenes[0];
    expect(scene1.title).toBe("Right Triangles and Reference Angles");
    expect(scene1.cues!.length).toBe(3);
    expect(scene1.marks.some(m => m.type === "image" && m.src?.includes("trigonometry-triangle.svg"))).toBe(true);

    // Verify Chapter 3 SOH-CAH-TOA scene
    const scene3 = rec.scenes[2];
    expect(scene3.title).toBe("Tangent and the SOH-CAH-TOA Memory Tool");
    expect(scene3.marks.some(m => m.type === "text" && m.text?.includes("SOH"))).toBe(true);
  });

  test("3. Spatial Vision & Canvas Asset Registry", async () => {
    const asset = CanvasAssetRegistry.getAsset("trigonometry");
    expect(asset).toBeDefined();
    expect(asset!.assetId).toBe("trigonometry");
    expect(asset!.naturalWidth).toBe(420);
    expect(asset!.naturalHeight).toBe(320);

    // Verify core elements
    const elementIds = asset!.elements.map(e => e.id);
    expect(elementIds).toContain("hypotenuse");
    expect(elementIds).toContain("opposite");
    expect(elementIds).toContain("adjacent");
    expect(elementIds).toContain("angle-theta");
    expect(elementIds).toContain("right-angle");
    expect(elementIds).toContain("soh-cah-toa");
  });

  test("4. Whiteboard UI & Lecture Playback", async ({ page }) => {
    await page.goto("http://127.0.0.1:3002/");
    await page.waitForLoadState("domcontentloaded");

    // Verify Trigonometry button exists in Demo Lectures
    const trigBtn = page.locator('button[title*="Trigonometry"]').first();
    await expect(trigBtn).toBeVisible({ timeout: 10000 });
    await trigBtn.click();
    await page.waitForTimeout(600);

    // Verify Whiteboard header and diagram
    const boardHeader = page.locator(".board-heading h2");
    await expect(boardHeader).toBeVisible();

    // Verify Trigonometry triangle image on the canvas
    const trigImg = page.locator('.drawing-svg image[href*="trigonometry-triangle.svg"]').first();
    await expect(trigImg).toBeVisible({ timeout: 5000 });

    // Verify Watch Class / Lecture button exists
    const watchClassBtn = page.locator(".board-class-button");
    if (await watchClassBtn.isVisible()) {
      await watchClassBtn.click();
      await page.waitForTimeout(800);

      // Verify lecture scene is rendered
      const liveBadge = page.locator(".live-badge");
      await expect(liveBadge).toBeVisible();
    }
  });

  test("5. High-Contrast Non-Blending Marker Colors & Diagram Vision Grounding", () => {
    const rec = recordedClass("trigonometry");
    expect(rec).toBeDefined();

    // Scene 1: Hypotenuse must use AMBER (#d35400), NEVER green (#3b805c) which blends into diagram
    const scene1 = rec.scenes[0];
    const hypCircle = scene1.marks.find(m => m.type === "ellipse" && m.x === 740 && m.y === 145);
    expect(hypCircle).toBeDefined();
    expect(hypCircle?.color).toBe("#d35400");
    expect(hypCircle?.color).not.toBe("#3b805c"); // Must NOT blend with green hypotenuse line

    // Scene 1: Angle theta must use CYAN (#00d2d3), not orange which blends with terracotta arc
    const thetaCircle = scene1.marks.find(m => m.type === "ellipse" && m.x === 838 && m.y === 240);
    expect(thetaCircle).toBeDefined();
    expect(thetaCircle?.color).toBe("#00d2d3");

    // Scene 2: Opposite leg circle must use CYAN (#00d2d3), not purple (#8a6a9e)
    const scene2 = rec.scenes[1];
    const oppCircle = scene2.marks.find(m => m.type === "ellipse" && m.x === 590 && m.y === 145);
    expect(oppCircle).toBeDefined();
    expect(oppCircle?.color).toBe("#00d2d3");
    expect(oppCircle?.color).not.toBe("#8a6a9e"); // Must NOT blend with purple opposite line

    // Scene 2: Adjacent leg circle must use MAGENTA (#ff2a7a), not blue (#507aaf)
    const adjCircle = scene2.marks.find(m => m.type === "ellipse" && m.x === 720 && m.y === 262);
    expect(adjCircle).toBeDefined();
    expect(adjCircle?.color).toBe("#ff2a7a");
    expect(adjCircle?.color).not.toBe("#507aaf"); // Must NOT blend with blue adjacent line

    // Test Dynamic Guided Diagram Vision & Grounding
    const initialBoard = getClass("trigonometry")?.initialBoard;
    expect(initialBoard).toBeDefined();

    // 1. Circle the hypotenuse via AI Vision
    const resHyp = guidedAnnotation(initialBoard!, "Circle the hypotenuse");
    expect(resHyp).not.toBeNull();
    const hypMark = resHyp?.page.marks.find(m => m.annotation && m.type === "ellipse");
    expect(hypMark).toBeDefined();
    expect(hypMark?.color).toBe("#d35400"); // Calibrated vibrant amber
    expect(hypMark?.color).not.toBe("#3b805c");

    // 2. Highlight the opposite side via AI Vision
    const resOpp = guidedAnnotation(initialBoard!, "Highlight the opposite side");
    expect(resOpp).not.toBeNull();
    const oppMark = resOpp?.page.marks.find(m => m.annotation && m.type === "path");
    expect(oppMark).toBeDefined();
    expect(oppMark?.color).toBe("#00d2d3"); // Complementary electric cyan
    expect(oppMark?.color).not.toBe("#8a6a9e");

    // 3. Underline the adjacent leg via AI Vision
    const resAdj = guidedAnnotation(initialBoard!, "Underline the adjacent side");
    expect(resAdj).not.toBeNull();
    const adjMark = resAdj?.page.marks.find(m => m.annotation && m.type === "path");
    expect(adjMark).toBeDefined();
    expect(adjMark?.color).toBe("#ff2a7a"); // High-contrast vivid magenta
    expect(adjMark?.color).not.toBe("#507aaf");
  });
});
