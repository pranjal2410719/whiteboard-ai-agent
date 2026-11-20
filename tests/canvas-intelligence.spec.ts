import { test, expect } from "@playwright/test";
import {
  createHeartCanvasEngine,
  CanvasIntelligenceEngine,
  humanHeartAssetMap,
} from "../src/lib/canvas-intelligence";

test.describe("Canvas Intelligence Core (CIE)", () => {
  test("initializes with the Human Heart asset and tracks 14 anatomical landmarks", () => {
    const engine = createHeartCanvasEngine();
    const state = engine.getCanvasState();

    expect(state.activeAssetId).toBe("heart-diagram");
    expect(state.displayedAssets.length).toBe(1);
    expect(state.displayedAssets[0].x).toBe(580);
    expect(state.displayedAssets[0].y).toBe(16);
    expect(state.displayedAssets[0].w).toBe(270);
    expect(state.displayedAssets[0].h).toBe(298);

    expect(humanHeartAssetMap.elements.length).toBe(14);
  });

  test("resolves elements by exact ID and by natural language aliases", () => {
    const engine = createHeartCanvasEngine();

    const ra = engine.findElement("right-atrium");
    expect(ra).not.toBeNull();
    expect(ra?.name).toBe("Right Atrium");
    expect(ra?.category).toBe("chamber");

    // Natural alias resolution
    const mitral = engine.findElement("mitral valve");
    expect(mitral).not.toBeNull();
    expect(mitral?.id).toBe("bicuspid-valve");

    const svc = engine.findElement("SVC");
    expect(svc).not.toBeNull();
    expect(svc?.id).toBe("superior-vena-cava");

    const nonExistent = engine.findElement("pancreas");
    expect(nonExistent).toBeNull();
  });

  test("accurately transforms natural 475x526 coordinates to displayed 270x298 whiteboard space", () => {
    const engine = createHeartCanvasEngine();
    const result = engine.highlightElement("superior-vena-cava");

    expect(result.success).toBe(true);
    expect(result.marks.length).toBeGreaterThan(0);

    const mark = result.marks[0];
    expect(mark.type).toBe("rect");
    // Natural SVC is at x=75, y=35, w=92, h=97
    // Scale: sx = 270/475 = 0.5684, sy = 298/526 = 0.5665
    // Displayed x = 580 + 75*0.5684 = 622.6 -> 623
    // Displayed y = 16 + 35*0.5665 = 35.8 -> 36
    // Width = 92 * 0.5684 = 52.3 -> 52
    // Height = 97 * 0.5665 = 55.0 -> 55
    expect(mark.x).toBeCloseTo(623 - 4, 2); // Includes -4 margin
    expect(mark.y).toBeCloseTo(36 - 4, 2);  // Includes -4 margin
  });

  test("generates exact closed SVG polygon paths for irregular anatomical chambers", () => {
    const engine = createHeartCanvasEngine();
    const result = engine.highlightElement("right-atrium");

    expect(result.success).toBe(true);
    expect(result.marks.length).toBe(1);

    const mark = result.marks[0];
    expect(mark.type).toBe("path");
    expect(mark.d).toMatch(/^M[0-9]+ [0-9]+ (?:L[0-9]+ [0-9]+ )+Z$/);
    expect(mark.fill).toBe("#f5d76e");
    expect(mark.annotation).toBe(true);
  });

  test("validates actions and prevents duplicate highlights on the same element", () => {
    const engine = createHeartCanvasEngine();

    const first = engine.highlightElement("left-ventricle");
    expect(first.success).toBe(true);
    expect(engine.getCanvasState().activeHighlights).toContain("left-ventricle");

    // Second highlight on the same element should be rejected
    const second = engine.highlightElement("left-ventricle");
    expect(second.success).toBe(false);
    expect(second.message).toContain("already has an active 'highlight'");
  });

  test("rejects actions on invalid or non-existent elements", () => {
    const engine = createHeartCanvasEngine();

    const result = engine.highlightElement("appendix");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Element ID 'appendix' does not exist");
  });

  test("draws a directional blood flow arrow between two connected chambers", () => {
    const engine = createHeartCanvasEngine();

    const arrow = engine.drawArrow("right-atrium", "right-ventricle", "#3b805c", "Tricuspid Flow");
    expect(arrow.success).toBe(true);
    expect(arrow.marks.length).toBe(2); // Path arrow + text label

    const pathMark = arrow.marks[0];
    expect(pathMark.type).toBe("path");
    expect(pathMark.d).toContain("M");
    expect(pathMark.d).toContain("L");

    const textMark = arrow.marks[1];
    expect(textMark.type).toBe("text");
    expect(textMark.text).toBe("Tricuspid Flow");
  });

  test("rejects arrow if source and target are identical", () => {
    const engine = createHeartCanvasEngine();

    const arrow = engine.drawArrow("aorta", "aorta");
    expect(arrow.success).toBe(false);
    expect(arrow.message).toContain("Arrow source and target cannot be the same element");
  });

  test("supports precision circle, underline, and annotation callouts", () => {
    const engine = createHeartCanvasEngine();

    const circle = engine.circleElement("bicuspid-valve");
    expect(circle.success).toBe(true);
    expect(circle.marks[0].type).toBe("ellipse");
    expect(circle.marks[0].strokeWidth).toBe(2.8);

    const underline = engine.underlineElement("septum");
    expect(underline.success).toBe(true);
    expect(underline.marks[0].type).toBe("path");

    const annotation = engine.addAnnotation("left-atrium", "Receives from 4 pulm. veins");
    expect(annotation.success).toBe(true);
    expect(annotation.marks[0].type).toBe("text");
    expect(annotation.marks[0].text).toBe("Receives from 4 pulm. veins");
  });

  test("tracks state changes and supports erasing specific teacher marks", () => {
    const engine = createHeartCanvasEngine();

    engine.highlightElement("right-atrium");
    engine.circleElement("tricuspid-valve");
    expect(engine.getCanvasState().activeAnnotations.length).toBe(2);

    const erase = engine.eraseTeacherMark("right-atrium");
    expect(erase.success).toBe(true);
    expect(engine.getCanvasState().activeAnnotations.length).toBe(1);
    expect(engine.getCanvasState().activeHighlights).not.toContain("right-atrium");

    engine.clearAllAnnotations();
    expect(engine.getCanvasState().activeAnnotations.length).toBe(0);
  });

  test("flags tentative regions for verification in the asset map", () => {
    const engine = createHeartCanvasEngine();

    const aorticValve = engine.findElement("aortic-valve");
    expect(aorticValve).not.toBeNull();
    expect(aorticValve?.verificationStatus).toBe("tentative");
    expect(aorticValve?.confidence).toBe(0.85);

    const lv = engine.findElement("left-ventricle");
    expect(lv?.verificationStatus).toBe("verified");
    expect(lv?.confidence).toBe(0.98);
  });
});
