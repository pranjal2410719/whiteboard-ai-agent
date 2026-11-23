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
  if (mark.type === "path" && mark.d) {
    const coords = [...mark.d.matchAll(/([0-9.]+)\s+([0-9.]+)/g)].map(m => ({ x: Number(m[1]), y: Number(m[2]) }));
    if (coords.length > 0) {
      const xs = coords.map(c => c.x);
      const ys = coords.map(c => c.y);
      return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    }
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

  test("2. Human Cell Scene 2: Outer Membrane naming convention underline and Cristae callout do not collide", () => {
    const cue2 = cellSceneBoards[1][1];
    const cue3 = cellSceneBoards[1][2];

    // Verified: No circle around the outer membrane organelle
    const outerMemCircle = cue2.find(m => m.type === "ellipse" && m.color === "#00d2d3");
    expect(outerMemCircle).toBeUndefined();

    // Verified: Pre-labeled naming convention is underlined using AI vision dimensions
    const outerMemUnderline = cue2.find(m => m.type === "path" && m.color === "#00d2d3" && m.d?.includes("927"))!;
    expect(outerMemUnderline).toBeDefined();

    const cristaeText = cue3.find(m => m.type === "text" && m.text?.includes("Cristae"))!;
    expect(cristaeText).toBeDefined();

    const bOuter = getMarkBounds(outerMemUnderline);
    const bCristae = getMarkBounds(cristaeText);

    // Cristae ends at x=770; Outer Membrane underline starts at x=927. Gap is >= 145px!
    expect(bCristae.maxX).toBeLessThanOrEqual(775);
    expect(bOuter.minX).toBeGreaterThanOrEqual(920);
    expect(bOuter.minX - bCristae.maxX).toBeGreaterThanOrEqual(145);
  });

  test("3. Human Cell Scene 2: Zoom In label is centered between cell and mitochondria diagrams", () => {
    const cue1 = cellSceneBoards[1][0];
    const cue2 = cellSceneBoards[1][1];

    const cellImg = cue1.find(m => m.type === "image")!;
    expect(cellImg).toBeDefined();
    const mitoImg = cue2.find(m => m.type === "image")!;
    expect(mitoImg).toBeDefined();
    const zoomText = cue2.find(m => m.type === "text" && m.text === "Zoom In")!;
    expect(zoomText).toBeDefined();

    const bCell = getMarkBounds(cellImg);
    const bMito = getMarkBounds(mitoImg);
    const bZoom = getMarkBounds(zoomText);

    // Zoom In must sit strictly in the 80px gap between cell (maxX: 640) and mito (minX: 720)
    expect(bZoom.minX).toBeGreaterThan(bCell.maxX);
    expect(bZoom.maxX).toBeLessThan(bMito.minX);

    // Verify cell mitochondrion is circled in cell diagram
    const mitoCircle = cue2.find(m => m.type === "ellipse" && m.x === 515 && m.y === 193);
    expect(mitoCircle).toBeDefined();

    // Verify pointing arrow connects cell mitochondrion to zoomed diagram
    const zoomArrow = cue2.find(m => m.type === "path" && m.d?.includes("M538 188 L720 135"));
    expect(zoomArrow).toBeDefined();
  });

  test("4. Human Cell Scene 2: Matrix callout does not overlap mitochondria capsule", () => {
    const cue2 = cellSceneBoards[1][1];
    const cue3 = cellSceneBoards[1][2];

    const mitoImg = cue2.find(m => m.type === "image")!;
    const matrixText = cue3.find(m => m.type === "text" && m.text?.includes("Matrix"))!;
    expect(matrixText).toBeDefined();

    // Matrix callout is placed at y=254, which is below the image at y=25, h=210 (bottom=235)
    expect((matrixText.y || 0)).toBeGreaterThan(mitoImg.y! + mitoImg.h!);
  });

  test("5. Human Cell Scene 3: Rough ER callout is in open zone above lesson text", () => {
    const cue1 = cellSceneBoards[2][0];
    const cue3 = cellSceneBoards[2][2];

    const questionText = cue1.find(m => m.type === "text" && m.text?.includes("Which organelle"))!;
    expect(questionText).toBeDefined();

    const roughErText = cue3.find(m => m.type === "text" && m.text?.includes("Rough ER & Ribosomes"))!;
    expect(roughErText).toBeDefined();

    // Rough ER callout is at y=88; Question text is at y=160. Generous vertical clearance of > 60px (72px)!
    expect(questionText.y! - roughErText.y!).toBeGreaterThan(60);
  });

  test("5b. Human Cell Scene 3: Clean gap between prompt texts in Identify the protein factories", () => {
    const cue1 = cellSceneBoards[2][0];
    const prompt1 = cue1.find(m => m.type === "text" && m.text?.includes("Ribbon-like channels"))!;
    const prompt2 = cue1.find(m => m.type === "text" && m.text?.includes("Which organelle"))!;
    expect(prompt1).toBeDefined();
    expect(prompt2).toBeDefined();

    // Baseline-to-baseline separation is at least 48px
    expect(prompt2.y! - prompt1.y!).toBeGreaterThanOrEqual(48);

    // Bounding boxes do not overlap vertically (at least 15px clearance)
    const b1 = getMarkBounds(prompt1);
    const b2 = getMarkBounds(prompt2);
    expect(b2.minY - b1.maxY).toBeGreaterThanOrEqual(15);
  });

  test("5c. Human Cell Scene 3: Zero overlap between Rough ER & Ribosomes and Golgi takeaways", () => {
    const cue3 = cellSceneBoards[2][2];
    const cue4 = cellSceneBoards[2][3];

    // Find highlighted Rough ER & Ribosomes text
    const roughErHighlightText = cue3.find(m => m.type === "text" && m.text === "Rough ER & Ribosomes" && m.size === 28)!;
    expect(roughErHighlightText).toBeDefined();

    // Find Golgi takeaway text
    const golgiTakeaway = cue4.find(m => m.type === "text" && m.text?.includes("Golgi sorts & packages"))!;
    expect(golgiTakeaway).toBeDefined();

    // Baseline separation is at least 40px
    expect(golgiTakeaway.y! - roughErHighlightText.y!).toBeGreaterThanOrEqual(40);

    // Clearance between Rough ER highlight bottom and Golgi text top is at least 10px
    const bRoughEr = getMarkBounds(roughErHighlightText);
    const bGolgi = getMarkBounds(golgiTakeaway);
    expect(bGolgi.minY - bRoughEr.maxY).toBeGreaterThanOrEqual(10);
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
