import { test, expect } from "@playwright/test";
import {
  BoundingBox,
  AnchorPoints,
  InnerTextBounds,
  SemanticElement,
  SpatialContext,
  FlowchartManager,
  FlowchartNodeDef,
  FlowchartEdgeDef,
  findNextSentenceBoundary,
} from "../src/lib/spatial";

test.describe("Phase 4: Spatial Context & Geometry Engine (Ported from Python)", () => {
  test("1. BoundingBox intersection and containment arithmetic", () => {
    const b1 = new BoundingBox(10, 10, 100, 100);
    const b2 = new BoundingBox(50, 50, 100, 100);
    const b3 = new BoundingBox(200, 200, 50, 50);

    expect(b1.intersects(b2)).toBe(true);
    expect(b1.intersects(b3)).toBe(false);

    expect(b1.right).toBe(110);
    expect(b1.bottom).toBe(110);
    expect(b1.centerX).toBe(60);
    expect(b1.centerY).toBe(60);

    const outer = new BoundingBox(0, 0, 300, 300);
    expect(outer.contains(b1)).toBe(true);
    expect(b1.contains(outer)).toBe(false);
  });

  test("2. SpatialContext query resolution (ID, text, last, first)", () => {
    const ctx = new SpatialContext();
    const elements = [
      { id: "header", type: "rectangle", x: 100, y: 50, width: 600, height: 60, text: "Lesson Header" },
      { id: "card_a", type: "rectangle", x: 100, y: 150, width: 250, height: 180, text: "Concept A (Friction)" },
      { id: "card_b", type: "rectangle", x: 450, y: 150, width: 250, height: 180, text: "Concept B (Gravity)" },
    ];
    ctx.updateFromElements(elements);

    // Exact ID
    expect(ctx.find("header")?.id).toBe("header");
    // Text fuzzy match
    expect(ctx.find("friction")?.id).toBe("card_a");
    expect(ctx.find("gravity")?.id).toBe("card_b");
    // Positional keywords
    expect(ctx.find("last")?.id).toBe("card_b");
    expect(ctx.find("first")?.id).toBe("header");
  });

  test("3. Relative positioning calculations (below, above, beside, inside)", () => {
    const ctx = new SpatialContext();
    const elements = [
      { id: "card_a", type: "rectangle", x: 100, y: 150, width: 250, height: 180, text: "Concept A" },
    ];
    ctx.updateFromElements(elements);

    // Below: center aligned
    const [belowX, belowY] = ctx.calculateRelativePosition("card_a", "below", 250, 100, 20, "center");
    expect(belowY).toBe(150 + 180 + 20); // 350
    expect(belowX).toBe(100);

    // Above: start/left aligned
    const [aboveX, aboveY] = ctx.calculateRelativePosition("card_a", "above", 250, 50, 25, "start");
    expect(aboveY).toBe(150 - 50 - 25); // 75
    expect(aboveX).toBe(100);

    // Beside right: start aligned
    const [besideX, besideY] = ctx.calculateRelativePosition("card_a", "right", 150, 100, 30, "start");
    expect(besideX).toBe(100 + 250 + 30); // 380
    expect(besideY).toBe(150);

    // Inside: centered
    const [insideX, insideY] = ctx.calculateRelativePosition("card_a", "inside", 100, 50);
    expect(insideX).toBe(100 + 125 - 50); // 175
    expect(insideY).toBe(150 + 90 - 25);  // 215
  });

  test("4. Spatial alignment calculations", () => {
    const ctx = new SpatialContext();
    ctx.updateFromElements([
      { id: "card_a", type: "rectangle", x: 100, y: 150, width: 250, height: 180 },
      { id: "card_b", type: "rectangle", x: 450, y: 200, width: 250, height: 180 },
    ]);

    const topUpdates = ctx.computeAlignment(["card_a", "card_b"], "top");
    expect(topUpdates["card_a"]?.y).toBe(150);
    expect(topUpdates["card_b"]?.y).toBe(150);

    const leftUpdates = ctx.computeAlignment(["card_a", "card_b"], "left");
    expect(leftUpdates["card_a"]?.x).toBe(100);
    expect(leftUpdates["card_b"]?.x).toBe(100);
  });

  test("5. Spatial distribution calculations", () => {
    const ctx = new SpatialContext();
    ctx.updateFromElements([
      { id: "card_a", type: "rectangle", x: 100, y: 150, width: 200, height: 100 },
      { id: "card_b", type: "rectangle", x: 400, y: 150, width: 200, height: 100 },
      { id: "card_c", type: "rectangle", x: 800, y: 150, width: 200, height: 100 },
    ]);

    const dist = ctx.computeDistribution(["card_a", "card_b", "card_c"], "horizontal");
    expect(dist["card_a"]?.x).toBeLessThan(dist["card_b"]?.x!);
    expect(dist["card_b"]?.x).toBeLessThan(dist["card_c"]?.x!);
  });

  test("6. Automatic non-overlapping spot collision step-down", () => {
    const ctx = new SpatialContext();
    ctx.updateFromElements([
      { id: "card_a", type: "rectangle", x: 100, y: 150, width: 250, height: 180 },
    ]);

    const [cleanX, cleanY] = ctx.findNonOverlappingSpot(100, 150, 200, 100);
    // Must step down past bottom of card_a (150 + 180 = 330)
    expect(cleanY).toBeGreaterThanOrEqual(330);
    expect(cleanX).toBe(100);
  });
});

