import type { DiagramRegion } from "../types";
import type { PedagogyStage } from "../pedagogy/types";
import type {
  LayoutConfig,
  LayoutPatternDefinition,
  LayoutPatternType,
  LayoutZone,
  RectBounds,
} from "./types";

export const DEFAULT_CANVAS_BOUNDS: RectBounds = {
  x: 0,
  y: 0,
  w: 1000,
  h: 330,
};

export const DEFAULT_CLASSIC_DIAGRAM_BOUNDS: RectBounds = {
  x: 540,
  y: 16,
  w: 420,
  h: 300,
};

export class LayoutPatternEngine {
  private static patterns = new Map<LayoutPatternType, LayoutPatternDefinition>();

  static registerPattern(definition: LayoutPatternDefinition): void {
    this.patterns.set(definition.type, definition);
  }

  static getPattern(type: LayoutPatternType): LayoutPatternDefinition | undefined {
    return this.patterns.get(type);
  }

  static getAllPatterns(): LayoutPatternDefinition[] {
    return Array.from(this.patterns.values());
  }

  static hasPattern(type: string): type is LayoutPatternType {
    return this.patterns.has(type as LayoutPatternType);
  }

  static resolveZones(type: LayoutPatternType, config?: LayoutConfig): LayoutZone[] {
    const pattern = this.patterns.get(type);
    if (!pattern) {
      return this.patterns.get("classic-split")!.resolveZones(config);
    }
    return pattern.resolveZones(config);
  }

  static getDiagramBounds(type: LayoutPatternType, config?: LayoutConfig): RectBounds {
    const pattern = this.patterns.get(type);
    if (!pattern) {
      return this.patterns.get("classic-split")!.getDiagramBounds(config);
    }
    return pattern.getDiagramBounds(config);
  }

  /**
   * Spatially transforms diagram regions from default bounds into target bounds
   * preserving relative placement, aspect ratio, and margin spacing.
   */
  static transformRegions(
    regions: DiagramRegion[],
    fromBounds: RectBounds,
    toBounds: RectBounds
  ): DiagramRegion[] {
    if (
      fromBounds.x === toBounds.x &&
      fromBounds.y === toBounds.y &&
      fromBounds.w === toBounds.w &&
      fromBounds.h === toBounds.h
    ) {
      return regions;
    }

    const scaleX = toBounds.w / Math.max(1, fromBounds.w);
    const scaleY = toBounds.h / Math.max(1, fromBounds.h);

    return regions.map((r) => {
      const relX = r.x - fromBounds.x;
      const relY = r.y - fromBounds.y;
      const newX = Math.round(toBounds.x + relX * scaleX);
      const newY = Math.round(toBounds.y + relY * scaleY);
      const newW = Math.max(10, Math.round(r.w * scaleX));
      const newH = Math.max(10, Math.round(r.h * scaleY));

      return {
        ...r,
        x: newX,
        y: newY,
        w: newW,
        h: newH,
      };
    });
  }

  /**
   * Intelligently selects the optimal layout pattern given pedagogical stage, topic, and context.
   */
  static selectPatternForPedagogy(
    stage: PedagogyStage | string,
    options: {
      topic?: string;
      classKey?: string;
      sceneIndex?: number;
      preferDerivation?: boolean;
      preferComparison?: boolean;
    } = {}
  ): LayoutPatternType {
    if (options.preferDerivation) return "step-by-step-derivation";
    if (options.preferComparison) return "multi-panel-comparison";

    const topicLower = (options.topic || "").toLowerCase();
    const isMath = topicLower.includes("trig") || topicLower.includes("math") || topicLower.includes("pythagor");
    const isProcess = topicLower.includes("pipeline") || topicLower.includes("respiration") || topicLower.includes("synthesis");

    switch (stage) {
      case "INTRODUCE":
      case "HOOK":
        return isMath ? "classic-split" : "centered-focal-hero";

      case "VISUAL_DEMO":
      case "EXPLORATION":
        return isMath ? "step-by-step-derivation" : "top-diagram-bottom-timeline";

      case "CHECKPOINT":
      case "EXPLANATION":
        if (isMath) return "step-by-step-derivation";
        if (isProcess) return "top-diagram-bottom-timeline";
        return "classic-split";

      case "EVALUATE_AND_REMEDIATE":
      case "APPLICATION":
      case "PRACTICE":
        return "multi-panel-comparison";

      case "SYNTHESIS":
        return "floating-radial-annotation";

      default:
        // By scene index rotation if unknown
        if (options.sceneIndex !== undefined) {
          const rotation: LayoutPatternType[] = [
            "classic-split",
            "multi-panel-comparison",
            "top-diagram-bottom-timeline",
            "centered-focal-hero",
          ];
          return rotation[options.sceneIndex % rotation.length];
        }
        return "classic-split";
    }
  }
}

