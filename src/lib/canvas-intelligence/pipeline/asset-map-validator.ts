import type { AssetCanvasMap, BoundingBox } from "../types";
import { VerificationWorkflow } from "./verification";

export interface AssetMapValidationSummary {
  assetId: string;
  title: string;
  naturalDimensions: string;
  totalElements: number;
  verifiedElements: number;
  tentativeElements: number;
  unverifiedElements: number;
  totalRelationships: number;
  directionalRelationships: number;
  averageConfidence: number;
  isValid: boolean;
}

export interface AssetMapValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: AssetMapValidationSummary;
}

export class AssetMapValidator {
  /**
   * Validates a complete AssetCanvasMap package before registration with CIE.
   */
  static validate(assetMap: AssetCanvasMap): AssetMapValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Root structure checks
    if (!assetMap.assetId || typeof assetMap.assetId !== "string" || !assetMap.assetId.trim()) {
      errors.push("assetId is required and must be a non-empty string.");
    }
    if (!assetMap.title || typeof assetMap.title !== "string" || !assetMap.title.trim()) {
      errors.push("title is required and must be a non-empty string.");
    }
    if (!assetMap.subject || typeof assetMap.subject !== "string" || !assetMap.subject.trim()) {
      errors.push("subject is required and must be a non-empty string.");
    }
    if (!assetMap.source || typeof assetMap.source !== "string" || !assetMap.source.trim()) {
      errors.push("source is required and must be a non-empty string.");
    }

    if (!assetMap.naturalWidth || assetMap.naturalWidth <= 0 || !Number.isFinite(assetMap.naturalWidth)) {
      errors.push(`naturalWidth must be a positive finite number, got ${assetMap.naturalWidth}.`);
    }
    if (!assetMap.naturalHeight || assetMap.naturalHeight <= 0 || !Number.isFinite(assetMap.naturalHeight)) {
      errors.push(`naturalHeight must be a positive finite number, got ${assetMap.naturalHeight}.`);
    }

    if (!Array.isArray(assetMap.elements) || assetMap.elements.length === 0) {
      errors.push("assetMap must contain an elements array with at least one element.");
      return {
        valid: false,
        errors,
        warnings,
        summary: {
          assetId: assetMap.assetId || "unknown",
          title: assetMap.title || "unknown",
          naturalDimensions: `${assetMap.naturalWidth}x${assetMap.naturalHeight}`,
          totalElements: 0,
          verifiedElements: 0,
          tentativeElements: 0,
          unverifiedElements: 0,
          totalRelationships: 0,
          directionalRelationships: 0,
          averageConfidence: 0,
          isValid: false,
        },
      };
    }

    const { naturalWidth, naturalHeight } = assetMap;
    const elementIdSet = new Set<string>();
    let totalRelationships = 0;
    let directionalRelationships = 0;

