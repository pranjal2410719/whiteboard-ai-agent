import path from "path";
import type { AssetCanvasMap, SemanticElement } from "../types";
import { AssetIngestion, type IngestionOptions } from "./ingestion";
import { ImageAnalyzer } from "./analysis";
import { LandmarkExtractor, type SemanticExtractionConfig } from "./extraction";
import { RelationshipMapper, type RelationshipDefinition } from "./relationships";
import {
  VerificationWorkflow,
  type ManualVerificationInput,
  type VerificationAuditReport,
} from "./verification";
import { AssetMapValidator, type AssetMapValidationResult } from "./asset-map-validator";
import { PreviewGenerator } from "./preview-generator";

export * from "./ingestion";
export * from "./analysis";
export * from "./extraction";
export * from "./geometry-generator";
export * from "./relationships";
export * from "./verification";
export * from "./asset-map-validator";
export * from "./preview-generator";

export interface PipelineExecutionOptions {
  ingestion?: IngestionOptions;
  extraction?: SemanticExtractionConfig;
  relationships?: RelationshipDefinition[];
  verifications?: ManualVerificationInput[];
  hints?: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    category?: string;
    note?: string;
  }>;
  generatePreview?: boolean;
  previewOutputDir?: string;
}

export interface PipelineResult {
  assetMap: AssetCanvasMap;
  validation: AssetMapValidationResult;
  audit: VerificationAuditReport;
  previewFiles?: string[];
  success: boolean;
}

/**
 * Reusable Asset Preparation Pipeline Orchestrator.
 */
export class AssetPreparationPipeline {
  /**
   * Executes the full 10-step preparation workflow on an image/vector asset.
   */
  static prepareAsset(filePath: string, options: PipelineExecutionOptions = {}): PipelineResult {
    // 1. Ingestion: Load and inspect original image
    const pkg = AssetIngestion.ingestFromFile(filePath, options.ingestion);

    // 2. Image Analysis: Identify meaningful educational components
    const detectedFeatures = ImageAnalyzer.analyze(pkg, options.hints);

    // 3. Extraction: Generate semantic IDs, names, geometry, categories, aliases
    const elements: SemanticElement[] = detectedFeatures.map(feat =>
      LandmarkExtractor.extractElement(feat, pkg.naturalWidth, pkg.naturalHeight, options.extraction)
    );

    // 4. Relationships: Map educational relationships
    if (options.relationships && options.relationships.length > 0) {
      for (const rel of options.relationships) {
        RelationshipMapper.addRelationship(elements, rel);
      }
    }

    // 5. Verification: Apply manual curriculum verifications if provided
    let verificationWarnings: string[] = [];
    if (options.verifications && options.verifications.length > 0) {
      const vResult = VerificationWorkflow.batchVerify(elements, options.verifications);
      if (vResult.errors.length > 0) {
        verificationWarnings = vResult.errors;
      }
    }

    // 6. Assemble AssetCanvasMap
    const assetMap: AssetCanvasMap = {
      assetId: pkg.assetId,
      title: pkg.title,
      subject: pkg.subject,
      source: pkg.source,
      naturalWidth: pkg.naturalWidth,
      naturalHeight: pkg.naturalHeight,
      elements,
      metadata: {
        format: pkg.format,
        fileSizeBytes: pkg.fileSizeBytes,
        aspectRatio: pkg.aspectRatio,
        ...pkg.metadata,
      },
    };

    // 7. Validate structured asset map against original image and schema
    const validation = AssetMapValidator.validate(assetMap);
    if (verificationWarnings.length > 0) {
      validation.warnings.push(...verificationWarnings);
    }

    // 8. Audit verification status
    const audit = VerificationWorkflow.auditAsset(assetMap);

    // 9. Generate visual previews if requested
    let previewFiles: string[] | undefined;
    if (options.generatePreview) {
      const outDir = options.previewOutputDir || path.join(process.cwd(), "public", "previews");
      previewFiles = PreviewGenerator.savePreviews([assetMap], outDir);
    }

    return {
      assetMap,
      validation,
      audit,
      previewFiles,
      success: validation.valid,
    };
  }
}
