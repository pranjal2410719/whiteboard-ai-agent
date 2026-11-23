import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {
  CanvasAssetRegistry,
  createMitochondriaCanvasEngine,
  mitochondriaAssetMap,
} from "../src/lib/canvas-intelligence";
import { AssetMapValidator } from "../src/lib/canvas-intelligence/pipeline";
import { getAssetById, getAvailableAssets, createAssetPage } from "../src/lib/assets";
import { describePage, getEffectiveRegions, guidedAnnotation, matchRegion } from "../src/lib/annotate";
import { customTopicBoard, findLesson, guidedTurn, mitochondriaBoard, practice, quizPage } from "../src/lib/lessons";
import { humanCellClass, mitochondriaImg, buildMitochondriaBoard } from "../src/classes/human-cell";
import { diagrams, isDiagramKey, diagramPage } from "../src/lib/diagrams";

test.describe("Mitochondria Diagram Integration & Boosted CIE Engine", () => {
  test("1. Mitochondria diagram asset exists and is served at both public paths", async ({ request }) => {
    // Verify physical file paths
    const publicAssetPath = path.resolve(process.cwd(), "public/assets/Mitochondria.png");
    const classAssetPath = path.resolve(process.cwd(), "src/classes/human-cell/assets/Mitochondria.png");
    const symlinkClassPath = path.resolve(process.cwd(), "classes/human-cell/assets/Mitochondria.png");
    const publicClassPath = path.resolve(process.cwd(), "public/classes/human-cell/assets/Mitochondria.png");

    expect(fs.existsSync(publicAssetPath)).toBe(true);
    expect(fs.existsSync(classAssetPath)).toBe(true);
    expect(fs.existsSync(symlinkClassPath)).toBe(true);
    expect(fs.existsSync(publicClassPath)).toBe(true);

    const stat = fs.statSync(publicAssetPath);
    expect(stat.size).toBe(263989);

    // Verify HTTP serving by Next.js static asset server
    const res1 = await request.get("/assets/Mitochondria.png");
    expect(res1.ok()).toBe(true);
    expect(res1.headers()["content-type"]).toContain("image/png");

    const res2 = await request.get("/classes/human-cell/assets/Mitochondria.png");
    expect(res2.ok()).toBe(true);
    expect(res2.headers()["content-type"]).toContain("image/png");
  });

  test("2. Canvas Intelligence Engine (CIE) registers and validates Mitochondria asset map", () => {
    // Schema and boundary validation
    const validation = AssetMapValidator.validate(mitochondriaAssetMap);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);

    // Verify natural dimensions: 561 x 445
    expect(mitochondriaAssetMap.naturalWidth).toBe(561);
    expect(mitochondriaAssetMap.naturalHeight).toBe(445);
    expect(mitochondriaAssetMap.elements.length).toBe(16);

    // Verify all 8 essential anatomical landmarks and 8 naming convention labels
    const elementIds = mitochondriaAssetMap.elements.map(e => e.id);
    expect(elementIds).toContain("outer-membrane");
    expect(elementIds).toContain("inner-membrane");
    expect(elementIds).toContain("cristae");
    expect(elementIds).toContain("matrix");
    expect(elementIds).toContain("intermembrane-space");
    expect(elementIds).toContain("dna");
    expect(elementIds).toContain("ribosomes");
    expect(elementIds).toContain("atp-synthase");
    expect(elementIds).toContain("label-outer-membrane");
    expect(elementIds).toContain("label-inner-membrane");
    expect(elementIds).toContain("label-cristae");
    expect(elementIds).toContain("label-matrix");
    expect(elementIds).toContain("label-intermembrane-space");
    expect(elementIds).toContain("label-dna");
    expect(elementIds).toContain("label-ribosomes");
    expect(elementIds).toContain("label-atp-synthase");

    // All elements verified with full confidence
    for (const el of mitochondriaAssetMap.elements) {
      expect(el.verificationStatus).toBe("verified");
      expect(el.confidence).toBeGreaterThanOrEqual(0.98);
      expect(el.allowedActions.length).toBeGreaterThan(0);
      expect(el.geometry.kind).toBe("box");
      if (el.geometry.kind === "box") {
        expect(el.geometry.box.x).toBeGreaterThanOrEqual(0);
        expect(el.geometry.box.y).toBeGreaterThanOrEqual(0);
        expect(el.geometry.box.x + el.geometry.box.w).toBeLessThanOrEqual(561);
        expect(el.geometry.box.y + el.geometry.box.h).toBeLessThanOrEqual(445);
      }
    }
  });

  test("3. Registry retrieves Mitochondria asset by ID, URL, and user query aliases including 'microcondria'", () => {
    // Exact ID
    const byId = CanvasAssetRegistry.getAsset("mitochondria");
    expect(byId).toBeDefined();
    expect(byId?.assetId).toBe("mitochondria");

    // Typo / prompt alias: "microcondria"
    const byTypo = CanvasAssetRegistry.getAsset("microcondria");
    expect(byTypo).toBeDefined();
    expect(byTypo?.assetId).toBe("mitochondria");

    // Singular alias: "mitochondrion"
    const bySingular = CanvasAssetRegistry.getAsset("mitochondrion");
    expect(bySingular).toBeDefined();

    // File path queries
    const byAssetSrc = CanvasAssetRegistry.getAsset("/assets/Mitochondria.png");
    expect(byAssetSrc).toBeDefined();

    const byClassPath = CanvasAssetRegistry.getAsset("classes/human-cell/assets/Mitochondria.png");
    expect(byClassPath).toBeDefined();

    // Exact prompt path from original task
    const byTaskPromptPath = CanvasAssetRegistry.getAsset(
      "projects/qrie_tutors/test06/ai-whiteboard-tutor-platform (1)/classes/human-cell/assets/Mitochondria.png"
    );
    expect(byTaskPromptPath).toBeDefined();
    expect(byTaskPromptPath?.assetId).toBe("mitochondria");

    // Must be listed in registered assets when querying all assets
    const registered = CanvasAssetRegistry.listRegisteredAssets({ all: true });
    expect(registered.some(a => a.assetId === "mitochondria")).toBe(true);
  });

  test("4. Mitochondria CIE Engine resolves landmarks and generates accurate visual highlights and pins", () => {
    const engine = createMitochondriaCanvasEngine();
    const state = engine.getCanvasState();

    expect(state.activeAssetId).toBe("mitochondria");
    expect(state.displayedAssets.length).toBe(1);
    expect(state.displayedAssets[0].w).toBe(380);
    expect(state.displayedAssets[0].h).toBe(280);

    // Find landmarks by exact ID and natural language aliases
    const cristae = engine.findElement("cristae");
    expect(cristae).not.toBeNull();
    expect(cristae?.name).toBe("Cristae (Inner Folds)");

    const atpSynthase = engine.findElement("atp synthase");
    expect(atpSynthase).not.toBeNull();
    expect(atpSynthase?.id).toBe("atp-synthase");

    const matrix = engine.findElement("mitochondrial matrix");
    expect(matrix).not.toBeNull();
    expect(matrix?.id).toBe("matrix");

    // Highlight cristae
    const hlResult = engine.highlightElement("cristae");
    expect(hlResult.success).toBe(true);
    expect(hlResult.marks.length).toBe(1);
    const hlMark = hlResult.marks[0];
    expect(hlMark.type).toBe("rect");
    expect(hlMark.annotation).toBe(true);
    // Displayed x should be within the whiteboard diagram area [560, 940]
    expect(hlMark.x).toBeGreaterThanOrEqual(560);
    expect(hlMark.x).toBeLessThanOrEqual(940);
  });

  test("5. Asset manifest & describePage build complete spatial grounding for AI tutor", () => {
    const asset = getAssetById("mitochondria");
    expect(asset).toBeDefined();
    expect(asset?.filename).toBe("Mitochondria.png");
    expect(asset?.src).toBe("/assets/Mitochondria.png");

    // Also resolves by typo "microcondria"
    const assetByTypo = getAssetById("microcondria");
    expect(assetByTypo).toBeDefined();
    expect(assetByTypo?.id).toBe("mitochondria");

    const page = createAssetPage(asset!);
    expect(page.marks.some(m => m.type === "image" && m.src?.includes("Mitochondria.png"))).toBe(true);

    const summary = describePage(page);
    expect(summary).toContain("Mitochondria Anatomy & ATP Synthesis");
    expect(summary).toContain("diagram asset image");
    expect(summary).toContain("outer-membrane");
    expect(summary).toContain("inner-membrane");
    expect(summary).toContain("cristae");
    expect(summary).toContain("matrix");
    expect(summary).toContain("atp-synthase");
    expect(summary).toContain("left-pin");
    expect(summary).toContain("right-pin");
  });

  test("6. Human Cell class integrates Mitochondria diagram in Scene 2 cues with non-overlapping layout", () => {
    expect(humanCellClass.metadata.key).toBe("human-cell");
    expect(humanCellClass.scenes.length).toBe(4);

    // Scene 2 is "The nucleus and energy powerhouses"
    const scene2 = humanCellClass.scenes[1];
    expect(scene2.title).toContain("nucleus");

    // Verify Scene 2 includes both the human cell diagram and the dedicated Mitochondria diagram
    const cellImgMark = scene2.marks.find(m => m.type === "image" && m.src?.includes("human_cell_diagram"));
    const mitoImgMark = scene2.marks.find(m => m.type === "image" && m.src?.includes("Mitochondria.png"));
    expect(cellImgMark).toBeDefined();
    expect(mitoImgMark).toBeDefined();

    // Verify buildMitochondriaBoard helper creates dedicated deep dive page with calibrated mitochondriaBoardRegions
    const mitoBoard = buildMitochondriaBoard(false);
    expect(mitoBoard.title).toContain("Mitochondria");
    expect(mitoBoard.marks.some(m => m.type === "image" && m.src?.includes("Mitochondria.png"))).toBe(true);

    // Regions must be mitochondria regions (cristae, outer-membrane, etc.), NOT human-cell regions
    expect(mitoBoard.regions).toBeDefined();
    const regionIds = mitoBoard.regions!.map(r => r.id);
    expect(regionIds).toContain("cristae");
    expect(regionIds).toContain("outer-membrane");
    expect(regionIds).toContain("matrix");
    expect(regionIds).toContain("atp-synthase");
    expect(regionIds).not.toContain("rough-er"); // Must NOT be cellBoardRegions!

    // Regions must be calibrated in board coordinates (x >= 550 for layout x=550)
    for (const r of mitoBoard.regions!) {
      expect(r.x).toBeGreaterThanOrEqual(550);
      expect(r.y).toBeGreaterThanOrEqual(12);
    }
  });

  test("7. Diagrams registry includes 'mitochondria' and 'mitochondria-diagram' with calibrated coordinates", () => {
    expect(isDiagramKey("mitochondria")).toBe(true);
    expect(isDiagramKey("mitochondria-diagram")).toBe(true);

    const mitoDiag = diagrams["mitochondria"];
    expect(mitoDiag.src).toBe("/assets/Mitochondria.png");
    expect(mitoDiag.alt).toContain("Mitochondria");
    expect(mitoDiag.regions.length).toBe(16);

    // Verify diagramPage produces properly shifted board coordinates for both x and y
    const dp = diagramPage("mitochondria");
    expect(dp.regions).toBeDefined();
    for (const r of dp.regions!) {
      expect(r.x).toBeGreaterThanOrEqual(550);
      expect(r.y).toBeGreaterThanOrEqual(12);
    }
    const cristae = dp.regions!.find(r => r.id === "cristae");
    expect(cristae).toBeDefined();
    expect(cristae!.x).toBe(550 + 136);
    expect(cristae!.y).toBe(12 + 122);
  });

  test("8. Tutor prompt response logic uses Mitochondria diagram when explaining 'microcondria' or worked examples", () => {
    // Session in guided mode
    const dummySession = {
      title: "Human Cell",
      subject: "Biology",
      lessonKey: "human-cell",
      pages: [humanCellClass.initialBoard],
      pageIndex: 0,
      messages: [],
      suggestions: [],
      saved: false,
      mode: "guided" as const,
      quiz: null,
      lecture: null,
    };

    // 1. Student asks to explain the topic of microcondria (with /boost/boost command)
    const turn1 = guidedTurn(
      dummySession,
      "when you tring to explain the topic of the microcondria you have to use this diagram for that projects/qrie_tutors/test06/ai-whiteboard-tutor-platform (1)/classes/human-cell/assets/Mitochondria.png /boost/boost"
    );

    expect(turn1.page).not.toBeNull();
    const hasMitoImg1 = turn1.page?.marks.some(
      m => m.type === "image" && m.src?.includes("Mitochondria.png")
    );
    expect(hasMitoImg1).toBe(true);
    expect(turn1.explanation).toContain("Mitochondria");
    expect(turn1.explanation).toContain("cristae");

    // 2. Student asks for worked example of mitochondria
    const turn2 = guidedTurn(dummySession, "Show me an example of how mitochondria synthesize ATP");
    expect(turn2.page).not.toBeNull();
    const hasMitoImg2 = turn2.page?.marks.some(
      m => m.type === "image" && m.src?.includes("Mitochondria.png")
    );
    expect(hasMitoImg2).toBe(true);

    // 3. Student doubt about cristae / powerhouse
    const turn3 = guidedTurn(dummySession, "Explain why mitochondria are called the cell powerhouse");
    expect(turn3.page).not.toBeNull();
    const hasMitoImg3 = turn3.page?.marks.some(
      m => m.type === "image" && m.src?.includes("Mitochondria.png")
    );
    expect(hasMitoImg3).toBe(true);

    // 4. Custom topic board resolution for "microcondria" and related terms
    expect(findLesson("microcondria")).toBe("mitochondria");
    expect(findLesson("cristae folds")).toBe("mitochondria");
    expect(findLesson("cellular respiration")).toBe("mitochondria");
    expect(findLesson("ATP synthesis")).toBe("mitochondria");

    const customPage = customTopicBoard("microcondria");
    expect(customPage.marks.some(m => m.type === "image" && m.src?.includes("Mitochondria.png"))).toBe(true);

    // 5. Doubt filtering preserves Mitochondria diagram image mark
    const currentScene = humanCellClass.scenes[0];
    const turnMarks = turn1.page?.marks || [];
    const newDoubtMarks = turnMarks.filter(
      m => m.annotation || m.type !== "image" || !currentScene.marks.some(sm => sm.type === "image" && sm.src === m.src)
    );
    expect(newDoubtMarks.some(m => m.type === "image" && m.src?.includes("Mitochondria.png"))).toBe(true);
  });

  test("9. Guided annotations on Mitochondria diagram accurately highlight, circle, and wire landmarks", () => {
    const page = mitochondriaBoard(false);

    // Highlight cristae: displayed mark must be anchored on the diagram (x >= 550, y >= 12)
    const hlCristae = guidedAnnotation(page, "Highlight the cristae");
    expect(hlCristae).not.toBeNull();
    expect(hlCristae?.explanation).toContain("Cristae");
    const cristaeMark = hlCristae?.page.marks.find(m => m.annotation && m.type === "path");
    expect(cristaeMark).toBeDefined();
    const cristaeMatch = cristaeMark?.d?.match(/M\s*(\d+)\s+(\d+)/);
    expect(cristaeMatch).toBeTruthy();
    const cX = Number(cristaeMatch![1]);
    const cY = Number(cristaeMatch![2]);
    expect(cX).toBeGreaterThanOrEqual(550);
    expect(cX).toBeLessThanOrEqual(940);
    expect(cY).toBeGreaterThanOrEqual(12);

    // Circle outer membrane: must be centered on the diagram
    const circleOuter = guidedAnnotation(page, "Circle the outer membrane");
    expect(circleOuter).not.toBeNull();
    expect(circleOuter?.explanation).toContain("Outer Membrane");
    const outerMark = circleOuter?.page.marks.find(m => m.annotation && m.type === "ellipse");
    expect(outerMark).toBeDefined();
    expect(outerMark!.x).toBeGreaterThanOrEqual(550);
    expect(outerMark!.y).toBeGreaterThanOrEqual(12);

    // Where is the matrix
    const findMatrix = guidedAnnotation(page, "Where is the matrix?");
    expect(findMatrix).not.toBeNull();
    expect(findMatrix?.explanation).toContain("Matrix");

    // Highlight ATP synthase: near bottom of diagram
    const hlAtp = guidedAnnotation(page, "Highlight ATP synthase");
    expect(hlAtp).not.toBeNull();
    expect(hlAtp?.explanation).toContain("ATP Synthase");
    const atpMark = hlAtp?.page.marks.find(m => m.annotation && m.type === "path");
    expect(atpMark).toBeDefined();
    const atpMatch = atpMark?.d?.match(/M\s*(\d+)\s+(\d+)/);
    expect(atpMatch).toBeTruthy();
    const atpX = Number(atpMatch![1]);
    const atpY = Number(atpMatch![2]);
    expect(atpX).toBeGreaterThanOrEqual(550);
    expect(atpY).toBeGreaterThanOrEqual(180);
  });

  test("10. Precision Naming Convention Underlining & Smart Non-Blending Marker Colors", () => {
    const page = mitochondriaBoard(false);

    // 1. Underline the cristae naming convention
    const underlineCristae = guidedAnnotation(page, "Underline the cristae naming convention");
    expect(underlineCristae).not.toBeNull();
    expect(underlineCristae?.explanation).toContain("naming convention");
    const cristaeUnderlineMark = underlineCristae?.page.marks.find(m => m.annotation && m.type === "path");
    expect(cristaeUnderlineMark).toBeDefined();
    // Color must be smart high-contrast non-blending color: #00d2d3 (Electric Cyan)
    expect(cristaeUnderlineMark?.color).toBe("#00d2d3");
    // Underline stroke must be crisp and bold
    expect(cristaeUnderlineMark?.strokeWidth).toBeGreaterThanOrEqual(3.4);
    // Bounding coordinates of the underline must align with the printed "Cristae" text label
    const cristaeMatch = cristaeUnderlineMark?.d?.match(/M\s*(\d+)\s+(\d+)/);
    expect(cristaeMatch).toBeTruthy();
    const uX = Number(cristaeMatch![1]);
    const uY = Number(cristaeMatch![2]);
    // The "Cristae" label is at x=663, y=256 on the board
    expect(uX).toBeGreaterThanOrEqual(650);
    expect(uX).toBeLessThanOrEqual(680);
    expect(uY).toBeGreaterThanOrEqual(250);
    expect(uY).toBeLessThanOrEqual(300);

    // 2. Underline the outer membrane label
    const underlineOuter = guidedAnnotation(page, "Underline the outer membrane label");
    expect(underlineOuter).not.toBeNull();
    const outerUnderlineMark = underlineOuter?.page.marks.find(m => m.annotation && m.type === "path");
    expect(outerUnderlineMark).toBeDefined();
    expect(outerUnderlineMark?.color).toBe("#00d2d3");
    // "Outer membrane" label is at top right: x=866, y=54
    const outerMatch = outerUnderlineMark?.d?.match(/M\s*(\d+)\s+(\d+)/);
    expect(outerMatch).toBeTruthy();
    expect(Number(outerMatch![1])).toBeGreaterThanOrEqual(850);
    expect(Number(outerMatch![2])).toBeLessThanOrEqual(100);

    // 3. Highlight the matrix naming convention
    const hlMatrix = guidedAnnotation(page, "Highlight the matrix naming convention");
    expect(hlMatrix).not.toBeNull();
    const matrixHlMark = hlMatrix?.page.marks.find(m => m.annotation && m.type === "path");
    expect(matrixHlMark).toBeDefined();
    expect(matrixHlMark?.color).toBe("#00d2d3");

    // 4. Verify smart marker colors never blend with diagram background
    // Diagram organelle features have red/coral (#e0245e/coral) and amber/yellow backgrounds.
    // An annotation on the outer membrane must use complementary Electric Cyan (#00d2d3)
    const circleOuter = guidedAnnotation(page, "Circle the outer membrane");
    const outerCircleMark = circleOuter?.page.marks.find(m => m.annotation && m.type === "ellipse");
    expect(outerCircleMark?.color).toBe("#00d2d3");

    // Cristae structure fold annotation uses vivid magenta (#ff2a7a)
    const hlCristaeStructure = guidedAnnotation(page, "Highlight the cristae");
    const cristaeStructureMark = hlCristaeStructure?.page.marks.find(m => m.annotation && m.type === "path");
    expect(cristaeStructureMark?.color).toBe("#ff2a7a");

    // DNA structure annotation uses neon green (#2ed573)
    const circleDna = guidedAnnotation(page, "Circle the DNA");
    const dnaCircleMark = circleDna?.page.marks.find(m => m.annotation && m.type === "ellipse");
    expect(dnaCircleMark?.color).toBe("#2ed573");
  });
});
