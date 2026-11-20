# Qrie Canvas Intelligence Engine — Phase 2: Asset Preparation Pipeline

## 1. Overview & Objective

Phase 2 builds a reusable, diagram-agnostic **Asset Preparation Pipeline** that transforms raw educational images and vector diagrams into structured, verified asset maps consumed by the Canvas Intelligence Engine (CIE) and whiteboard renderer.

The existing CIE architecture is preserved and extended rather than rewritten:
- Ingestion, analysis, landmark extraction, geometry generation, relationship mapping, verification workflow, validation, and CIE registration are modularized.
- Human curriculum verification is strictly distinguished from automated detection.
- A hard teaching safety policy prevents actions on unverified or ambiguous targets.
- Benchmark assets (Human Heart, Human Cell, Water Cycle, DC Electric Circuit, Inclined Plane Mechanics) are verified, registered, and validated against the actual SVG DOM whiteboard layers.

---

## 2. Pipeline Architecture & Modular Flow

The pipeline executes a 10-step preparation workflow:

```
[Raw Asset Image / SVG]
          │
          ▼ 1. Ingestion (AssetIngestion)
   • Parse dimensions (SVG viewBox, PNG IHDR, JPEG SOF)
   • Extract vector markup / raster buffer
          │
          ▼ 2. Image Analysis (ImageAnalyzer)
   • Detect text labels, numbered badges, legend clusters, shapes
          │
          ▼ 3. Landmark Extraction (LandmarkExtractor)
   • Generate stable IDs, scientific names, aliases, allowed actions
   • Initialize verificationStatus = 'unverified' or 'tentative'
          │
          ▼ 4. Geometry Generation (GeometryGenerator)
   • Compute bounding boxes, polygon points, SVG paths, anchor pins
   • Clamp coordinates within image boundaries [0, 0, W, H]
          │
          ▼ 5. Relationship Mapping (RelationshipMapper)
   • Map flows_to, powers, opposes, contains, connected_to
   • Enforce referential integrity (no broken targets or self-references)
          │
          ▼ 6. Verification Workflow (VerificationWorkflow)
   • Require authenticated human curriculum signature for 'verified' status
   • Flag uncertain landmarks for manual review
          │
          ▼ 7. Asset-Map Validation (AssetMapValidator)
   • Schema integrity, coordinate overflow checks, alias validation
          │
          ▼ 8. Visual Preview Generation (PreviewGenerator)
   • Wireframe overlays, status color codes, gallery document
          │
          ▼ 9. CIE Registration (CanvasAssetRegistry)
   • Index assets by ID, alias, filename, and source URL
          │
          ▼ 10. Execution & Safety Policy Enforcement (CIE + ActionValidator)
   • Reject unverified targets unless explicit safety policy overrides
```

---

## 3. Core Modules Created

| File | Purpose |
|---|---|
| `src/lib/canvas-intelligence/pipeline/ingestion.ts` | File inspection, format detection (SVG, PNG, JPEG, WebP), dimension extraction (SVG viewBox & PNG/JPEG headers). |
| `src/lib/canvas-intelligence/pipeline/analysis.ts` | Visual component detection, SVG text node parsing, numbered badge clustering, candidate boundary generation. |
| `src/lib/canvas-intelligence/pipeline/extraction.ts` | Semantic element candidate extraction, ID normalization, category deduction, alias generation, allowed action inference. |
| `src/lib/canvas-intelligence/pipeline/geometry-generator.ts` | Exact polygon, box, path, and text geometry computation, anchor pin calculation (`center`, `top`, `bottom`, `left`, `right`), boundary clamping. |
| `src/lib/canvas-intelligence/pipeline/relationships.ts` | Educational relationship definition, directional flow chains, cycle mapping, referential integrity verification. |
| `src/lib/canvas-intelligence/pipeline/verification.ts` | Human curriculum verification state management, reviewer audit trail, uncertain landmark flagging. |
| `src/lib/canvas-intelligence/pipeline/asset-map-validator.ts` | Comprehensive schema, coordinate overflow, and referential integrity validator before registration. |
| `src/lib/canvas-intelligence/pipeline/preview-generator.ts` | Standalone SVG preview generator with color-coded wireframes and interactive HTML gallery document. |
| `src/lib/canvas-intelligence/pipeline/index.ts` | Pipeline orchestrator coordinating the complete 10-step preparation process. |
| `src/lib/canvas-intelligence/registry.ts` | Central asset registry indexing prepared assets and providing factory CIE instantiation. |
| `src/lib/canvas-intelligence/prepared-assets/` | Structured, verified asset map definitions for benchmark diagrams (Cell, Water Cycle, Circuit, Inclined Plane). |

---

## 4. Benchmark Educational Assets Prepared

| Asset ID | Title | Natural Dims | Elements | Verified Status | Key Landmarks & Relationships |
|---|---|---|---|---|---|
| `heart-diagram` | Human Heart & Circulation | 475 × 526 | 14 | 13 Verified, 1 Tentative | Atria, ventricles, valves, aorta, vena cava. Directional blood flow cycle. |
| `human-cell` | Human Cell Anatomy | 430 × 270 | 5 | 5 Verified | Cell membrane, nucleus, mitochondria, rough ER, Golgi body. ER vesicle transport to Golgi. |
| `water-cycle` | Hydrologic Water Cycle | 430 × 270 | 5 | 5 Verified | Sun, evaporation, condensation, precipitation, collection. Complete closed loop flow. |
| `electric-circuit` | DC Electric Circuit | 430 × 270 | 5 | 5 Verified | Battery, control switch, series resistor, lamp, current flow. Clockwise loop current. |
| `inclined-plane` | Inclined Plane Mechanics | 430 × 270 | 8 | 8 Verified | Ramp wedge, mass block, normal force, friction, pull force, gravity, incline angle θ, formulas. |

---

## 5. Verification Policy & Safety Rules

1. **AI Confidence vs Human Verification**:
   - Automated detection or AI models generate candidates with a confidence score (0.00–1.00), but their `verificationStatus` is strictly initialized to `"tentative"` or `"unverified"`.
   - Never mark an element `"verified"` based on an AI score alone.
   - Status only transitions to `"verified"` when signed off with an authenticated human reviewer signature (`reviewerId`, `reviewerName`, `role`, `checklist`, `verifiedAt`).

2. **Teaching Action Safety Policy**:
   - `CIESafetyPolicy` enforces `allowUnverified: false`, `allowTentative: true`, `minConfidence: 0.5`.
   - Any teaching action (highlight, circle, arrow, annotate, etc.) directed at an unverified target is rejected by `ActionValidator`.
   - Ambiguous aliases (matching multiple elements) are rejected.
   - Actions against unverified targets require explicit policy configuration or `bypassSafetyPolicy: true`.

---

## 6. Visual Previews Generated

Visual previews have been generated and archived in `docs/previews/` and `public/previews/`:
- `heart-diagram-preview.svg`
- `human-cell-preview.svg`
- `water-cycle-preview.svg`
- `electric-circuit-preview.svg`
- `inclined-plane-preview.svg`
- `index.html` (interactive preview gallery)
- `preview-gallery.png` (full-page screenshot)
- `browser-heart-live.png` (live Chromium SVG DOM render)
- `browser-cell-live.png` (live Chromium SVG DOM render)
- `browser-water-live.png` (live Chromium SVG DOM render)
- `browser-circuit-live.png` (live Chromium SVG DOM render)
- `browser-plane-live.png` (live Chromium SVG DOM render)