test.describe("Phase 4: Flowchart Manager & Semantic Node Tracking (Ported from Python)", () => {
  test("7. Builds multi-node flowchart with sequential non-overlapping Y layout", () => {
    const context = new SpatialContext();
    const fm = new FlowchartManager(null, context);

    const nodes = [
      new FlowchartNodeDef("start_node", "START: Measure Applied Force F", "start", "Entry point"),
      new FlowchartNodeDef("calc_node", "Calculate Limiting Friction: f_L = mu_s * N", "process", "Computes maximum static force"),
      new FlowchartNodeDef("check_node", "Is Applied Force F > f_L?", "decision", "Determines static vs motion"),
      new FlowchartNodeDef("end_node", "Output: Block Accelerates", "end", "Terminal motion state"),
    ];
    const edges = [
      new FlowchartEdgeDef("start_node", "calc_node"),
      new FlowchartEdgeDef("calc_node", "check_node"),
      new FlowchartEdgeDef("check_node", "end_node", "Yes"),
    ];

    const fc = fm.createFlowchart("friction_algo", "Friction State Algorithm", nodes, edges, 400, 80, 50);
    expect(fc.nodeIds.length).toBe(4);
    expect(fc.edgeIds.length).toBe(3);

    const first = fm.getNode("friction_algo", 0);
    const second = fm.getNode("friction_algo", 1);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first!.bottom).toBeLessThan(second!.y);
  });

  test("8. Explains comprehensive node context answering the 5 core questions", () => {
    const context = new SpatialContext();
    const fm = new FlowchartManager(null, context);

    const nodes = [
      new FlowchartNodeDef("start_node", "START: Measure Applied Force F", "start", "Entry point of friction evaluation algorithm"),
    ];
    fm.createFlowchart("friction_algo", "Friction State Algorithm", nodes, []);

    const first = fm.getFirstNode("friction_algo");
    expect(first).not.toBeNull();
    expect(first!.id).toBe("start_node");
    expect(first!.role).toBe("flowchart_start_node");

    const ctx = first!.explainContext();
    expect(ctx).toHaveProperty("where_is_element");
    expect(ctx).toHaveProperty("what_is_position");
    expect(ctx).toHaveProperty("what_are_coordinates");
    expect(ctx).toHaveProperty("why_was_this_element_there");
    expect(ctx).toHaveProperty("is_there_any_element_over_it");

    const bounds = ctx.what_are_coordinates.boundaries;
    expect(bounds.left).toBe(first!.x);
    expect(bounds.top).toBe(first!.y);
    expect(bounds.width).toBe(first!.width);

    const tb = ctx.what_are_coordinates.inner_text_coordinates;
    expect(tb).not.toBeNull();
    expect(tb.x).toBeGreaterThanOrEqual(first!.x);
    expect(tb.right).toBeLessThanOrEqual(first!.right);
  });

  test("9. Highlights flowchart node (circle, underline, light, spotlight) and clears", () => {
    const context = new SpatialContext();
    const fm = new FlowchartManager(null, context);

    const nodes = [
      new FlowchartNodeDef("start_node", "START: Measure Applied Force F", "start", "Entry point"),
    ];
    fm.createFlowchart("friction_algo", "Friction State Algorithm", nodes, []);

    // 1. Circle highlight
    const circRes = fm.highlightNode("friction_algo", 0, "circle", "#e03131");
    expect(circRes.success).toBe(true);
    expect(circRes.style_applied).toBe("circle");
    const first = fm.getFirstNode("friction_algo")!;
    expect(first.explainContext().is_there_any_element_over_it.has_overlays).toBe(true);

    // 2. Clear highlight
    const cleared = fm.clearNodeHighlights("friction_algo", 0);
    expect(cleared).toBe(1);
    expect(first.explainContext().is_there_any_element_over_it.has_overlays).toBe(false);

    // 3. Spotlight highlight (backdrop + arrow + step label)
    const spotRes = fm.highlightNode("friction_algo", 0, "spotlight");
    expect(spotRes.success).toBe(true);
    expect(spotRes.created_annotations.length).toBe(3);
    expect(fm.clearNodeHighlights("friction_algo", 0)).toBe(3);
  });
});