// ---------------------------------------------------------------------------
// Pattern Registrations
// ---------------------------------------------------------------------------

// 1. Classic Split
LayoutPatternEngine.registerPattern({
  type: "classic-split",
  name: "Classic Split",
  description: "Standard dual-column layout with left heading/notes and right focal diagram asset.",
  pedagogicalAffordance: "Structured concept introduction with clear visual reference on the right.",
  recommendedStages: ["INTRODUCE", "VISUAL_DEMO"],
  resolveZones(config) {
    const split = config?.splitRatio || 0.48;
    const leftWidth = Math.round(920 * split);
    const rightX = 50 + leftWidth + (config?.gap || 25);
    const rightWidth = 955 - rightX;
    return [
      { id: "heading", role: "heading", bounds: { x: 50, y: 14, w: leftWidth, h: 56 } },
      { id: "content", role: "content", bounds: { x: 50, y: 76, w: leftWidth, h: 238 } },
      { id: "diagram", role: "diagram", bounds: { x: rightX, y: 14, w: rightWidth, h: 300 } },
    ];
  },
  getDiagramBounds(config) {
    const zones = this.resolveZones(config);
    return zones.find((z) => z.id === "diagram")!.bounds;
  },
  transformRegion(region, defaultBounds, config) {
    const target = this.getDiagramBounds(config);
    return LayoutPatternEngine.transformRegions([region], defaultBounds, target)[0];
  },
});

// 2. Inverted Split
LayoutPatternEngine.registerPattern({
  type: "inverted-split",
  name: "Inverted Split",
  description: "Flipped layout with visual asset on the left and structured notes/takeaways on the right.",
  pedagogicalAffordance: "Shifts student attention to visual cues first before walking through structured takeaways.",
  recommendedStages: ["EVALUATE_AND_REMEDIATE"],
  resolveZones(config) {
    const split = config?.splitRatio || 0.48;
    const leftWidth = Math.round(920 * split);
    const rightX = 50 + leftWidth + (config?.gap || 25);
    const rightWidth = 955 - rightX;
    return [
      { id: "diagram", role: "diagram", bounds: { x: 45, y: 14, w: leftWidth, h: 300 } },
      { id: "heading", role: "heading", bounds: { x: rightX, y: 14, w: rightWidth, h: 56 } },
      { id: "content", role: "content", bounds: { x: rightX, y: 76, w: rightWidth, h: 238 } },
    ];
  },
  getDiagramBounds(config) {
    const zones = this.resolveZones(config);
    return zones.find((z) => z.id === "diagram")!.bounds;
  },
  transformRegion(region, defaultBounds, config) {
    const target = this.getDiagramBounds(config);
    return LayoutPatternEngine.transformRegions([region], defaultBounds, target)[0];
  },
});

// 3. Centered Focal Hero with Callouts
LayoutPatternEngine.registerPattern({
  type: "centered-focal-hero",
  name: "Centered Focal Hero with Callouts",
  description: "Prominent centered diagram hero flanked symmetrically by left and right callout cards.",
  pedagogicalAffordance: "Holistic system anatomy where bilateral components point into a core focal structure.",
  recommendedStages: ["INTRODUCE", "SYNTHESIS"],
  resolveZones(config) {
    const heroW = 320;
    const heroX = Math.round((1000 - heroW) / 2);
    const flankW = heroX - 70;
    return [
      { id: "heading", role: "heading", bounds: { x: 50, y: 12, w: 900, h: 36 } },
      { id: "callouts-left", role: "callouts-left", bounds: { x: 45, y: 55, w: flankW, h: 255 } },
      { id: "diagram", role: "diagram", bounds: { x: heroX, y: 48, w: heroW, h: 265 } },
      { id: "callouts-right", role: "callouts-right", bounds: { x: heroX + heroW + 25, y: 55, w: flankW, h: 255 } },
    ];
  },
  getDiagramBounds(config) {
    const zones = this.resolveZones(config);
    return zones.find((z) => z.id === "diagram")!.bounds;
  },
  transformRegion(region, defaultBounds, config) {
    const target = this.getDiagramBounds(config);
    return LayoutPatternEngine.transformRegions([region], defaultBounds, target)[0];
  },
});

