import { test, expect } from "@playwright/test";
import {
  ingestImage,
  detectMimeType,
  MAX_IMAGE_SIZE_BYTES,
  preprocessImage,
  clampNormalizedBox,
  VisualSceneGraph,
  computeSpatialRelation,
  projectToCanvas,
  groundVisualObject,
  DEFAULT_CANVAS_PLACEMENT,
  MIN_CONFIDENCE_THRESHOLD,
  classifyDiagramDomain,
  getDomainTeachingHints,
  VisualCache,
  analyzeAndGroundVisual,
  HeuristicVisionProvider,
  type VisualObject,
  type VisualScene,
} from "../src/lib/vision";

// 1x1 Transparent PNG for testing
const SAMPLE_PNG_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// Valid SVG diagram string
const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect x="100" y="50" width="200" height="150" fill="#c0504d"/>
  <text x="110" y="80">Aorta</text>
</svg>`;

test.describe("Vision-Guided Teaching & Precision Annotation Engine", () => {
  test.describe("1. Image Ingestion, Validation & Preprocessing", () => {
    test("validates and ingests standard PNG data URL", () => {
      const res = ingestImage(SAMPLE_PNG_BASE64);
      expect(res.valid).toBe(true);
      expect(res.mimeType).toBe("image/png");
      expect(res.fileHash.length).toBe(64); // SHA-256
      expect(res.naturalWidth).toBeGreaterThan(0);
      expect(res.naturalHeight).toBeGreaterThan(0);
    });

    test("validates and detects SVG diagram payload", () => {
      const res = ingestImage(Buffer.from(SAMPLE_SVG, "utf-8"));
      expect(res.valid).toBe(true);
      expect(res.mimeType).toBe("image/svg+xml");
      expect(res.naturalWidth).toBe(800);
      expect(res.naturalHeight).toBe(600);
    });

    test("rejects empty payload", () => {
      const res = ingestImage("");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Empty image");
    });

    test("rejects oversized images exceeding 10MB limit", () => {
      const oversized = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1024, 0);
      const res = ingestImage(oversized);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("exceeds maximum allowed size");
    });

    test("preprocessor normalizes dimensions and generates valid dataUrl", () => {
      const ingestion = ingestImage(SAMPLE_PNG_BASE64);
      const pre = preprocessImage(ingestion);
      expect(pre.hash).toBe(ingestion.fileHash);
      expect(pre.aspectRatio).toBeGreaterThan(0);
      expect(pre.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    });

    test("clamps normalized bounding boxes to [0, 1]", () => {
      const clamped = clampNormalizedBox({ ymin: -0.2, xmin: 0.1, ymax: 1.5, xmax: 0.9 });
      expect(clamped.ymin).toBe(0);
      expect(clamped.ymax).toBe(1);
      expect(clamped.xmin).toBe(0.1);
      expect(clamped.xmax).toBe(0.9);
    });
  });

  test.describe("2. Visual Scene Graph & Spatial Relationships", () => {
    const mockScene: VisualScene = {
      imageId: "img_test_heart",
      imageHash: "testhash123",
      source: "uploaded",
      dimensions: { naturalWidth: 800, naturalHeight: 600, aspectRatio: 1.333 },
      objects: [
        {
          id: "aorta",
          label: "Aorta",
          category: "organ",
          boundingBox: { ymin: 0.08, xmin: 0.42, ymax: 0.28, xmax: 0.62 },
          confidence: 0.96,
          aliases: ["aorta", "systemic aorta", "main artery"],
        },
        {
          id: "left_ventricle",
          label: "Left Ventricle",
          category: "organ",
          boundingBox: { ymin: 0.45, xmin: 0.52, ymax: 0.78, xmax: 0.78 },
          confidence: 0.95,
          aliases: ["left ventricle"],
        },
      ],
      textRegions: [
        { text: "Aorta", boundingBox: { ymin: 0.04, xmin: 0.45, ymax: 0.08, xmax: 0.55 }, confidence: 0.98 },
      ],
      relationships: [
        { sourceId: "left_ventricle", targetId: "aorta", relation: "flows_to" },
      ],
      detectedAt: new Date().toISOString(),
    };

    test("finds objects by exact label, normalized label, and synonyms", () => {
      const graph = new VisualSceneGraph(mockScene);

      const exact = graph.findObject("Aorta");
      expect(exact).not.toBeNull();
      expect(exact?.id).toBe("aorta");

      const alias = graph.findObject("main artery");
      expect(alias).not.toBeNull();
      expect(alias?.id).toBe("aorta");

      const caseInsensitive = graph.findObject("left ventricle");
      expect(caseInsensitive?.id).toBe("left_ventricle");

      const notFound = graph.findObject("pancreas");
      expect(notFound).toBeNull();
    });

    test("computes spatial directional relationships correctly", () => {
      const rel = computeSpatialRelation(
        mockScene.objects[0].boundingBox, // Aorta (ymin 0.08)
        mockScene.objects[1].boundingBox  // Left Ventricle (ymin 0.45)
      );
      // Left ventricle is below Aorta
      expect(rel).toBe("above"); // from perspective of Aorta, LV is below it (dy > 0)
    });

    test("classifies diagram domain as biology_cardiovascular", () => {
      const domain = classifyDiagramDomain(mockScene);
      expect(domain).toBe("biology_cardiovascular");

      const hints = getDomainTeachingHints(domain, mockScene);
      expect(hints.recommendedStartComponent).toBe("aorta");
      expect(hints.flowDescription).toContain("Deoxygenated blood");
    });
  });

  test.describe("3. Spatial Grounding Engine & Precision Whiteboard Annotations", () => {
    const aortaObj: VisualObject = {
      id: "aorta",
      label: "Aorta",
      category: "organ",
      boundingBox: { ymin: 0.1, xmin: 0.4, ymax: 0.3, xmax: 0.6 },
      confidence: 0.95,
      aliases: ["aorta"],
    };

    test("projects normalized coordinates accurately into whiteboard canvas space", () => {
      const canvasBox = projectToCanvas(aortaObj.boundingBox, DEFAULT_CANVAS_PLACEMENT);

      // DEFAULT_CANVAS_PLACEMENT: x=580, y=16, width=270, height=298
      // Expected x = 580 + 0.4 * 270 = 580 + 108 = 688
      // Expected y = 16 + 0.1 * 298 = 16 + 29.8 ~= 46
      // Expected width = 0.2 * 270 = 54
      // Expected height = 0.2 * 298 = 59.6 ~= 60
      expect(canvasBox.x).toBe(688);
      expect(canvasBox.y).toBe(46);
      expect(canvasBox.width).toBe(54);
      expect(canvasBox.height).toBe(60);
    });

    test("generates precision 'circle' annotation with label clearance margin", () => {
      const res = groundVisualObject(aortaObj, "circle", DEFAULT_CANVAS_PLACEMENT);

      expect(res.requiresClarification).toBe(false);
      expect(res.annotation.action).toBe("circle");
      expect(res.annotation.target).toBe("Aorta");
      expect(res.annotation.shape?.type).toBe("ellipse");
      expect(res.annotation.shape?.centerX).toBe(688 + 27); // 715
      expect(res.annotation.shape?.centerY).toBe(46 + 30);  // 76

      // Clearance margin ensures radius > half width
      expect(res.annotation.shape?.radiusX).toBeGreaterThan(27);
      expect(res.annotation.shape?.radiusY).toBeGreaterThan(30);

      // Generates matching BoardMark for teacher-annotations layer
      expect(res.marks.length).toBe(1);
      const mark = res.marks[0];
      expect(mark.type).toBe("ellipse");
      expect(mark.layer).toBe("teacher-annotations");
      expect(mark.annotation).toBe(true);
      expect(mark.fill).toBe("none");
    });

    test("generates precision 'underline' annotation beneath component base", () => {
      const res = groundVisualObject(aortaObj, "underline", DEFAULT_CANVAS_PLACEMENT);

      expect(res.annotation.action).toBe("underline");
      expect(res.marks.length).toBe(1);
      const mark = res.marks[0];
      expect(mark.type).toBe("path");
      expect(mark.d?.startsWith("M ")).toBe(true);
      expect(mark.layer).toBe("teacher-annotations");
    });

    test("generates precision 'arrow' annotation with tip and wings pointing to target", () => {
      const res = groundVisualObject(aortaObj, "arrow", DEFAULT_CANVAS_PLACEMENT, {
        arrowFrom: { x: 500, y: 76 },
      });

      expect(res.annotation.action).toBe("arrow");
      expect(res.marks.length).toBe(1);
      const mark = res.marks[0];
      expect(mark.type).toBe("path");
      expect(mark.d).toContain("M 500 76"); // Starts at specified arrowFrom
      expect(mark.d).toContain("L");        // Reaches target
      expect(mark.layer).toBe("teacher-annotations");
    });

    test("generates precision 'pointer' ephemeral spotlight on overlays layer", () => {
      const res = groundVisualObject(aortaObj, "pointer", DEFAULT_CANVAS_PLACEMENT);

      expect(res.annotation.action).toBe("pointer");
      expect(res.annotation.duration).toBe(2500);
      expect(res.marks.length).toBe(2); // Central dot + outer pulse circle
      expect(res.marks[0].layer).toBe("overlays");
      expect(res.marks[1].layer).toBe("overlays");
    });

    test("flags low-confidence detection (< 0.65) and refrains from drawing wrong marks", () => {
      const lowConfObj: VisualObject = {
        ...aortaObj,
        confidence: 0.45, // Below MIN_CONFIDENCE_THRESHOLD (0.65)
      };

      const res = groundVisualObject(lowConfObj, "circle", DEFAULT_CANVAS_PLACEMENT);
      expect(res.requiresClarification).toBe(true);
      expect(res.marks.length).toBe(0); // Zero erroneous canvas marks
      expect(res.annotation.requiresClarification).toBe(true);
    });
  });

  test.describe("4. Visual Cache & SLA Latency Budgets", () => {
    test("in-memory cache retrieves stored scene graph in under 10ms", async () => {
      const cache = VisualCache.getInstance();
      cache.clear();

      const testHash = "perf_test_hash_42";
      const dummyScene: VisualScene = {
        imageId: "img_perf",
        imageHash: testHash,
        source: "uploaded",
        dimensions: { naturalWidth: 400, naturalHeight: 300, aspectRatio: 1.33 },
        objects: [],
        textRegions: [],
        relationships: [],
        detectedAt: new Date().toISOString(),
      };

      cache.set(testHash, dummyScene);

      const t0 = performance.now();
      const retrieved = cache.get(testHash);
      const latency = performance.now() - t0;

      expect(retrieved).not.toBeNull();
      expect(retrieved?.imageHash).toBe(testHash);
      expect(latency).toBeLessThan(10); // Target SLA: < 100ms, actual < 10ms
    });

    test("pipeline sets cached: true on repeated analysis of same image", async () => {
      const provider = new HeuristicVisionProvider();

      // First run (populates cache)
      const res1 = await analyzeAndGroundVisual(
        { imageBase64: SAMPLE_PNG_BASE64, target: "heart" },
        { provider }
      );
      expect(res1.success).toBe(true);

      // Second run (cache hit)
      const res2 = await analyzeAndGroundVisual(
        { imageBase64: SAMPLE_PNG_BASE64, target: "heart" },
        { provider }
      );
      expect(res2.success).toBe(true);
      expect(res2.cached).toBe(true);
      expect(res2.latencyMs).toBeLessThan(100);
    });
  });

  test.describe("5. End-to-End Next.js API Route (/api/vision)", () => {
    test("POST /api/vision with heart diagram and target aorta returns grounded marks", async ({
      request,
    }) => {
      const res = await request.post("/api/vision", {
        data: {
          image: SAMPLE_PNG_BASE64,
          target: "aorta",
          action: "circle",
          query: "Circle the aorta and show oxygenated flow",
        },
      });

      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.scene).toBeDefined();
      expect(body.annotations.length).toBeGreaterThan(0);
      expect(body.annotations[0].action).toBe("circle");
      expect(body.marks.length).toBeGreaterThan(0);
      expect(body.marks[0].layer).toBe("teacher-annotations");
    });

    test("POST /api/vision with unknown target returns clarification without error", async ({
      request,
    }) => {
      const res = await request.post("/api/vision", {
        data: {
          image: SAMPLE_PNG_BASE64,
          target: "non_existent_organ_xyz",
        },
      });

      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.clarificationRequired).toBe(true);
      expect(body.clarificationPrompt).toContain("could not pinpoint");
    });

    test("POST /api/vision rejects missing image payload with 400", async ({ request }) => {
      const res = await request.post("/api/vision", {
        data: {
          target: "aorta",
        },
      });

      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("Missing image payload");
    });
  });
});
