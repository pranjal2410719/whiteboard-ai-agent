import { test, expect } from "@playwright/test";
import { getClass, getAllClasses, isClassKey, trigBoardRegions } from "@/classes";
import { CanvasAssetRegistry } from "@/lib/canvas-intelligence/registry";
import { recordedClass } from "@/lib/recorded-classes";

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
    expect(scene1.cues.length).toBe(3);
    expect(scene1.marks.some(m => m.type === "image" && m.src?.includes("trigonometry-triangle.svg"))).toBe(true);

    // Verify Chapter 3 SOH-CAH-TOA scene
    const scene3 = rec.scenes[2];
    expect(scene3.title).toBe("Tangent and the SOH-CAH-TOA Memory Tool");
    expect(scene3.marks.some(m => m.type === "text" && m.text?.includes("SOH"))).toBe(true);
  });

  test("3. Spatial Vision & Canvas Asset Registry", async () => {
    const asset = CanvasAssetRegistry.getAsset("trigonometry");
    expect(asset).toBeDefined();
    expect(asset.assetId).toBe("trigonometry");
    expect(asset.naturalWidth).toBe(420);
    expect(asset.naturalHeight).toBe(320);

    // Verify core elements
    const elementIds = asset.elements.map(e => e.id);
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
});