    // 2. Element checks
    for (let i = 0; i < assetMap.elements.length; i++) {
      const el = assetMap.elements[i];
      const prefix = `Element[${i}] ('${el.id || "unnamed"}')`;

      if (!el.id || typeof el.id !== "string" || !el.id.trim()) {
        errors.push(`${prefix}: id is required.`);
      } else {
        const normId = el.id.trim().toLowerCase();
        if (elementIdSet.has(normId)) {
          errors.push(`${prefix}: duplicate element ID '${el.id}'. All element IDs must be unique.`);
        }
        elementIdSet.add(normId);

        if (/\s/.test(el.id)) {
          warnings.push(`${prefix}: id contains whitespace; kebab-case is recommended.`);
        }
      }

      if (!el.name || typeof el.name !== "string" || !el.name.trim()) {
        errors.push(`${prefix}: name is required.`);
      }

      if (!el.category) {
        errors.push(`${prefix}: category is required.`);
      }

      if (!Array.isArray(el.aliases) || el.aliases.length === 0) {
        warnings.push(`${prefix}: aliases array is empty. Natural language resolution will only match the exact ID.`);
      }

      if (!Array.isArray(el.allowedActions) || el.allowedActions.length === 0) {
        errors.push(`${prefix}: allowedActions must be a non-empty array.`);
      }

      if (typeof el.confidence !== "number" || el.confidence < 0 || el.confidence > 1) {
        errors.push(`${prefix}: confidence must be a number between 0.00 and 1.00, got ${el.confidence}.`);
      }

      if (!["verified", "tentative", "unverified"].includes(el.verificationStatus)) {
        errors.push(`${prefix}: verificationStatus must be 'verified', 'tentative', or 'unverified'.`);
      }

      // 3. Geometry bounds validation
      if (!el.geometry) {
        errors.push(`${prefix}: geometry object is missing.`);
      } else {
        let bounds: BoundingBox | undefined;

        if (el.geometry.kind === "box") {
          bounds = el.geometry.box;
        } else if (el.geometry.kind === "polygon") {
          bounds = el.geometry.bounds;
          if (!Array.isArray(el.geometry.points) || el.geometry.points.length < 3) {
            errors.push(`${prefix}: polygon must have at least 3 points.`);
          } else {
            // Check points bounds
            for (let pIdx = 0; pIdx < el.geometry.points.length; pIdx++) {
              const [px, py] = el.geometry.points[pIdx];
              if (px < 0 || px > naturalWidth || py < 0 || py > naturalHeight) {
                errors.push(
                  `${prefix}: polygon point #${pIdx} [${px}, ${py}] is outside natural dimensions [0, 0, ${naturalWidth}, ${naturalHeight}].`
                );
              }
            }
          }
        } else if (el.geometry.kind === "path") {
          bounds = el.geometry.bounds;
          if (!el.geometry.d || !el.geometry.d.trim()) {
            errors.push(`${prefix}: path geometry d string is empty.`);
          }
        } else if (el.geometry.kind === "text") {
          bounds = el.geometry.box;
        }

        if (bounds) {
          if (bounds.x < 0 || bounds.y < 0) {
            errors.push(
              `${prefix}: geometry bounds negative offset [x: ${bounds.x}, y: ${bounds.y}]. Must be >= 0.`
            );
          }
          if (bounds.w <= 0 || bounds.h <= 0) {
            errors.push(
              `${prefix}: geometry bounds non-positive dimension [w: ${bounds.w}, h: ${bounds.h}].`
            );
          }
          if (bounds.x + bounds.w > naturalWidth) {
            errors.push(
              `${prefix}: geometry bounds horizontal overflow: x (${bounds.x}) + w (${bounds.w}) = ${bounds.x + bounds.w} > naturalWidth (${naturalWidth}).`
            );
          }
          if (bounds.y + bounds.h > naturalHeight) {
            errors.push(
              `${prefix}: geometry bounds vertical overflow: y (${bounds.y}) + h (${bounds.h}) = ${bounds.y + bounds.h} > naturalHeight (${naturalHeight}).`
            );
          }
        }
      }

      // Count relationships
      if (Array.isArray(el.relationships)) {
        totalRelationships += el.relationships.length;
        directionalRelationships += el.relationships.filter(r => r.directional).length;
      }
    }

    // 4. Referential integrity of relationships
    for (const el of assetMap.elements) {
      if (Array.isArray(el.relationships)) {
        for (const rel of el.relationships) {
          if (!elementIdSet.has(rel.targetId.toLowerCase())) {
            errors.push(
              `Relationship referential integrity error: Element '${el.id}' references non-existent targetId '${rel.targetId}'.`
            );
          }
          if (rel.targetId.toLowerCase() === el.id.toLowerCase()) {
            errors.push(
              `Relationship self-reference error: Element '${el.id}' cannot have self-referential relationship '${rel.type}'.`
            );
          }
        }
      }
    }

    const audit = VerificationWorkflow.auditAsset(assetMap);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        assetId: assetMap.assetId,
        title: assetMap.title,
        naturalDimensions: `${naturalWidth}x${naturalHeight}`,
        totalElements: assetMap.elements.length,
        verifiedElements: audit.verifiedCount,
        tentativeElements: audit.tentativeCount,
        unverifiedElements: audit.unverifiedCount,
        totalRelationships,
        directionalRelationships,
        averageConfidence: audit.averageConfidence,
        isValid: errors.length === 0,
      },
    };
  }
}
