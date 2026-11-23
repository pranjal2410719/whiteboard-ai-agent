import { test, expect } from "@playwright/test";
import {
  LayoutPatternEngine,
  buildClassicSplitMarks,
  buildInvertedSplitMarks,
  buildCenteredFocalHeroMarks,
  buildTopDiagramBottomTimelineMarks,
  buildStepByStepDerivationMarks,
  buildMultiPanelComparisonMarks,
  buildFloatingRadialMarks,
  buildPageWithLayout,
  type LayoutPatternType,
} from "@/lib/layout";
import {
  getClass,
  humanCellClass,
  trigonometryClass,
  CELL_SCENE_PATTERNS,
  TRIG_SCENE_PATTERNS,
  buildDynamicCellScenes,
  buildDynamicTrigScenes,
  buildCellHeroRadialBoard,
  buildCellTimelinePipelineBoard,
  buildCellOrganelleComparisonBoard,
  buildTrigDerivationBoard,
  buildTrigComparisonBoard,
  buildTrigHeroBoard,
  cellBoardRegions,
  trigBoardRegions,
} from "@/classes";
import { TeachingOrchestrator } from "@/lib/pedagogy/orchestrator";
import { recordedClass } from "@/lib/recorded-classes";
import { buildDynamicLessonBoard } from "@/lib/lessons";

