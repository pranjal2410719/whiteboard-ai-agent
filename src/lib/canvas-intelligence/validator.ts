import type { ActionRequest, AssetCanvasMap, CIESafetyPolicy, DisplayedAssetInfo, LiveCanvasState, ValidationResult } from "./types";
import { transformGeometry } from "./geometry";

export const DEFAULT_CIE_SAFETY_POLICY: CIESafetyPolicy = {
  allowUnverified: false,
  allowTentative: true,
  minConfidence: 0.5,
};

export function matchElementQuery(el: any, query: string): boolean {
  const norm = query.trim().toLowerCase();
  const normSlug = norm.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const idLower = el.id.toLowerCase();
  const idSlug = idLower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const nameLower = el.name.toLowerCase();
  const nameSlug = nameLower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    idLower === norm ||
    idSlug === normSlug ||
    nameLower === norm ||
    nameSlug === normSlug ||
    (Boolean(el.scientificName) && el.scientificName!.toLowerCase() === norm) ||
    (Array.isArray(el.aliases) && el.aliases.some((a: string) => {
      const aLower = a.toLowerCase();
      return aLower === norm || aLower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === normSlug;
    }))
  );
}

export class ActionValidator {
  /**
   * Validates a teacher action request against the active asset map and current canvas state.
   */
  static validate(
    request: ActionRequest,
    assetMap: AssetCanvasMap | null,
    displayedAsset: DisplayedAssetInfo | null,
    currentState: LiveCanvasState,
    engineSafetyPolicy?: CIESafetyPolicy
  ): ValidationResult {
    if (!assetMap || !displayedAsset) {
      return {
        valid: false,
        reason: "No visual diagram asset is currently active on the whiteboard canvas.",
      };
    }

    const matchingElements = assetMap.elements.filter(el => matchElementQuery(el, request.targetElementId));

    if (matchingElements.length === 0) {
      return {
        valid: false,
        reason: `Element ID '${request.targetElementId}' does not exist in asset '${assetMap.assetId}'.`,
      };
    }

    // Ambiguity safety check
    if (matchingElements.length > 1) {
      return {
        valid: false,
        reason: `Target element ID/alias '${request.targetElementId}' is ambiguous; it matches ${matchingElements.length} elements: ${matchingElements.map(e => e.name).join(", ")}. Specify a unique element ID.`,
      };
    }

    const element = matchingElements[0];

    // Safety policy validation
    const effectivePolicy: CIESafetyPolicy = {
      ...DEFAULT_CIE_SAFETY_POLICY,
      ...currentState.safetyPolicy,
      ...engineSafetyPolicy,
      ...request.safetyPolicy,
    };

    if (!request.bypassSafetyPolicy) {
      if (element.verificationStatus === "unverified" && !effectivePolicy.allowUnverified) {
        return {
          valid: false,
          element,
          reason: `Safety policy violation: Element '${element.name}' (${element.id}) is unverified. Verified human review is required before executing classroom teaching actions.`,
        };
      }
      if (element.verificationStatus === "tentative" && !effectivePolicy.allowTentative) {
        return {
          valid: false,
          element,
          reason: `Safety policy violation: Element '${element.name}' (${element.id}) is tentative. Current safety policy disallows tentative targets.`,
        };
      }
      if (element.confidence < effectivePolicy.minConfidence) {
        return {
          valid: false,
          element,
          reason: `Safety policy violation: Element '${element.name}' confidence score (${element.confidence}) is below the required minimum threshold (${effectivePolicy.minConfidence}).`,
        };
      }
    }

    // Check if the requested action is allowed on this element
    if (!element.allowedActions.includes(request.action)) {
      return {
        valid: false,
        element,
        reason: `Action '${request.action}' is not permitted on element '${element.name}' (allowed: ${element.allowedActions.join(", ")}).`,
      };
    }

    // For arrows, check the source element
    let sourceElement;
    if (request.action === "arrow") {
      if (!request.fromElementId) {
        return {
          valid: false,
          element,
          reason: "Arrow action requires a 'fromElementId' source element.",
        };
      }
      const matchingSources = assetMap.elements.filter(el => matchElementQuery(el, request.fromElementId!));
      if (matchingSources.length === 0) {
        return {
          valid: false,
          element,
          reason: `Source element ID '${request.fromElementId}' for arrow does not exist.`,
        };
      }
      if (matchingSources.length > 1) {
        return {
          valid: false,
          element,
          reason: `Source element ID/alias '${request.fromElementId}' for arrow is ambiguous.`,
        };
      }
      sourceElement = matchingSources[0];

      if (sourceElement.id === element.id) {
        return {
          valid: false,
          element,
          sourceElement,
          reason: "Arrow source and target cannot be the same element.",
        };
      }

      if (!request.bypassSafetyPolicy) {
        if (sourceElement.verificationStatus === "unverified" && !effectivePolicy.allowUnverified) {
          return {
            valid: false,
            element,
            sourceElement,
            reason: `Safety policy violation: Source element '${sourceElement.name}' (${sourceElement.id}) for arrow is unverified.`,
          };
        }
      }
    }

    // Check for duplicate active highlights
    if (request.action === "highlight" || request.action === "circle" || request.action === "box") {
      const isAlreadyActive = currentState.activeAnnotations.some(
        a => a.elementId === element.id && a.action === request.action
      );
      if (isAlreadyActive) {
        return {
          valid: false,
          element,
          reason: `Element '${element.name}' already has an active '${request.action}' on the canvas.`,
        };
      }
    }

    // Calculate transformed bounds on canvas
    const { bounds } = transformGeometry(element.geometry, displayedAsset);

    // Bounds safety check: must be inside whiteboard boundary (0..1000 x, 0..330 y)
    if (bounds.x < 0 || bounds.x + bounds.w > 1000 || bounds.y < 0 || bounds.y + bounds.h > 330) {
      return {
        valid: false,
        element,
        transformedBounds: bounds,
        reason: `Element '${element.name}' extends outside the whiteboard canvas bounds [${bounds.x}, ${bounds.y}, ${bounds.w}, ${bounds.h}].`,
      };
    }

    return {
      valid: true,
      element,
      sourceElement,
      transformedBounds: bounds,
    };
  }
}
