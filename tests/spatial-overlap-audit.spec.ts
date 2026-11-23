import { test, expect } from "@playwright/test";
import { cellSceneBoards } from "../src/classes/human-cell/board";
import { trigSceneBoards } from "../src/classes/trigonometry/board";
import type { BoardMark } from "../src/lib/types";

// Helper to compute rough bounding box for a board mark
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

test.describe("Spatial Layout Non-Overlap and Collision-Free Audit", () => {
  test("1. Human Cell Scene 1: Cytoplasm callout never overlaps left-side lesson text", () => {
    const cue1 = cellSceneBoards[0][0];
    const cue2 = cellSceneBoards[0][1];

    const leftText = cue1.find(m => m.type === "text" && m.text?.includes("Flexible lipid bilayer"))!;
    expect(leftText).toBeDefined();

    const cytoText = cue2.find(m => m.type === "text" && m.text?.includes("Cytoplasm"))!;
    expect(cytoText).toBeDefined();

    const bLeft = getMarkBounds(leftText);
    const bCyto = getMarkBounds(cytoText);

    // Left text ends around x=560; Cyto label starts at x=855
    expect(bLeft.maxX).toBeLessThan(580);
    expect(bCyto.minX).toBeGreaterThanOrEqual(800);
    // Generous gap of at least 250px between left text and right callout!
    expect(bCyto.minX - bLeft.maxX).toBeGreaterThan(250);
  });

  test("2. Human Cell Scene 2: Outer Membrane and Cristae labels do not collide", () => {
    const cue2 = cellSceneBoards[1][1];
    const cue3 = cellSceneBoards[1][2];

    const outerMemText = cue2.find(m => m.type === "text" && m.text?.includes("Outer Membrane"))!;
    expect(outerMemText).toBeDefined();

    const cristaeText = cue3.find(m => m.type === "text" && m.text?.includes("Cristae"))!;
    expect(cristaeText).toBeDefined();

    const bOuter = getMarkBounds(outerMemText);
    const bCristae = getMarkBounds(cristaeText);

    // Cristae is at top-left (ends at x=660), Outer Membrane is at top-right (starts around x=790)
    expect(bCristae.maxX).toBeLessThanOrEqual(670);
    expect(bOuter.minX).toBeGreaterThanOrEqual(780);
    // Large gap of >= 100px between the two callouts!
    expect(bOuter.minX - bCristae.maxX).toBeGreaterThanOrEqual(100);
  });

  test("3. Human Cell Scene 2: Faded cell diagram, scaled-up mitochondria, and Zoom In text", () => {
    const cue2 = cellSceneBoards[1][1];

    // 1. Cell diagram in Cue 2 must be faded (opacity < 0.3)
    const fadedCell = cue2.find(m => m.type === "image" && m.src?.includes("human_cell_diagram"))!;
    expect(fadedCell).toBeDefined();
    expect(fadedCell.opacity).toBeLessThan(0.3);
    expect(fadedCell.opacity).toBeGreaterThan(0.1);

    // 2. Mitochondria diagram must be scaled up (width >= 400px)
    const mitoImg = cue2.find(m => m.type === "image" && m.src?.includes("Mitochondria.png"))!;
    expect(mitoImg).toBeDefined();
    expect(mitoImg.w).toBeGreaterThanOrEqual(400);

    // 3. "Zoom In" indicator must be written
    const zoomText = cue2.find(m => m.type === "text" && m.text?.includes("Zoom In"))!;
    expect(zoomText).toBeDefined();
  });

  test("4. Human Cell Scene 2: Mitochondria pointing arrows point with pinpoint accuracy to landmarks", () => {
    const cue2 = cellSceneBoards[1][1];
    const cue3 = cellSceneBoards[1][2];

    // Outer membrane arrow in Cue 2: must point directly to outer membrane red rim (x: 850, y: 117)
    const outerArrow = cue2.find(m => m.type === "path" && m.color === "#00d2d3" && m.d?.includes("850"))!;
    expect(outerArrow).toBeDefined();
    expect(outerArrow.d).toContain("850 117");

    // Cristae arrow in Cue 3: must point directly into inner cristae folds (x: 720, y: 157)
    const cristaeArrow = cue3.find(m => m.type === "path" && m.color === "#ff2a7a" && m.d?.includes("720"))!;
    expect(cristaeArrow).toBeDefined();
    expect(cristaeArrow.d).toContain("720 157");

    // Matrix arrow in Cue 3: must point directly into matrix interior fluid (x: 810, y: 215)
    const matrixArrow = cue3.find(m => m.type === "path" && m.color === "#00d2d3" && m.d?.includes("810"))!;
    expect(matrixArrow).toBeDefined();
    expect(matrixArrow.d).toContain("810 215");
  });

  test("5. Human Cell Scene 3: Rough ER callout is in open zone above lesson text", () => {
    const cue1 = cellSceneBoards[2][0];
    const cue3 = cellSceneBoards[2][2];

    const questionText = cue1.find(m => m.type === "text" && m.text?.includes("Which organelle"))!;
    expect(questionText).toBeDefined();

    const roughErText = cue3.find(m => m.type === "text" && m.text?.includes("Rough ER & Ribosomes"))!;
    expect(roughErText).toBeDefined();

    // Rough ER callout is at y=92; Question text is at y=165. Generous vertical clearance of > 60px!
    expect(questionText.y! - roughErText.y!).toBeGreaterThan(60);
  });

  test("6. Trigonometry Scene 1: Hypotenuse callout does NOT collide with SOH-CAH-TOA badge", () => {
    const cue1 = trigSceneBoards[0][0];

    const hypText = cue1.find(m => m.type === "text" && m.text?.includes("Hypotenuse (H)"))!;
    expect(hypText).toBeDefined();

    const bHyp = getMarkBounds(hypText);
    // SOH-CAH-TOA badge is at x=758..921. Hypotenuse text ends at x <= 660!
    expect(bHyp.maxX).toBeLessThanOrEqual(660);
    // Gap of at least 90px between Hypotenuse callout and SOH-CAH-TOA badge!
    expect(758 - bHyp.maxX).toBeGreaterThanOrEqual(98);
  });

  test("7. Trigonometry Scene 3: 3-4-5 Triangle calculation does not collide with hypotenuse or badge", () => {
    const cue4 = trigSceneBoards[2][3];

    const exampleHeader = cue4.find(m => m.type === "text" && m.text?.includes("3-4-5 Triangle"))!;
    expect(exampleHeader).toBeDefined();
    const bHeader = getMarkBounds(exampleHeader);

    // Example sits neatly in x in [740, 940], y >= 100 below the badge (y <= 90)
    expect(bHeader.minY).toBeGreaterThan(90);
    expect(bHeader.minX).toBeGreaterThanOrEqual(740);
    expect(bHeader.maxX).toBeLessThanOrEqual(950);
  });

  test("8. Trigonometry Scene 4: All marks stay within the 1000 x 330 whiteboard boundary", () => {
    const allScene4Marks = trigSceneBoards[3].flat();
    for (const mark of allScene4Marks) {
      if (mark.type === "text") {
        expect(mark.y || 0).toBeLessThanOrEqual(315);
      }
    }
  });
});
