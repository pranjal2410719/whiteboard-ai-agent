import type {
  AllowedAction,
  ElementCategory,
  ElementGeometry,
  SemanticElement,
  VerificationRecord,
  VerificationStatus,
} from "../types";
import type { RawDetectedFeature } from "./analysis";
import { GeometryGenerator } from "./geometry-generator";

export interface SemanticExtractionConfig {
  defaultCategory?: ElementCategory;
  defaultAllowedActions?: AllowedAction[];
  forceTentativeStatus?: boolean;
}

export class LandmarkExtractor {
  /**
   * Normalizes a raw name into a clean kebab-case semantic ID.
   */
  static normalizeId(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/[\(\)\[\]\{\}\.,'":;!?]/g, "")
      .replace(/[_\s]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /**
   * Determines appropriate educational allowed actions based on element category and geometry.
   */
  static inferAllowedActions(category: ElementCategory, geometryKind: string): AllowedAction[] {
    const base: AllowedAction[] = ["highlight", "label", "pointer", "annotate"];

    if (geometryKind === "polygon" || geometryKind === "box") {
      base.push("box");
    }

    if (category === "chamber" || category === "organelle" || category === "component" || category === "source" || category === "load" || category === "structure") {
      base.push("circle", "arrow", "pulse");
    } else if (category === "valve" || category === "boundary") {
      base.push("circle", "arrow");
    } else if (category === "force") {
      base.push("arrow", "underline");
    } else if (category === "formula" || category === "equation" || category === "label") {
      base.push("underline");
    }

    // Return unique action array
    return Array.from(new Set(base));
  }

  /**
   * Infers educational category from name and hints.
   */
  static inferCategory(name: string, suggested?: string): ElementCategory {
    if (suggested) {
      const norm = suggested.toLowerCase();
      if (
        [
          "chamber",
          "valve",
          "vessel",
          "septum",
          "organelle",
          "structure",
          "label",
          "formula",
          "component",
          "source",
          "load",
          "force",
          "stage",
          "boundary",
          "organ",
          "equation",
        ].includes(norm)
      ) {
        return norm as ElementCategory;
      }
    }

    const n = name.toLowerCase();
    if (n.includes("atrium") || n.includes("ventricle")) return "chamber";
    if (n.includes("valve")) return "valve";
    if (n.includes("aorta") || n.includes("cava") || n.includes("artery") || n.includes("vein")) return "vessel";
    if (n.includes("nucleus") || n.includes("mitochondria") || n.includes("er") || n.includes("golgi")) return "organelle";
    if (n.includes("membrane") || n.includes("wall")) return "boundary";
    if (n.includes("force") || n.includes("friction") || n.includes("gravity") || n.includes("tension") || n.includes("weight")) return "force";
    if (n.includes("battery") || n.includes("voltage") || n.includes("sun")) return "source";
    if (n.includes("resistor") || n.includes("lamp") || n.includes("bulb") || n.includes("load")) return "load";
    if (n.includes("switch")) return "component";
    if (n.includes("evaporation") || n.includes("condensation") || n.includes("precipitation") || n.includes("collection")) return "stage";
    if (n.includes("=") || n.includes("theta") || n.includes("θ")) return "formula";

    return "structure";
  }

  /**
   * Generates natural language synonyms and aliases for an educational element.
   */
  static generateAliases(name: string, rawId: string, category: ElementCategory): string[] {
    const aliases = new Set<string>();
    const n = name.toLowerCase().trim();
    aliases.add(n);
    aliases.add(rawId);

    // Remove parentheses: "Nucleus (DNA)" -> "nucleus", "dna"
    const stripped = n.replace(/\([^)]+\)/g, "").trim();
    if (stripped && stripped !== n) aliases.add(stripped);

    const insideParen = n.match(/\(([^)]+)\)/);
    if (insideParen && insideParen[1]) {
      aliases.add(insideParen[1].toLowerCase().trim());
    }

    // Subject-specific common synonyms
    if (n.includes("mitochondria")) {
      aliases.add("powerhouse");
      aliases.add("mitochondrion");
      aliases.add("atp");
      aliases.add("cellular respiration");
    } else if (n.includes("nucleus")) {
      aliases.add("genetic material");
      aliases.add("cell brain");
    } else if (n.includes("membrane")) {
      aliases.add("plasma membrane");
      aliases.add("cell boundary");
    } else if (n.includes("sun")) {
      aliases.add("solar radiation");
      aliases.add("energy source");
    } else if (n.includes("evaporation")) {
      aliases.add("vapor");
      aliases.add("water vapor");
      aliases.add("latent heat");
    } else if (n.includes("condensation")) {
      aliases.add("clouds");
      aliases.add("cloud formation");
    } else if (n.includes("precipitation")) {
      aliases.add("rain");
      aliases.add("snow");
    } else if (n.includes("battery")) {
      aliases.add("dc source");
      aliases.add("power supply");
      aliases.add("voltage source");
      aliases.add("emf");
    } else if (n.includes("switch")) {
      aliases.add("key");
      aliases.add("control switch");
      aliases.add("circuit breaker");
    } else if (n.includes("resistor")) {
      aliases.add("resistance");
      aliases.add("ohmic load");
    } else if (n.includes("lamp")) {
      aliases.add("light bulb");
      aliases.add("bulb");
      aliases.add("resistive load");
    } else if (n.includes("normal force")) {
      aliases.add("fn");
      aliases.add("perpendicular force");
      aliases.add("reaction force");
    } else if (n.includes("friction")) {
      aliases.add("fk");
      aliases.add("kinetic friction");
      aliases.add("resistive friction");
    } else if (n.includes("gravity") || n.includes("weight")) {
      aliases.add("fg");
      aliases.add("mg");
      aliases.add("gravitational force");
    }

    return Array.from(aliases);
  }

  /**
   * Transforms a detected feature into a candidate SemanticElement.
   *
   * CRITICAL REQUIREMENT:
   * "The system must distinguish automatically detected geometry from manually verified geometry.
   * Never mark an element verified merely because an AI model generated coordinates or assigned a high confidence score."
   */
  static extractElement(
    feature: RawDetectedFeature,
    naturalWidth: number,
    naturalHeight: number,
    config: SemanticExtractionConfig = {}
  ): SemanticElement {
    const id = this.normalizeId(feature.id || feature.rawName);
    const category = config.defaultCategory || this.inferCategory(feature.rawName, feature.suggestedCategory);
    const aliases = this.generateAliases(feature.rawName, id, category);

    let geometry: ElementGeometry;
    let pins;

    if (feature.polygonPoints && feature.polygonPoints.length >= 3) {
      const polyRes = GeometryGenerator.createPolygonGeometry(feature.polygonPoints, naturalWidth, naturalHeight);
      geometry = polyRes.geometry;
      pins = polyRes.pins;
    } else if (feature.pathD) {
      const pathRes = GeometryGenerator.createPathGeometry(feature.pathD, feature.box, naturalWidth, naturalHeight);
      geometry = pathRes.geometry;
      pins = pathRes.pins;
    } else {
      const boxRes = GeometryGenerator.createBoxGeometry(feature.box, naturalWidth, naturalHeight);
      geometry = boxRes.geometry;
      pins = boxRes.pins;
    }

    const allowedActions = config.defaultAllowedActions || this.inferAllowedActions(category, geometry.kind);

    // Initial status is strictly tentative or unverified. NEVER "verified"!
    const initialStatus: VerificationStatus =
      config.forceTentativeStatus || feature.detectionConfidence >= 0.90 ? "tentative" : "unverified";

    const verificationRecord: VerificationRecord = {
      status: initialStatus,
      detectionSource: "pipeline-analysis",
      notes: `Extracted via ${feature.detectionMethod} with confidence ${feature.detectionConfidence}. Pending human curriculum verification.`,
      checklist: {
        geometryBoundsChecked: feature.uncertaintyFlags.length === 0,
        aliasesChecked: false,
        pedagogicalNotesChecked: false,
        relationshipsChecked: false,
      },
    };

    return {
      id,
      name: feature.rawName,
      category,
      geometry,
      aliases,
      relationships: [],
      confidence: Number(feature.detectionConfidence.toFixed(2)),
      verificationStatus: initialStatus,
      verificationRecord,
      allowedActions,
      anchorPoints: pins,
    };
  }
}