test.describe("Dynamic Teaching Whiteboard Layout Patterns Engine", () => {
  test("1. Registry & Pattern Definitions: All 7 patterns registered with valid metadata", () => {
    const patterns = LayoutPatternEngine.getAllPatterns();
    expect(patterns.length).toBeGreaterThanOrEqual(7);

    const expectedPatterns: LayoutPatternType[] = [
      "classic-split",
      "inverted-split",
      "centered-focal-hero",
      "top-diagram-bottom-timeline",
      "step-by-step-derivation",
      "multi-panel-comparison",
      "floating-radial-annotation",
    ];

    for (const p of expectedPatterns) {
      expect(LayoutPatternEngine.hasPattern(p)).toBe(true);
      const def = LayoutPatternEngine.getPattern(p);
      expect(def).toBeDefined();
      expect(def?.name).toBeTruthy();
      expect(def?.description).toBeTruthy();
      expect(def?.pedagogicalAffordance).toBeTruthy();
      expect(def?.recommendedStages.length).toBeGreaterThan(0);
    }
  });

  test("2. Zone Resolution: All patterns produce non-overlapping valid canvas zones within 1000x330", () => {
    const allPatterns: LayoutPatternType[] = [
      "classic-split",
      "inverted-split",
      "centered-focal-hero",
      "top-diagram-bottom-timeline",
      "step-by-step-derivation",
      "multi-panel-comparison",
      "floating-radial-annotation",
    ];

    for (const pat of allPatterns) {
      const zones = LayoutPatternEngine.resolveZones(pat);
      expect(zones.length).toBeGreaterThanOrEqual(2);

      for (const zone of zones) {
        expect(zone.bounds.x).toBeGreaterThanOrEqual(0);
        expect(zone.bounds.y).toBeGreaterThanOrEqual(0);
        expect(zone.bounds.x + zone.bounds.w).toBeLessThanOrEqual(1000);
        expect(zone.bounds.y + zone.bounds.h).toBeLessThanOrEqual(330);
        expect(zone.bounds.w).toBeGreaterThan(0);
        expect(zone.bounds.h).toBeGreaterThan(0);
      }
    }
  });

  test("3. Spatial Intelligence Grounding Preservation: Regions transform proportionally across layouts", () => {
    const fromBounds = { x: 610, y: 14, w: 232, h: 310 };
    const toBounds = { x: 350, y: 48, w: 300, h: 265 }; // Centered hero bounds

    const transformed = LayoutPatternEngine.transformRegions(cellBoardRegions, fromBounds, toBounds);
    expect(transformed.length).toBe(cellBoardRegions.length);

    // Every transformed region must be within or aligned to target bounds
    for (const r of transformed) {
      expect(r.x).toBeGreaterThanOrEqual(toBounds.x - 20);
      expect(r.y).toBeGreaterThanOrEqual(toBounds.y - 20);
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
    }

    // Verify identity transform when bounds match
    const identical = LayoutPatternEngine.transformRegions(cellBoardRegions, fromBounds, fromBounds);
    expect(identical).toEqual(cellBoardRegions);
  });

  test("4. Mark Generation: Classic Split vs Inverted Split coordinate verification", () => {
    // Classic: Heading on left, diagram on right
    const classicMarks = buildClassicSplitMarks({
      title: "Cell Anatomy",
      notes: ["Lipid membrane", "Fluid cytosol"],
      diagramSrc: "/assets/human_cell_diagram.png",
      diagramBounds: { x: 550, y: 16, w: 390, h: 295 },
    });

    const classicImg = classicMarks.find(m => m.type === "image");
    expect(classicImg).toBeDefined();
    expect(classicImg?.x).toBe(550);

    const classicTitle = classicMarks.find(m => m.type === "text" && m.text === "Cell Anatomy");
    expect(classicTitle?.x).toBeLessThan(100);

    // Inverted: Diagram on left, heading on right
    const invertedMarks = buildInvertedSplitMarks({
      title: "Cell Anatomy Inverted",
      notes: ["Lipid membrane", "Fluid cytosol"],
      diagramSrc: "/assets/human_cell_diagram.png",
      diagramBounds: { x: 45, y: 16, w: 420, h: 295 },
    });

    const invertedImg = invertedMarks.find(m => m.type === "image");
    expect(invertedImg).toBeDefined();
    expect(invertedImg?.x).toBe(45);

    const invertedTitle = invertedMarks.find(m => m.type === "text" && m.text === "Cell Anatomy Inverted");
    expect(invertedTitle?.x).toBeGreaterThan(500);
  });

  test("5. Mark Generation: Centered Focal Hero with bilateral callout cards", () => {
    const marks = buildCenteredFocalHeroMarks({
      title: "Organelle Coordination",
      diagramSrc: "/assets/human_cell_diagram.png",
      diagramBounds: { x: 350, y: 48, w: 300, h: 265 },
      leftCallouts: [
        { label: "1. Nucleus", text: "DNA library", targetY: 120 },
      ],
      rightCallouts: [
        { label: "2. Mitochondria", text: "ATP respiration", targetY: 130 },
      ],
    });

    // Check center diagram
    const img = marks.find(m => m.type === "image");
    expect(img?.x).toBe(350);

    // Check left callout exists on left
    const leftText = marks.find(m => m.type === "text" && m.text === "1. Nucleus");
    expect(leftText?.x).toBeLessThan(300);

    // Check right callout exists on right
    const rightText = marks.find(m => m.type === "text" && m.text === "2. Mitochondria");
    expect(rightText?.x).toBeGreaterThan(650);

    // Check connecting flow arrows exist
    const arrows = marks.filter(m => m.type === "path" && m.d?.includes("M"));
    expect(arrows.length).toBeGreaterThanOrEqual(2);
  });

  test("6. Mark Generation: Top Diagram Bottom Timeline Sequential Process Flow", () => {
    const marks = buildTopDiagramBottomTimelineMarks({
      title: "Protein Pipeline",
      diagramSrc: "/assets/human_cell_diagram.png",
      diagramBounds: { x: 380, y: 10, w: 560, h: 145 },
      steps: [
        { step: 1, title: "Nucleus", subtitle: "DNA Transcription", detail: "mRNA copies code" },
        { step: 2, title: "Rough ER", subtitle: "Translation", detail: "Ribosome assembly" },
        { step: 3, title: "Golgi", subtitle: "Packaging", detail: "Secretory vesicles" },
      ],
    });

    const img = marks.find(m => m.type === "image");
    expect(img?.y).toBeLessThan(50);

    // Check sequential cards
    const step1Badge = marks.find(m => m.type === "text" && m.text === "01");
    const step2Badge = marks.find(m => m.type === "text" && m.text === "02");
    const step3Badge = marks.find(m => m.type === "text" && m.text === "03");

    expect(step1Badge).toBeDefined();
    expect(step2Badge).toBeDefined();
    expect(step3Badge).toBeDefined();

    expect((step1Badge?.x || 0) < (step2Badge?.x || 0)).toBe(true);
    expect((step2Badge?.x || 0) < (step3Badge?.x || 0)).toBe(true);
  });

  test("7. Mark Generation: Step-by-Step Derivation & Equation Flow", () => {
    const marks = buildStepByStepDerivationMarks({
      title: "Pythagorean Identity Derivation",
      diagramSrc: "/assets/trigonometry-triangle.svg",
      diagramBounds: { x: 645, y: 24, w: 310, h: 285 },
      steps: [
        { stepNumber: 1, title: "Pythagoras", equation: "a² + b² = c²", explanation: "Geometric rule" },
        { stepNumber: 2, title: "Divide by c²", equation: "(a/c)² + (b/c)² = 1", explanation: "Algebraic normalization" },
        { stepNumber: 3, title: "Identity", equation: "sin²(θ) + cos²(θ) = 1", explanation: "Trig definition", highlight: true },
      ],
      finalTakeaway: "Universal identity for all angles",
    });

    // Check derivation cards are on left/center
    const eq1 = marks.find(m => m.type === "text" && m.text === "a² + b² = c²");
    const eq3 = marks.find(m => m.type === "text" && m.text === "sin²(θ) + cos²(θ) = 1");
    expect(eq1?.x).toBeLessThan(500);
    expect(eq3?.x).toBeLessThan(500);

    // Check downward vertical flow progression
    expect((eq1?.y || 0) < (eq3?.y || 0)).toBe(true);

    // Check right reference image
    const img = marks.find(m => m.type === "image");
    expect(img?.x).toBe(645);
  });

  test("8. Mark Generation: Multi-Panel Comparison (Side-by-Side Dual Panels)", () => {
    const marks = buildMultiPanelComparisonMarks({
      title: "Sine vs Cosine",
      panels: [
        { id: "sin", title: "Sine: sin(θ)", points: ["Opposite / Hypotenuse", "Vertical projection"], color: "#3b805c" },
        { id: "cos", title: "Cosine: cos(θ)", points: ["Adjacent / Hypotenuse", "Horizontal projection"], color: "#507aaf" },
      ],
    });

    const sinTitle = marks.find(m => m.type === "text" && m.text === "Sine: sin(θ)");
    const cosTitle = marks.find(m => m.type === "text" && m.text === "Cosine: cos(θ)");
    expect(sinTitle?.x).toBeLessThan(400);
    expect(cosTitle?.x).toBeGreaterThan(500);

    // Check center "VS" badge
    const vs = marks.find(m => m.type === "text" && m.text === "VS");
    expect(vs).toBeDefined();
    expect(vs?.x).toBe(500);
  });

  test("9. Mark Generation: Floating Radial Annotation", () => {
    const marks = buildFloatingRadialMarks({
      title: "Radial Exploration",
      diagramSrc: "/assets/human_cell_diagram.png",
      diagramBounds: { x: 380, y: 55, w: 240, h: 250 },
      nodes: [
        { id: "n1", label: "Nucleus", angleDeg: -135 },
        { id: "n2", label: "Mitochondria", angleDeg: -45 },
        { id: "n3", label: "Ribosome", angleDeg: 45 },
        { id: "n4", label: "Membrane", angleDeg: 135 },
      ],
    });

    // Check dashed orbital guide
    const ring = marks.find(m => m.type === "path" && m.dashed);
    expect(ring).toBeDefined();

    // Check all 4 radial labels
    expect(marks.some(m => m.type === "text" && m.text === "Nucleus")).toBe(true);
    expect(marks.some(m => m.type === "text" && m.text === "Mitochondria")).toBe(true);
    expect(marks.some(m => m.type === "text" && m.text === "Ribosome")).toBe(true);
    expect(marks.some(m => m.type === "text" && m.text === "Membrane")).toBe(true);
  });

  test("10. Class Integration: Human Cell & Trigonometry multi-pattern lecture scenes", () => {
    expect(CELL_SCENE_PATTERNS).toEqual([
      "classic-split",
      "multi-panel-comparison",
      "top-diagram-bottom-timeline",
      "centered-focal-hero",
    ]);

    expect(TRIG_SCENE_PATTERNS).toEqual([
      "classic-split",
      "multi-panel-comparison",
      "centered-focal-hero",
      "step-by-step-derivation",
    ]);

    const cellCls = getClass("human-cell");
    expect(cellCls?.scenes[0].layoutPattern).toBe("classic-split");
    expect(cellCls?.scenes[1].layoutPattern).toBe("multi-panel-comparison");
    expect(cellCls?.scenes[2].layoutPattern).toBe("top-diagram-bottom-timeline");
    expect(cellCls?.scenes[3].layoutPattern).toBe("centered-focal-hero");

    const trigCls = getClass("trigonometry");
    expect(trigCls?.scenes[0].layoutPattern).toBe("classic-split");
    expect(trigCls?.scenes[1].layoutPattern).toBe("multi-panel-comparison");
    expect(trigCls?.scenes[2].layoutPattern).toBe("centered-focal-hero");
    expect(trigCls?.scenes[3].layoutPattern).toBe("step-by-step-derivation");

    // Dynamic builder overrides
    const overriddenCell = buildDynamicCellScenes({ 0: "inverted-split", 1: "step-by-step-derivation" });
    expect(overriddenCell[0].layoutPattern).toBe("inverted-split");
    expect(overriddenCell[1].layoutPattern).toBe("step-by-step-derivation");
    expect(overriddenCell[2].layoutPattern).toBe("top-diagram-bottom-timeline");

    // Specialized boards
    const heroBoard = buildCellHeroRadialBoard();
    expect(heroBoard.layoutPattern).toBe("centered-focal-hero");

    const pipelineBoard = buildCellTimelinePipelineBoard();
    expect(pipelineBoard.layoutPattern).toBe("top-diagram-bottom-timeline");

    const compareBoard = buildCellOrganelleComparisonBoard();
    expect(compareBoard.layoutPattern).toBe("multi-panel-comparison");

    const derivationBoard = buildTrigDerivationBoard();
    expect(derivationBoard.layoutPattern).toBe("step-by-step-derivation");

    const trigHero = buildTrigHeroBoard();
    expect(trigHero.layoutPattern).toBe("centered-focal-hero");
  });

  test("11. Pedagogy Orchestrator: Dynamic pattern selection matches pedagogical stage", () => {
    // Stage INTRODUCE / HOOK
    const hookPatternMath = TeachingOrchestrator.resolveLayoutPattern("INTRODUCE", { topic: "Trigonometry" } as any);
    expect(hookPatternMath).toBe("classic-split");

    const hookPatternBio = TeachingOrchestrator.resolveLayoutPattern("INTRODUCE", { topic: "Human Cell" } as any);
    expect(hookPatternBio).toBe("centered-focal-hero");

    // Stage VISUAL_DEMO
    const demoMath = TeachingOrchestrator.resolveLayoutPattern("VISUAL_DEMO", { topic: "Pythagorean Theorem" } as any);
    expect(demoMath).toBe("step-by-step-derivation");

    const demoProcess = TeachingOrchestrator.resolveLayoutPattern("VISUAL_DEMO", { topic: "Protein Pipeline" } as any);
    expect(demoProcess).toBe("top-diagram-bottom-timeline");

    // Stage EVALUATE_AND_REMEDIATE / CHECKPOINT
    const checkpoint = TeachingOrchestrator.resolveLayoutPattern("CHECKPOINT", { topic: "Organelles" } as any);
    expect(checkpoint).toBe("classic-split");

    const remediation = TeachingOrchestrator.resolveLayoutPattern("EVALUATE_AND_REMEDIATE", { topic: "Organelles" } as any);
    expect(remediation).toBe("multi-panel-comparison");

    // Stage SYNTHESIS
    const synthesis = TeachingOrchestrator.resolveLayoutPattern("SYNTHESIS", { topic: "Wrap up" } as any);
    expect(synthesis).toBe("floating-radial-annotation");
  });

  test("12. Whiteboard UI Playback: Dynamic layout pattern attributes and badge rendering", async ({ page }) => {
    await page.goto("http://127.0.0.1:3002/");
    await page.waitForLoadState("domcontentloaded");

    // Switch to Trigonometry session
    const trigBtn = page.locator('button:has-text("Trigonometry")').first();
    await expect(trigBtn).toBeVisible({ timeout: 5000 });
    await trigBtn.click();
    await page.waitForTimeout(600);

    // Initial board should have data-layout-pattern="classic-split"
    const svg = page.locator("svg.drawing-svg");
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute("data-layout-pattern", "classic-split");

    // Start class playback
    const startBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1500);

      // Verify lecture player is active
      await expect(page.locator(".lecture-player")).toBeVisible({ timeout: 8000 });

      // Check active chapter layout pattern
      const activeSvgPattern = await svg.getAttribute("data-layout-pattern");
      expect(activeSvgPattern).toBeTruthy();
      expect([
        "classic-split",
        "multi-panel-comparison",
        "centered-focal-hero",
        "step-by-step-derivation",
      ]).toContain(activeSvgPattern);
    }
  });

  test("13. Class Scene Visual Realism: Lecture scene boards contain genuine layout pattern structures", () => {
    const cellCls = getClass("human-cell");
    expect(cellCls).toBeDefined();

    // Scene 2 (multi-panel-comparison): must have rect card containers and center VS badge
    const cellScene2 = cellCls!.scenes[1];
    expect(cellScene2.layoutPattern).toBe("multi-panel-comparison");
    const rects2 = cellScene2.marks.filter(m => m.type === "rect");
    expect(rects2.length).toBeGreaterThanOrEqual(2);
    expect(cellScene2.marks.some(m => m.type === "text" && m.text === "VS")).toBe(true);

    // Scene 3 (top-diagram-bottom-timeline): must have timeline step sequence badges and arrows
    const cellScene3 = cellCls!.scenes[2];
    expect(cellScene3.layoutPattern).toBe("top-diagram-bottom-timeline");
    expect(cellScene3.marks.some(m => m.type === "text" && m.text === "01")).toBe(true);
    expect(cellScene3.marks.some(m => m.type === "text" && m.text === "02")).toBe(true);
    expect(cellScene3.marks.some(m => m.type === "path" && m.d?.includes("M"))).toBe(true);

    // Scene 4 (centered-focal-hero): must have flank callout cards
    const cellScene4 = cellCls!.scenes[3];
    expect(cellScene4.layoutPattern).toBe("centered-focal-hero");
    expect(cellScene4.marks.some(m => m.type === "text" && m.text?.includes("1. DNA CODES"))).toBe(true);
    expect(cellScene4.marks.some(m => m.type === "text" && m.text?.includes("2. PROTEIN & ATP"))).toBe(true);

    // Trigonometry Scene 2 (multi-panel-comparison): Sine and Cosine panel headers and VS
    const trigCls = getClass("trigonometry");
    expect(trigCls).toBeDefined();
    const trigScene2 = trigCls!.scenes[1];
    expect(trigScene2.layoutPattern).toBe("multi-panel-comparison");
    expect(trigScene2.marks.some(m => m.type === "text" && m.text?.includes("SINE RATIO"))).toBe(true);
    expect(trigScene2.marks.some(m => m.type === "text" && m.text?.includes("COSINE RATIO"))).toBe(true);
    expect(trigScene2.marks.some(m => m.type === "text" && m.text === "VS")).toBe(true);

    // Trigonometry Scene 4 (step-by-step-derivation): step progression cards
    const trigScene4 = trigCls!.scenes[3];
    expect(trigScene4.layoutPattern).toBe("step-by-step-derivation");
    expect(trigScene4.marks.some(m => m.type === "text" && m.text === "Step 1")).toBe(true);
    expect(trigScene4.marks.some(m => m.type === "text" && m.text === "Step 2")).toBe(true);
  });

  test("14. Teaching Orchestrator Stage Transition: Actively updates page layout pattern dynamically on stage progression", async () => {
    const basePage = {
      id: "test-p1",
      title: "Cell Organelles",
      marks: [],
      ink: [],
      cursor: { x: 500, y: 150 },
      layoutPattern: "classic-split" as const,
      pedagogyState: {
        stage: "CHECKPOINT" as const,
        coveredLandmarks: ["nucleus"],
        uncoveredLandmarks: ["mitochondria"],
        activeMisconceptions: [],
        studentUnderstandingScore: 0.4,
        persona: "socratic" as const,
        turnCount: 2,
      },
    };

    const sessionData = {
      title: "Cell Organelles",
      subject: "Biology",
      lessonKey: "human-cell",
      pages: [basePage],
      pageIndex: 0,
      messages: [{ role: "user" as const, content: "I am confused about the differences" }],
      suggestions: [],
      saved: false,
      mode: "guided" as const,
      quiz: null,
      lecture: null,
    };

    // When student is confused at CHECKPOINT, orchestrator evaluates to EVALUATE_AND_REMEDIATE
    // which dynamically transitions the layout to multi-panel-comparison
    const turnRemediation = await TeachingOrchestrator.orchestrateTurn(
      "I am confused, what is the difference?",
      sessionData,
      null,
      { topic: "Cell Organelles" } as any
    );

    expect(turnRemediation.page?.layoutPattern).toBe("multi-panel-comparison");

    // When all landmarks are covered and student answers correctly, stage advances to SYNTHESIS
    // which dynamically transitions the layout to floating-radial-annotation
    const synthesisPage = {
      ...basePage,
      pedagogyState: {
        stage: "CHECKPOINT" as const,
        coveredLandmarks: ["nucleus", "mitochondria", "ribosomes"],
        uncoveredLandmarks: [],
        activeMisconceptions: [],
        studentUnderstandingScore: 0.9,
        persona: "socratic" as const,
        turnCount: 4,
      },
    };

    const sessionDataSynthesis = {
      ...sessionData,
      pages: [synthesisPage],
    };

    const turnSynthesis = await TeachingOrchestrator.orchestrateTurn(
      "Yes, that is completely clear and correct!",
      sessionDataSynthesis,
      null,
      { topic: "Cell Organelles" } as any
    );

    expect(turnSynthesis.page?.layoutPattern).toBe("floating-radial-annotation");
  });
});
