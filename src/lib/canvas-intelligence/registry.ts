import type { AssetCanvasMap } from "./types";
import { CanvasIntelligenceEngine } from "./engine";
import { humanHeartAssetMap } from "./heart-asset-map";
import { humanCellAssetMap, humanCellDiagramPngAssetMap } from "./prepared-assets/cell-asset-map";
import { waterCycleAssetMap } from "./prepared-assets/water-cycle-asset-map";
import { electricCircuitAssetMap } from "./prepared-assets/electric-circuit-asset-map";
import { inclinedPlaneAssetMap } from "./prepared-assets/inclined-plane-asset-map";
import { AssetMapValidator, type AssetMapValidationResult } from "./pipeline/asset-map-validator";
import { VerificationWorkflow, type VerificationAuditReport } from "./pipeline/verification";

export interface RegisteredAssetSummary {
  assetId: string;
  title: string;
  subject: string;
  source: string;
  naturalWidth: number;
  naturalHeight: number;
  elementsCount: number;
  verifiedCount: number;
  tentativeCount: number;
  unverifiedCount: number;
  isTeachingReady: boolean;
}

export class CanvasAssetRegistry {
  private static assets = new Map<string, AssetCanvasMap>();
  private static aliases = new Map<string, string>(); // alias -> assetId
  private static initialized = false;

  private static initDefaults(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Register all benchmark assets
    this.registerAssetDirect(humanHeartAssetMap);
    this.registerAssetDirect(humanCellAssetMap);
    this.registerAssetDirect(waterCycleAssetMap);
    this.registerAssetDirect(electricCircuitAssetMap);
    this.registerAssetDirect(inclinedPlaneAssetMap);

    // Register common aliases
    this.aliases.set("heart", "heart-diagram");
    this.aliases.set("human-heart", "heart-diagram");
    this.aliases.set("cell", "human-cell");
    this.aliases.set("human_cell", "human-cell");
    this.aliases.set("human-cell-diagram", "human-cell");
    this.aliases.set("human_cell_diagram", "human-cell");
    this.aliases.set("/assets/human_cell_diagram.png", "human-cell");
    this.aliases.set("water", "water-cycle");
    this.aliases.set("circuit", "electric-circuit");
    this.aliases.set("circuit-diagram", "electric-circuit");
    this.aliases.set("inclined", "inclined-plane");
    this.aliases.set("plane", "inclined-plane");
  }

  private static registerAssetDirect(assetMap: AssetCanvasMap): void {
    this.assets.set(assetMap.assetId.toLowerCase(), assetMap);
    this.indexAssetSource(assetMap);
  }

  private static indexAssetSource(assetMap: AssetCanvasMap): void {
    const normId = assetMap.assetId.toLowerCase();
    const src = assetMap.source.toLowerCase();
    this.aliases.set(src, normId);

    const baseName = src.split("/").pop() || "";
    if (baseName) {
      this.aliases.set(baseName, normId);
      const bare = baseName.replace(/\.[a-z0-9]+$/i, "");
      this.aliases.set(bare, normId);
    }
  }

  /**
   * Registers a newly prepared AssetCanvasMap after validating its schema and geometry.
   */
  static registerAsset(
    assetMap: AssetCanvasMap,
    options: { replace?: boolean } = {}
  ): { success: boolean; validation: AssetMapValidationResult; message?: string } {
    this.initDefaults();

    // 1. Validate the asset map package
    const validation = AssetMapValidator.validate(assetMap);
    if (!validation.valid) {
      return {
        success: false,
        validation,
        message: `Asset registration failed validation with ${validation.errors.length} errors.`,
      };
    }

    const normId = assetMap.assetId.toLowerCase();
    if (this.assets.has(normId) && !options.replace) {
      return {
        success: false,
        validation,
        message: `Asset with ID '${assetMap.assetId}' is already registered. Pass { replace: true } to overwrite.`,
      };
    }

    this.assets.set(normId, assetMap);
    this.indexAssetSource(assetMap);

    return {
      success: true,
      validation,
      message: `Asset '${assetMap.title}' (${assetMap.assetId}) successfully registered with ${assetMap.elements.length} elements.`,
    };
  }

  /**
   * Retrieves a registered AssetCanvasMap by ID, alias, filename, or source URL.
   */
  static getAsset(idOrAlias: string): AssetCanvasMap | undefined {
    this.initDefaults();
    if (!idOrAlias) return undefined;
    const norm = idOrAlias.trim().toLowerCase();

    // Authentic Human Cell Diagram PNG specializer
    if (/human_cell_diagram/i.test(norm)) {
      return humanCellDiagramPngAssetMap;
    }

    // Direct ID match
    if (this.assets.has(norm)) {
      return this.assets.get(norm);
    }

    // Alias / filename / source match
    const mappedId = this.aliases.get(norm);
    if (mappedId && this.assets.has(mappedId)) {
      return this.assets.get(mappedId);
    }

    // Fuzzy slug match
    const slug = norm.replace(/[_\s]+/g, "-");
    if (this.assets.has(slug)) {
      return this.assets.get(slug);
    }

    // Search by title or partial source
    for (const [id, asset] of this.assets.entries()) {
      if (
        asset.title.toLowerCase() === norm ||
        asset.source.toLowerCase().includes(norm) ||
        id.includes(slug)
      ) {
        return asset;
      }
    }

    return undefined;
  }

  /**
   * Finds an asset by its source image URL or filename.
   */
  static findAssetBySource(sourceUrl: string): AssetCanvasMap | undefined {
    return this.getAsset(sourceUrl);
  }

  /**
   * Lists all registered assets with their verification audit summaries.
   */
  static listRegisteredAssets(): RegisteredAssetSummary[] {
    this.initDefaults();
    const list: RegisteredAssetSummary[] = [];

    for (const asset of this.assets.values()) {
      const audit = VerificationWorkflow.auditAsset(asset);
      list.push({
        assetId: asset.assetId,
        title: asset.title,
        subject: asset.subject,
        source: asset.source,
        naturalWidth: asset.naturalWidth,
        naturalHeight: asset.naturalHeight,
        elementsCount: asset.elements.length,
        verifiedCount: audit.verifiedCount,
        tentativeCount: audit.tentativeCount,
        unverifiedCount: audit.unverifiedCount,
        isTeachingReady: audit.isTeachingReady,
      });
    }

    return list;
  }

  /**
   * Creates a CanvasIntelligenceEngine instance for any registered asset.
   */
  static createEngine(
    assetIdOrAlias: string,
    placement: { x: number; y: number; w: number; h: number } = { x: 515, y: 30, w: 430, h: 270 }
  ): CanvasIntelligenceEngine {
    const asset = this.getAsset(assetIdOrAlias);
    if (!asset) {
      throw new Error(`Asset '${assetIdOrAlias}' is not registered in CanvasAssetRegistry.`);
    }
    return new CanvasIntelligenceEngine(asset, placement);
  }

  /**
   * Resets the registry (useful in test environments).
   */
  static reset(): void {
    this.assets.clear();
    this.aliases.clear();
    this.initialized = false;
    this.initDefaults();
  }
}