// 4. Top Diagram with Bottom Comparative Steps / Timeline
LayoutPatternEngine.registerPattern({
  type: "top-diagram-bottom-timeline",
  name: "Top Diagram with Bottom Timeline Steps",
  description: "Horizontal visual banner on top with sequential chronological process cards beneath.",
  pedagogicalAffordance: "Step-by-step biological cascades, algorithmic derivations, and temporal workflows.",
  recommendedStages: ["VISUAL_DEMO", "CHECKPOINT"],
  resolveZones(config) {
    return [
      { id: "heading", role: "heading", bounds: { x: 50, y: 10, w: 320, h: 36 } },
      { id: "diagram", role: "diagram", bounds: { x: 380, y: 10, w: 570, h: 145 } },
      { id: "steps", role: "steps", bounds: { x: 45, y: 168, w: 910, h: 148 } },
    ];
  },
  getDiagramBounds(config) {
    const zones = this.resolveZones(config);
    return zones.find((z) => z.id === "diagram")!.bounds;
  },
  transformRegion(region, defaultBounds, config) {
    const target = this.getDiagramBounds(config);
    return LayoutPatternEngine.transformRegions([region], defaultBounds, target)[0];
  },
});

// 5. Step-by-Step Derivation / Equation Flow
LayoutPatternEngine.registerPattern({
  type: "step-by-step-derivation",
  name: "Step-by-Step Derivation & Equation Flow",
  description: "Cascading mathematical formula flow with tinted derivation containers and side geometric anchor.",
  pedagogicalAffordance: "Mathematical proofs, algebraic manipulations, and rigorous concept derivation.",
  recommendedStages: ["VISUAL_DEMO", "CHECKPOINT"],
  resolveZones(config) {
    return [
      { id: "heading", role: "heading", bounds: { x: 50, y: 12, w: 580, h: 38 } },
      { id: "derivation", role: "derivation", bounds: { x: 45, y: 55, w: 590, h: 260 } },
      { id: "diagram", role: "diagram", bounds: { x: 655, y: 22, w: 300, h: 290 } },
    ];
  },
  getDiagramBounds(config) {
    const zones = this.resolveZones(config);
    return zones.find((z) => z.id === "diagram")!.bounds;
  },
  transformRegion(region, defaultBounds, config) {
    const target = this.getDiagramBounds(config);
    return LayoutPatternEngine.transformRegions([region], defaultBounds, target)[0];
  },
});

// 6. Multi-Panel Comparison
LayoutPatternEngine.registerPattern({
  type: "multi-panel-comparison",
  name: "Multi-Panel Comparison",
  description: "Symmetric comparative cards placed side-by-side with individual subtitles, badges, and contrasting accents.",
  pedagogicalAffordance: "Comparative analysis, opposing ratio contrast (Sine vs Cosine), and structural divergence.",
  recommendedStages: ["CHECKPOINT", "EVALUATE_AND_REMEDIATE"],
  resolveZones(config) {
    const panelW = 435;
    return [
      { id: "heading", role: "heading", bounds: { x: 50, y: 10, w: 900, h: 36 } },
      { id: "panel-left", role: "panel-left", bounds: { x: 45, y: 52, w: panelW, h: 260 } },
      { id: "panel-right", role: "panel-right", bounds: { x: 520, y: 52, w: panelW, h: 260 } },
    ];
  },
  getDiagramBounds(config) {
    // Left panel thumbnail area
    return { x: 520, y: 60, w: 435, h: 250 };
  },
  transformRegion(region, defaultBounds, config) {
    const target = this.getDiagramBounds(config);
    return LayoutPatternEngine.transformRegions([region], defaultBounds, target)[0];
  },
});

// 7. Floating Radial Annotation
LayoutPatternEngine.registerPattern({
  type: "floating-radial-annotation",
  name: "Floating Radial Annotation",
  description: "Central focal structure surrounded by orbiting radial callout cards, spotlight guides, and angular pointers.",
  pedagogicalAffordance: "Comprehensive organelle tour or multi-angle geometric property exploration.",
  recommendedStages: ["SYNTHESIS", "VISUAL_DEMO"],
  resolveZones(config) {
    return [
      { id: "heading", role: "heading", bounds: { x: 50, y: 10, w: 900, h: 36 } },
      { id: "diagram", role: "diagram", bounds: { x: 380, y: 55, w: 240, h: 250 } },
      { id: "callouts-left", role: "callouts-left", bounds: { x: 45, y: 55, w: 310, h: 250 } },
      { id: "callouts-right", role: "callouts-right", bounds: { x: 645, y: 55, w: 310, h: 250 } },
    ];
  },
  getDiagramBounds(config) {
    const zones = this.resolveZones(config);
    return zones.find((z) => z.id === "diagram")!.bounds;
  },
  transformRegion(region, defaultBounds, config) {
    const target = this.getDiagramBounds(config);
    return LayoutPatternEngine.transformRegions([region], defaultBounds, target)[0];
  },
});