test.describe("Phase 4 & 5: Live Classroom Browser Integration (Whiteboard, Screen Sharing & Graceful Interruption)", () => {
  test.beforeEach(async ({ page }) => {
    // Mock navigator.mediaDevices.getDisplayMedia to simulate student screen sharing
    await page.addInitScript(() => {
      if (!navigator.mediaDevices) {
        (navigator as any).mediaDevices = {};
      }
      navigator.mediaDevices.getDisplayMedia = async () => {
        // Create an in-memory canvas capture stream as mock MediaStream
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = "#ffffff";
          ctx.font = "24px sans-serif";
          ctx.fillText("Mock Student Screen Presentation", 40, 240);
        }
        return canvas.captureStream(30);
      };
    });
  });

  test("10. AI Tutor draws collision-free flowchart directly onto SVG Whiteboard DOM", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".drawing-svg")).toBeVisible();
    await page.waitForFunction(() => typeof (window as any).__qrieSpatial !== "undefined");

    // Trigger flowchart generation via window.__qrieSpatial
    const drawn = await page.evaluate(() => {
      const sp = (window as any).__qrieSpatial;
      if (!sp) return false;
      const nodes = [
        { id: "step_start", text: "START: Read Voltage V", nodeType: "start", width: 220, height: 50 },
        { id: "step_calc", text: "Calculate I = V / R", nodeType: "process", width: 220, height: 50 },
        { id: "step_check", text: "Is Current I < 2.0A?", nodeType: "decision", width: 220, height: 60 },
        { id: "step_end", text: "Circuit Operates Safely", nodeType: "end", width: 220, height: 50 },
      ];
      const edges = [
        { fromNode: "step_start", toNode: "step_calc" },
        { fromNode: "step_calc", toNode: "step_check" },
        { fromNode: "step_check", toNode: "step_end", label: "Yes" },
      ];
      sp.drawFlowchart("circuit_algorithm", "Ohm's Law Evaluation", nodes, edges, 420, 40, 30);
      return true;
    });
    expect(drawn).toBe(true);

    // Verify SVG DOM contains flowchart nodes and edges
    const marks = page.locator('[data-flowchart-mark="true"]');
    await expect(marks.first()).toBeVisible();
    expect(await marks.count()).toBeGreaterThanOrEqual(8);
    await expect(page.locator('[data-flowchart-node="step_start"]').first()).toBeVisible();
    await expect(page.locator('[data-flowchart-node="step_check"]').first()).toBeVisible();

    // Highlight decision node with spotlight
    const highlighted = await page.evaluate(() => {
      const sp = (window as any).__qrieSpatial;
      return sp.highlightFlowchartNode("circuit_algorithm", "step_check", "spotlight");
    });
    expect(highlighted.success).toBe(true);

    // Verify spotlight annotations rendered in SVG DOM
    const annotations = page.locator('[data-flowchart-annotation="true"]');
    await expect(annotations.first()).toBeVisible();
    expect(await annotations.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator('text:has-text("CURRENT STEP")')).toBeVisible();

    // Clear highlights
    await page.evaluate(() => {
      const sp = (window as any).__qrieSpatial;
      sp.clearFlowchartHighlights("circuit_algorithm", "step_check");
    });
    await expect(page.locator('[data-flowchart-annotation="true"]')).toHaveCount(0);
  });

  test.skip("11. WebRTC Screen Sharing Presentation Mode overlays backdrop on whiteboard (Deprecated: Screen share removed)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".drawing-svg")).toBeVisible();

    const presentBtn = page.locator('button[aria-label="Present screen"]');
    await expect(presentBtn).toBeVisible();

    // Click present button to initiate getDisplayMedia
    await presentBtn.click();

    // Verify presentation backdrop and video are mounted behind SVG canvas
    const backdrop = page.locator('.presentation-backdrop[data-presentation-active="true"]');
    await expect(backdrop).toBeVisible();
    await expect(page.locator(".presentation-video")).toBeVisible();
    await expect(page.locator('button[aria-label="Stop presenting"]')).toBeVisible();

    // Click stop presenting in badge or GoogleMeetBar
    await page.locator(".presentation-stop-btn").click();
    await expect(backdrop).not.toBeVisible();
    await expect(page.locator('button[aria-label="Present screen"]')).toBeVisible();
  });

  test("12. Sentence-Boundary Detection identifies punctuation boundary timestamp", () => {
    const cues = [
      {
        from: 0,
        to: 9,
        text: "A ladder, a wall, and the ground form a right triangle. The little square marks the ninety degree corner, where the wall meets the ground.",
        firstMark: 0,
        endMark: 2,
      },
    ];

    // Student raises hand at 2.0s
    const boundary = findNextSentenceBoundary(cues, 2.0);
    expect(boundary.isPunctuation).toBe(true);
    // First sentence ends around 3.5 - 3.8s
    expect(boundary.boundaryTime).toBeGreaterThanOrEqual(3.0);
    expect(boundary.boundaryTime).toBeLessThanOrEqual(4.5);
    expect(boundary.sentenceText).toContain("form a right triangle.");
  });

  test("13. Voice mic activation during lecture executes pause into Doubt-Solving Mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".drawing-svg")).toBeVisible();

    const startClassBtn = page.locator('button[aria-label="Watch prerecorded class"]');
    await expect(startClassBtn).toBeVisible();
    await startClassBtn.click();
    await page.waitForTimeout(1000);

    // Click mic to pause for doubt solving
    const micBtn = page.locator('.voice-mic-pill, button[aria-label*="microphone" i]');
    await expect(micBtn.first()).toBeVisible();
    await micBtn.first().click();

    // Banner appears for Doubt-Solving Mode
    await expect(page.locator(".meet-doubt-banner")).toBeVisible({ timeout: 6000 });
    await expect(page.locator('strong:has-text("Doubt-Solving Mode")')).toBeVisible();
  });

  test("14. Ephemeral doubt sketch layer displays tutor illustrations and restores cleanly on resume", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".drawing-svg")).toBeVisible();

    const startClassBtn = page.locator('button[aria-label="Watch prerecorded class"]');
    await expect(startClassBtn).toBeVisible();
    await startClassBtn.click();
    await page.waitForTimeout(1000);

    // Click mic to enter Doubt-Solving Mode
    const micBtn = page.locator('.voice-mic-pill, button[aria-label*="microphone" i]');
    await expect(micBtn.first()).toBeVisible();
    await micBtn.first().click();

    await expect(page.locator(".meet-doubt-banner")).toBeVisible({ timeout: 6000 });
    await expect(page.locator(".meet-resume-doubt-btn")).toBeVisible();

    // AI tutor draws ephemeral doubt sketches via window.__qrieSpatial
    const added = await page.evaluate(() => {
      const sp = (window as any).__qrieSpatial;
      if (!sp || typeof sp.addDoubtMarks !== "function") return false;
      sp.addDoubtMarks([
        {
          type: "rect",
          x: 140,
          y: 120,
          w: 180,
          h: 80,
          color: "#d9480f",
          fill: "#ffe8cc",
          strokeWidth: 2.5,
        },
        {
          type: "text",
          x: 155,
          y: 165,
          text: "Hypotenuse c² Explanation",
          size: 14,
          color: "#d9480f",
          weight: 700,
        },
      ]);
      return true;
    });
    expect(added).toBe(true);

    // Verify doubt marks are rendered inside real SVG canvas-layer-doubt
    const doubtMarks = page.locator('[data-doubt-mark="true"]');
    await expect(doubtMarks.first()).toBeVisible();
    expect(await doubtMarks.count()).toBe(2);
    await expect(page.locator('text:has-text("Hypotenuse c² Explanation")')).toBeVisible();

    // Click UI "Resume lecture" button
    const resumeBtn = page.locator(".meet-resume-doubt-btn");
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();

    // Verify Doubt-Solving banner closes and doubt sketches are cleanly restored/cleared without residue
    await expect(page.locator(".meet-doubt-banner")).not.toBeVisible();
    await expect(page.locator('[data-doubt-mark="true"]')).toHaveCount(0);
  });

  test.skip("15. Rapid hand-raise double-toggle cancels graceful pause (Deprecated: Hand raise removed)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".drawing-svg")).toBeVisible();

    const startClassBtn = page.locator('button[aria-label="Watch prerecorded class"]');
    await expect(startClassBtn).toBeVisible();
    await startClassBtn.click();
    await page.waitForTimeout(300);

    const handBtn = page.locator('button[aria-label="Raise hand"]');
    await expect(handBtn).toBeVisible();
    // First click raises hand
    await handBtn.click();
    await expect(page.locator('button[aria-label="Lower hand"]')).toBeVisible();

    // Rapid second click lowers hand before sentence boundary triggers
    await page.locator('button[aria-label="Lower hand"]').click();
    await expect(page.locator('button[aria-label="Raise hand"]')).toBeVisible();

    // Wait past sentence boundary to confirm lecture continues and doubt banner never appeared
    await page.waitForTimeout(4000);
    await expect(page.locator(".meet-doubt-banner")).not.toBeVisible();
  });

  test("16. Flowchart diamond auto-expands geometry and centers inner text when text exceeds initial size", () => {
    const context = new SpatialContext();
    const fm = new FlowchartManager(null, context);

    const nodes = [
      new FlowchartNodeDef("check_friction", "Is Applied Force F > Limiting Friction f_L?", "decision", "Friction threshold", 80, 30),
    ];
    const fc = fm.createFlowchart("friction_test", "Friction Check", nodes, []);
    const node = fm.getFirstNode("friction_test");
    expect(node).not.toBeNull();

    // Initial width was 80, but text is 43 characters; width must auto-expand past 200
    expect(node!.width).toBeGreaterThanOrEqual(200);
    expect(node!.height).toBeGreaterThanOrEqual(60);

    // BoardMarks should format diamond with centered textAnchor: "middle"
    const marks = fm.flowchartToBoardMarks(fc);
    const textMark = marks.find(m => m.elementId === "check_friction_text");
    expect(textMark).toBeDefined();
    expect(textMark?.textAnchor).toBe("middle");
    expect(textMark?.x).toBe(node!.centerX);
  });

  test("17. Sentence boundary look-ahead smoothly transitions to next cue when current cue is within minWaitSeconds", () => {
    const cues = [
      {
        from: 0,
        to: 4.0,
        text: "We begin with right triangles.",
        firstMark: 0,
        endMark: 1,
      },
      {
        from: 4.0,
        to: 10.0,
        text: "The Pythagorean theorem relates the three sides. Let us see how the squares compare.",
        firstMark: 1,
        endMark: 3,
      },
    ];

    // Current time is 3.8s (only 0.2s before cue 0 ends; minWaitSeconds is 0.4s)
    const boundary = findNextSentenceBoundary(cues, 3.8, 0.4, 4.0);
    expect(boundary.cueIndex).toBe(1);
    expect(boundary.sentenceText).toContain("Pythagorean theorem relates the three sides.");
    expect(boundary.boundaryTime).toBeGreaterThan(4.0);
  });
});
