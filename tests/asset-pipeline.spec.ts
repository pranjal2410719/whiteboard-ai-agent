import { expect, test } from "@playwright/test";
import path from "path";
import fs from "fs";
import {
  AssetIngestion,
  ImageAnalyzer,
  LandmarkExtractor,
  GeometryGenerator,
  RelationshipMapper,
  VerificationWorkflow,
  AssetMapValidator,
  PreviewGenerator,
  AssetPreparationPipeline,
} from "../src/lib/canvas-intelligence/pipeline";
import {
  CanvasAssetRegistry,
  createCellCanvasEngine,
  createCircuitCanvasEngine,
  createHeartCanvasEngine,
  createInclinedPlaneCanvasEngine,
  createWaterCycleCanvasEngine,
  DEFAULT_CIE_SAFETY_POLICY,
  humanHeartAssetMap,
  humanCellAssetMap,
  waterCycleAssetMap,
  electricCircuitAssetMap,
  inclinedPlaneAssetMap,
  transformGeometry,
} from "../src/lib/canvas-intelligence";

test.describe("Asset Preparation Pipeline (Phase 2)", () => {
  test.beforeEach(() => {
    CanvasAssetRegistry.reset();
  });

  test("1. Ingestion: parses natural dimensions and formats for all available SVG and PNG assets", () => {
    const assetsDir = path.resolve(process.cwd(), "public/assets");

    // SVG assets
    const cellPkg = AssetIngestion.ingestFromFile(path.join(assetsDir, "human-cell.svg"));
    expect(cellPkg.format).toBe("svg");
    expect(cellPkg.naturalWidth).toBe(430);
    expect(cellPkg.naturalHeight).toBe(270);
    expect(cellPkg.aspectRatio).toBeCloseTo(430 / 270, 2);

    const waterPkg = AssetIngestion.ingestFromFile(path.join(assetsDir, "water-cycle.svg"));
    expect(waterPkg.format).toBe("svg");
    expect(waterPkg.naturalWidth).toBe(430);
    expect(waterPkg.naturalHeight).toBe(270);

    const circuitPkg = AssetIngestion.ingestFromFile(path.join(assetsDir, "electric-circuit.svg"));
    expect(circuitPkg.format).toBe("svg");
    expect(circuitPkg.naturalWidth).toBe(430);
    expect(circuitPkg.naturalHeight).toBe(270);

    const planePkg = AssetIngestion.ingestFromFile(path.join(assetsDir, "inclined-plane.svg"));
    expect(planePkg.format).toBe("svg");
    expect(planePkg.naturalWidth).toBe(430);
    expect(planePkg.naturalHeight).toBe(270);

    // PNG assets
    const heartPng = AssetIngestion.ingestFromFile(
      path.join(assetsDir, "human-heart_med-removebg-preview.png")
    );
    expect(heartPng.format).toBe("png");
    expect(heartPng.naturalWidth).toBe(475);
    expect(heartPng.naturalHeight).toBe(526);

    const humanCellPng = AssetIngestion.ingestFromFile(path.join(assetsDir, "human_cell_diagram.png"));
    expect(humanCellPng.format).toBe("png");
    expect(humanCellPng.naturalWidth).toBe(387);
    expect(humanCellPng.naturalHeight).toBe(516);
  });

  test("2. Image Analysis: extracts legend clusters, text nodes, and candidate bounds", () => {
    const assetsDir = path.resolve(process.cwd(), "public/assets");
    const cellPkg = AssetIngestion.ingestFromFile(path.join(assetsDir, "human-cell.svg"));

    const features = ImageAnalyzer.analyze(cellPkg);
    expect(features.length).toBeGreaterThanOrEqual(5);

    // Verify numbered legend clusters were identified
    const labels = features.map(f => f.rawName.toLowerCase());
    expect(labels.some(l => l.includes("membrane"))).toBe(true);
    expect(labels.some(l => l.includes("nucleus"))).toBe(true);
    expect(labels.some(l => l.includes("mitochondria"))).toBe(true);

    // Geometry is within bounds
    for (const f of features) {
      expect(f.box.x).toBeGreaterThanOrEqual(0);
      expect(f.box.y).toBeGreaterThanOrEqual(0);
      expect(f.box.x + f.box.w).toBeLessThanOrEqual(cellPkg.naturalWidth);
      expect(f.box.y + f.box.h).toBeLessThanOrEqual(cellPkg.naturalHeight);
    }
  });

  test("3. Semantic Extraction: initializes elements strictly as tentative/unverified, never auto-verified", () => {
    const feature = {
      id: "mitochondria",
      rawName: "Mitochondria (Powerhouse)",
      box: { x: 200, y: 50, w: 80, h: 50 },
      detectionConfidence: 0.99, // Even with 99% AI confidence!
      detectionMethod: "svg-legend-cluster" as const,
      uncertaintyFlags: [],
    };

    const element = LandmarkExtractor.extractElement(feature, 430, 270);

    // STRICT REQUIREMENT: Never mark verified merely because of AI confidence score
    expect(element.verificationStatus).not.toBe("verified");
    expect(element.verificationStatus).toBe("tentative");
    expect(element.id).toBe("mitochondria");
    expect(element.category).toBe("organelle");
    expect(element.allowedActions).toContain("circle");
    expect(element.allowedActions).toContain("pulse");
    expect(element.aliases).toContain("powerhouse");
    expect(element.aliases).toContain("atp");
  });

  test("4. Verification Workflow: requires authentic reviewer signature and maintains audit trail", () => {
    const feature = {
      id: "nucleus",
      rawName: "Nucleus",
      box: { x: 68, y: 64, w: 88, h: 88 },
      detectionConfidence: 0.85,
      detectionMethod: "svg-shape" as const,
      uncertaintyFlags: [],
    };

    const element = LandmarkExtractor.extractElement(feature, 430, 270);
    expect(element.verificationStatus).toBe("unverified");

    // Attempting to verify without reviewer throws
    expect(() => {
      VerificationWorkflow.verifyElement(element, null as any);
    }).toThrow();

    // Verify with curriculum expert signature
    VerificationWorkflow.verifyElement(
      element,
      {
        reviewerId: "EXP-882",
        reviewerName: "Dr. Catherine Vance",
        role: "curriculum-expert",
      },
      { geometryBoundsChecked: true, aliasesChecked: true },
      "Anatomical nuclear coordinates verified against transmission electron micrograph."
    );

    expect(element.verificationStatus).toBe("verified");
    expect(element.verificationRecord?.verifiedBy).toContain("Dr. Catherine Vance");
    expect(element.verificationRecord?.detectionSource).toBe("human-expert");
    expect(element.confidence).toBeGreaterThanOrEqual(0.96);

    // Flagging uncertain landmark resets status
    VerificationWorkflow.flagUncertainLandmark(element, "Boundary needs sub-organelle refinement");
    expect(element.verificationStatus).toBe("unverified");
    expect(element.verificationRecord?.notes).toContain("FLAGGED FOR HUMAN VERIFICATION");
  });

  test("5. Relationship Mapping: preserves referential integrity and supports directional cycles", () => {
    const elements = [...waterCycleAssetMap.elements];

    // Validate existing water cycle relationships
    const validation = RelationshipMapper.validateAllRelationships(elements);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);

    // Reject self-referential relationship
    const selfRel = RelationshipMapper.addRelationship(elements, {
      sourceId: "sun",
      targetId: "sun",
      type: "powers",
    });
    expect(selfRel.success).toBe(false);
    expect(selfRel.error).toContain("Cannot create self-referential relationship");

    // Reject relationship to missing target
    const invalidTarget = RelationshipMapper.addRelationship(elements, {
      sourceId: "sun",
      targetId: "black-hole-99",
      type: "powers",
    });
    expect(invalidTarget.success).toBe(false);
    expect(invalidTarget.error).toContain("does not exist");
  });

  test("6. Asset Map Validation: rejects geometry bounds overflow and invalid coordinates", () => {
    const invalidAsset = {
      assetId: "broken-diagram",
      title: "Broken Diagram",
      subject: "Physics",
      source: "/assets/broken.svg",
      naturalWidth: 430,
      naturalHeight: 270,
      elements: [
        {
          id: "overflow-element",
          name: "Overflow Element",
          category: "structure" as const,
          geometry: {
            kind: "box" as const,
            box: { x: 300, y: 100, w: 200, h: 50 }, // 300 + 200 = 500 > 430 width!
          },
          aliases: ["overflow"],
          relationships: [],
          confidence: 0.9,
          verificationStatus: "verified" as const,
          allowedActions: ["highlight" as const],
        },
      ],
    };

    const res = AssetMapValidator.validate(invalidAsset);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes("horizontal overflow"))).toBe(true);
  });

  test("7. Registry & CIE Factory: registers all 5 benchmark assets and instantiates engines", () => {
    const assets = CanvasAssetRegistry.listRegisteredAssets();
    expect(assets.length).toBe(5);

    const ids = assets.map(a => a.assetId);
    expect(ids).toContain("heart-diagram");
    expect(ids).toContain("human-cell");
    expect(ids).toContain("water-cycle");
    expect(ids).toContain("electric-circuit");
    expect(ids).toContain("inclined-plane");

    // All benchmark assets must be verified and teaching-ready
    for (const a of assets) {
      expect(a.isTeachingReady).toBe(true);
      expect(a.elementsCount).toBeGreaterThanOrEqual(5);
    }

    // Instantiation factories
    const heartEng = createHeartCanvasEngine();
    expect(heartEng.findElement("left-ventricle")).not.toBeNull();

    const cellEng = createCellCanvasEngine();
    expect(cellEng.findElement("mitochondria")).not.toBeNull();

    const waterEng = createWaterCycleCanvasEngine();
    expect(waterEng.findElement("evaporation")).not.toBeNull();

    const circuitEng = createCircuitCanvasEngine();
    expect(circuitEng.findElement("battery")).not.toBeNull();

    const planeEng = createInclinedPlaneCanvasEngine();
    expect(planeEng.findElement("normal-force")).not.toBeNull();
  });

  test("8. Safety Policy: rejects actions on unverified elements unless explicitly allowed", () => {
    const testMap = {
      assetId: "safety-test",
      title: "Safety Test Diagram",
      subject: "Biology",
      source: "/assets/test.svg",
      naturalWidth: 430,
      naturalHeight: 270,
      elements: [
        {
          id: "verified-organelle",
          name: "Verified Organelle",
          category: "organelle" as const,
          geometry: { kind: "box" as const, box: { x: 50, y: 50, w: 80, h: 60 } },
          aliases: ["vo"],
          relationships: [],
          confidence: 0.98,
          verificationStatus: "verified" as const,
          allowedActions: ["highlight" as const, "circle" as const],
        },
        {
          id: "unverified-organelle",
          name: "Unverified Organelle",
          category: "organelle" as const,
          geometry: { kind: "box" as const, box: { x: 150, y: 50, w: 80, h: 60 } },
          aliases: ["uo"],
          relationships: [],
          confidence: 0.70,
          verificationStatus: "unverified" as const,
          allowedActions: ["highlight" as const, "circle" as const],
        },
      ],
    };

    CanvasAssetRegistry.registerAsset(testMap);
    const engine = CanvasAssetRegistry.createEngine("safety-test");

    // Action on verified element succeeds
    const ok = engine.highlightElement("verified-organelle");
    expect(ok.success).toBe(true);

    // Action on unverified element is REJECTED by safety policy
    const blocked = engine.highlightElement("unverified-organelle");
    expect(blocked.success).toBe(false);
    expect(blocked.message).toContain("Safety policy violation: Element 'Unverified Organelle' (unverified-organelle) is unverified");

    // Explicit bypass allows execution
    const bypassed = engine.executeAction({
      action: "highlight",
      targetElementId: "unverified-organelle",
      bypassSafetyPolicy: true,
    });
    expect(bypassed.success).toBe(true);

    // Setting engine safety policy to allow unverified permits execution
    engine.setSafetyPolicy({ allowUnverified: true });
    const nowPermitted = engine.circleElement("unverified-organelle");
    expect(nowPermitted.success).toBe(true);
  });

  test("9. Coordinate Transformation & Dynamic Repositioning across assets", () => {
    const cellEng = createCellCanvasEngine();
    // Cell starts at placement: x=515, y=30, w=430, h=270 (scaleX = 1, scaleY = 1)
    const initialDisp = cellEng.getDisplayedAsset();
    expect(initialDisp?.x).toBe(515);
    expect(initialDisp?.scaleX).toBe(1);

    // Highlight mitochondria (local x=207, y=53)
    const h1 = cellEng.highlightElement("mitochondria");
    expect(h1.success).toBe(true);
    const mark1 = h1.marks[0];
    expect(mark1.x).toBe(515 + 207 - 4); // 718

    // Reposition diagram to x=100, y=50, w=215, h=135 (50% scale)
    const updatedMarks = cellEng.repositionAsset({ x: 100, y: 50, w: 215, h: 135 });
    expect(cellEng.getDisplayedAsset()?.scaleX).toBeCloseTo(0.5, 2);

    // Mitochondria mark coordinate dynamically scaled and repositioned
    const updatedMito = updatedMarks[0];
    expect(updatedMito.x).toBe(Math.round(100 + 207 * 0.5 - 4));
  });

  test("10. Full Reusable Pipeline: processes new raw asset end-to-end", () => {
    const filePath = path.resolve(process.cwd(), "public/assets/human-cell.svg");

    const result = AssetPreparationPipeline.prepareAsset(filePath, {
      ingestion: {
        assetId: "pipeline-test-cell",
        title: "Test Prepared Cell",
        subject: "Biology",
      },
      verifications: [
        {
          elementId: "1-cell-membrane",
          reviewer: {
            reviewerId: "REV-1",
            reviewerName: "QA Lead",
            role: "qa-reviewer",
          },
        },
      ],
      generatePreview: false,
    });

    expect(result.success).toBe(true);
    expect(result.validation.valid).toBe(true);
    expect(result.assetMap.elements.length).toBeGreaterThanOrEqual(5);
    expect(result.audit.verifiedCount).toBe(1);

    // Register with CIE
    const reg = CanvasAssetRegistry.registerAsset(result.assetMap, { replace: true });
    expect(reg.success).toBe(true);

    const eng = CanvasAssetRegistry.createEngine("pipeline-test-cell");
    expect(eng.getCanvasState().activeAssetId).toBe("pipeline-test-cell");
  });

  test("11. Visual Previews: captures SVG preview documents for all prepared benchmark assets", () => {
    const previewDir = path.resolve(process.cwd(), "docs/previews");
    expect(fs.existsSync(previewDir)).toBe(true);

    const expectedFiles = [
      "heart-diagram-preview.svg",
      "human-cell-preview.svg",
      "water-cycle-preview.svg",
      "electric-circuit-preview.svg",
      "inclined-plane-preview.svg",
      "index.html",
    ];

    for (const f of expectedFiles) {
      const p = path.join(previewDir, f);
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, "utf-8");
      expect(content.length).toBeGreaterThan(100);
    }
  });

  test("12. Pipeline automatically ingests and prepares unnumbered DC Electric Circuit SVG without manual hints", () => {
    const circuitPath = path.resolve(process.cwd(), "public/assets/electric-circuit.svg");
    const result = AssetPreparationPipeline.prepareAsset(circuitPath);

    expect(result.success).toBe(true);
    expect(result.validation.valid).toBe(true);
    expect(result.validation.errors.length).toBe(0);
    expect(result.assetMap.elements.length).toBeGreaterThanOrEqual(5);

    // Check specific circuit elements are identified and unique
    const ids = result.assetMap.elements.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length); // All strictly unique
    expect(ids).toContain("battery");
    expect(ids).toContain("resistor");
    expect(ids).toContain("switch");
  });

  test("13. Pipeline automatically ingests and prepares Inclined Plane Mechanics diagram", () => {
    const planePath = path.resolve(process.cwd(), "public/assets/inclined-plane.svg");
    const result = AssetPreparationPipeline.prepareAsset(planePath);

    expect(result.success).toBe(true);
    expect(result.validation.valid).toBe(true);
    expect(result.assetMap.elements.length).toBeGreaterThanOrEqual(5);

    const elementNames = result.assetMap.elements.map(e => e.name.toLowerCase());
    expect(elementNames.some(n => n.includes("block") || n.includes("mass"))).toBe(true);
    expect(elementNames.some(n => n.includes("normal") || n.includes("force"))).toBe(true);
  });

  test("14. Engine eraseTeacherMark resolves natural language aliases and multi-word names", () => {
    const cellEngine = createCellCanvasEngine();
    const hRes = cellEngine.highlightElement("mitochondria");
    expect(hRes.success).toBe(true);
    expect(cellEngine.getActiveMarks().length).toBeGreaterThan(0);

    // Erase using natural language alias "powerhouse"
    const eraseAlias = cellEngine.eraseTeacherMark("powerhouse");
    expect(eraseAlias.success).toBe(true);
    expect(cellEngine.getActiveMarks().length).toBe(0);

    // Heart engine: erase using spaced natural name "right atrium"
    const heartEngine = createHeartCanvasEngine();
    heartEngine.highlightElement("right-atrium");
    expect(heartEngine.getActiveMarks().length).toBeGreaterThan(0);

    const eraseSpaced = heartEngine.eraseTeacherMark("right atrium");
    expect(eraseSpaced.success).toBe(true);
    expect(heartEngine.getActiveMarks().length).toBe(0);
  });
});
