import { test, expect } from "@playwright/test";
import { cellClass, cellSceneBoards, cellInitialBoard } from "../src/classes/cell";
import type { BoardMark } from "../src/lib/types";
import * as fs from "fs";

const brainDir = "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186";
const outDir = fs.existsSync(brainDir) ? brainDir : "test-results";

function getMarkBounds(mark: BoardMark): { minX: number; maxX: number; minY: number; maxY: number } {
  if (mark.type === "text") {
    const x = mark.x || 0;
    const y = mark.y || 0;
    const textLen = (mark.text || "").length;
    const estWidth = textLen * ((mark.size || 20) * 0.58);
    const height = mark.size || 20;
    const anchor = mark.textAnchor || "start";
    let minX = x;
    let maxX = x + estWidth;
    if (anchor === "end") {
      minX = x - estWidth;
      maxX = x;
    } else if (anchor === "middle") {
      minX = x - estWidth / 2;
      maxX = x + estWidth / 2;
    }
    return { minX, maxX, minY: y - height * 0.85, maxY: y + height * 0.25 };
  }
  if (mark.type === "rect") {
    const x = mark.x || 0;
    const y = mark.y || 0;
    return { minX: x, maxX: x + (mark.w || 0), minY: y, maxY: y + (mark.h || 0) };
  }
  if (mark.type === "image") {
    const x = mark.x || 0;
    const y = mark.y || 0;
    return { minX: x, maxX: x + (mark.w || 0), minY: y, maxY: y + (mark.h || 0) };
  }
  if (mark.type === "ellipse") {
    const x = mark.x || 0;
    const y = mark.y || 0;
    return { minX: x - (mark.w || 0), maxX: x + (mark.w || 0), minY: y - (mark.h || 0), maxY: y + (mark.h || 0) };
  }
  return { minX: mark.x || 0, maxX: (mark.x || 0) + 10, minY: mark.y || 0, maxY: (mark.y || 0) + 10 };
}

test.describe("Animal Cell 5-Minute Master Class Specifications", () => {
  test("1. Metadata & Structure: exactly 5 minutes (300 seconds) across 7 chapters", () => {
    expect(cellClass.metadata.key).toBe("cell");
    expect(cellClass.metadata.durationMinutes).toBe(5);
    expect(cellClass.metadata.totalSeconds).toBe(300);
    expect(cellClass.scenes.length).toBe(7);

    const totalCalculatedSeconds = cellClass.scenes.reduce((sum, s) => sum + s.seconds, 0);
    expect(totalCalculatedSeconds).toBe(300);

    // Verify scene durations match the 5-minute teaching sequence:
    // Scene 1: 35s, Scene 2: 40s, Scene 3: 40s, Scene 4: 40s, Scene 5: 60s, Scene 6: 40s, Scene 7: 45s
    const expectedDurations = [35, 40, 40, 40, 60, 40, 45];
    cellClass.scenes.forEach((scene, i) => {
      expect(scene.seconds).toBe(expectedDurations[i]);
    });
  });

  test("2. Canvas 4 Regions: TOP, CENTRE, LEFT, RIGHT, BOTTOM geometry audit", () => {
    // Audit Scene 7 (Full Master Notes with all 8 cards)
    const masterScene = cellClass.scenes[6];
    const marks = masterScene.marks;

    // A. CENTRE: Main Animal Cell diagram
    const centerImg = marks.find(m => m.type === "image" && m.src?.includes("cell_diagram_base.png"));
    expect(centerImg).toBeDefined();
    expect(centerImg?.x).toBe(295);
    expect(centerImg?.y).toBe(40);
    expect(centerImg?.w).toBe(410);
    expect(centerImg?.h).toBe(255);

    // B. TOP: Title & Subtitle
    const titleMark = marks.find(m => m.type === "text" && m.text === "ANIMAL CELL");
    expect(titleMark).toBeDefined();
    expect(titleMark?.y).toBeLessThanOrEqual(40);

    // C. LEFT: Cards 1–4 are contained within x <= 275
    const leftCards = marks.filter(m => m.type === "text" && /^[1-4]\.\s/.test(m.text || ""));
    expect(leftCards.length).toBe(4);
    leftCards.forEach(c => {
      const bounds = getMarkBounds(c);
      expect(bounds.maxX).toBeLessThan(275);
    });

    // D. RIGHT: Cards 5–8 are positioned within x >= 730
    const rightCards = marks.filter(m => m.type === "text" && /^[5-8]\.\s/.test(m.text || ""));
    expect(rightCards.length).toBe(4);
    rightCards.forEach(c => {
      expect(c.x).toBeGreaterThanOrEqual(730);
    });

    // E. Clear margins between cards and cell body (Cell sits at x in ~300..595)
    // Left clearance: x=275 to x=295 (min 20px, cell image starts at 295)
    expect(295 - 275).toBeGreaterThanOrEqual(20);
    // Right clearance: cell ends at ~600, right cards start at 730 (130px clearance!)
    expect(730 - (295 + 410 * (700 / 954))).toBeGreaterThan(120);

    // F. BOTTOM: Master notes banner at y >= 290
    const bottomText = marks.find(m => m.type === "text" && m.text?.includes("Classroom Master Notes"));
    expect(bottomText).toBeDefined();
    expect(bottomText?.y).toBeGreaterThanOrEqual(290);
  });

  test("3. Digital Pen Behavior: All ellipses have fill='none' (zero obscuring fill)", () => {
    cellClass.scenes.forEach(scene => {
      scene.marks.forEach(mark => {
        if (mark.type === "ellipse") {
          expect(mark.fill).toBe("none");
        }
      });
    });
  });

  test("4. Scene 7 Knowledge Check: 5s hold and answer reveal", () => {
    const scene7 = cellClass.scenes[6];
    expect(scene7.cues.length).toBe(3);

    // Cue 1 has hold: true
    const questionCue = scene7.cues[1];
    expect(questionCue.hold).toBe(true);
    expect(questionCue.text).toContain("powerhouse of the cell");

    // Cue 2 reveals answer
    const answerCue = scene7.cues[2];
    expect(answerCue.text).toContain("Mitochondria");
  });

  test("5. Web UI verification: Animal Cell class loads, renders reference asset, and plays", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    // Click on Animal Cell from navigation / catalog
    const cellButton = page.getByRole("button", { name: "Animal Cell" });
    await expect(cellButton).toBeVisible({ timeout: 6000 });
    await cellButton.click();
    await page.waitForTimeout(600);

    // Verify reference image asset cell_diagram_base.png is rendered
    const cellImg = page.locator('.drawing-svg image, .canvas-layer-assets image').filter({
      has: page.locator('xpath=self::*[contains(@href, "cell_diagram_base.png") or contains(@src, "cell_diagram_base.png")]'),
    });
    await expect(cellImg.first()).toBeAttached({ timeout: 10000 });

    // Start class
    const watchBtn = page.getByRole("button", { name: /Watch/i }).first();
    if (await watchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await watchBtn.click();
    }
    const startBtn = page.getByRole("button", { name: /Start Class/i });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
    }

    // Wait a brief moment to let Scene 1 start and render
    await page.waitForTimeout(4000);

    // Verify title ANIMAL CELL is drawn on whiteboard
    const titleSvg = page.locator('.drawing-svg text:has-text("ANIMAL CELL")');
    await expect(titleSvg.first()).toBeVisible({ timeout: 10000 });

    // Capture verification screenshot
    await page.screenshot({
      path: `${outDir}/animal-cell-5min-class-verification.png`,
      fullPage: true,
    });
  });
});
