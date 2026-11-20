import type {
  AssetCanvasMap,
  SemanticElement,
  VerificationChecklist,
  VerificationRecord,
  VerificationStatus,
} from "../types";

export interface ReviewerSignature {
  reviewerId: string;
  reviewerName: string;
  role: "curriculum-expert" | "science-lead" | "educator" | "qa-reviewer";
  verifiedAt?: string;
}

export interface ManualVerificationInput {
  elementId: string;
  reviewer: ReviewerSignature;
  checklist?: Partial<VerificationChecklist>;
  notes?: string;
  pedagogicalNote?: string;
  refinedConfidence?: number;
}

export interface VerificationAuditReport {
  assetId: string;
  totalElements: number;
  verifiedCount: number;
  tentativeCount: number;
  unverifiedCount: number;
  flaggedUncertainCount: number;
  averageConfidence: number;
  unverifiedElementIds: string[];
  uncertainLandmarks: Array<{ id: string; name: string; reason: string }>;
  verifiedElements: Array<{ id: string; name: string; verifiedBy: string; verifiedAt: string }>;
  isTeachingReady: boolean;
}

export class VerificationWorkflow {
  /**
   * Explicitly marks an element verified following human curriculum specialist review.
   *
   * RULE:
   * Never mark an element verified merely because an AI model generated coordinates or assigned a high confidence score.
   */
  static verifyElement(
    element: SemanticElement,
    reviewer: ReviewerSignature,
    checklist: Partial<VerificationChecklist> = {},
    notes?: string
  ): void {
    if (!reviewer || !reviewer.reviewerId || !reviewer.role) {
      throw new Error(
        `Cannot verify element '${element.id}' without an authenticated human reviewer signature.`
      );
    }

    const verifiedAt = reviewer.verifiedAt || new Date().toISOString();
    const completeChecklist: VerificationChecklist = {
      geometryBoundsChecked: checklist.geometryBoundsChecked ?? true,
      aliasesChecked: checklist.aliasesChecked ?? true,
      pedagogicalNotesChecked: checklist.pedagogicalNotesChecked ?? true,
      relationshipsChecked: checklist.relationshipsChecked ?? true,
    };

    const record: VerificationRecord = {
      status: "verified",
      verifiedBy: `${reviewer.reviewerName} (${reviewer.role} #${reviewer.reviewerId})`,
      verifiedAt,
      checklist: completeChecklist,
      notes: notes || `Manually verified and confirmed by ${reviewer.reviewerName}.`,
      detectionSource: "human-expert",
    };

    element.verificationStatus = "verified";
    element.verificationRecord = record;
    // Manual verification establishes verified ground-truth confidence (min 0.95)
    element.confidence = Math.max(element.confidence, 0.96);
  }

  /**
   * Flags an uncertain landmark for human curriculum verification.
   */
  static flagUncertainLandmark(
    element: SemanticElement,
    reason: string
  ): void {
    element.verificationStatus = "unverified";
    element.confidence = Math.min(element.confidence, 0.65);
    element.verificationRecord = {
      status: "unverified",
      notes: `FLAGGED FOR HUMAN VERIFICATION: ${reason}`,
      checklist: {
        geometryBoundsChecked: false,
        aliasesChecked: false,
        pedagogicalNotesChecked: false,
        relationshipsChecked: false,
      },
      detectionSource: "pipeline-analysis",
    };
  }

  /**
   * Applies a batch of human verification records to an element collection.
   */
  static batchVerify(
    elements: SemanticElement[],
    verifications: ManualVerificationInput[]
  ): { verifiedCount: number; errors: string[] } {
    let verifiedCount = 0;
    const errors: string[] = [];

    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    for (const v of verifications) {
      const targetNorm = v.elementId.trim().toLowerCase();
      const strippedNumber = targetNorm.replace(/^[0-9]+[-_ ]*/, "");
      const targetSlug = slug(strippedNumber || targetNorm);

      const el = elements.find(e => {
        const eIdSlug = slug(e.id);
        const eNameSlug = slug(e.name);
        return (
          e.id.toLowerCase() === targetNorm ||
          eIdSlug === targetSlug ||
          eNameSlug === targetSlug ||
          e.aliases.some(a => slug(a) === targetSlug)
        );
      });

      if (!el) {
        errors.push(`Element '${v.elementId}' not found for verification.`);
        continue;
      }
      try {
        this.verifyElement(el, v.reviewer, v.checklist, v.notes);
        if (v.pedagogicalNote) {
          el.pedagogicalNote = v.pedagogicalNote;
        }
        if (v.refinedConfidence !== undefined) {
          el.confidence = v.refinedConfidence;
        }
        verifiedCount++;
      } catch (err: any) {
        errors.push(`Error verifying '${v.elementId}': ${err.message}`);
      }
    }

    return { verifiedCount, errors };
  }

  /**
   * Generates a comprehensive verification audit report for an asset map.
   */
  static auditAsset(assetMap: AssetCanvasMap): VerificationAuditReport {
    let verifiedCount = 0;
    let tentativeCount = 0;
    let unverifiedCount = 0;
    let flaggedUncertainCount = 0;
    let totalConfidence = 0;

    const unverifiedElementIds: string[] = [];
    const uncertainLandmarks: Array<{ id: string; name: string; reason: string }> = [];
    const verifiedElements: Array<{ id: string; name: string; verifiedBy: string; verifiedAt: string }> = [];

    for (const el of assetMap.elements) {
      totalConfidence += el.confidence;

      if (el.verificationStatus === "verified") {
        verifiedCount++;
        verifiedElements.push({
          id: el.id,
          name: el.name,
          verifiedBy: el.verificationRecord?.verifiedBy || "Human Reviewer",
          verifiedAt: el.verificationRecord?.verifiedAt || "Recorded",
        });
      } else if (el.verificationStatus === "tentative") {
        tentativeCount++;
      } else {
        unverifiedCount++;
        unverifiedElementIds.push(el.id);
      }

      if (
        el.verificationRecord?.notes?.includes("FLAGGED") ||
        el.verificationStatus === "unverified" ||
        el.confidence < 0.70
      ) {
        flaggedUncertainCount++;
        uncertainLandmarks.push({
          id: el.id,
          name: el.name,
          reason: el.verificationRecord?.notes || "Unverified geometry / low confidence score",
        });
      }
    }

    const totalElements = assetMap.elements.length;
    const averageConfidence = totalElements > 0 ? Number((totalConfidence / totalElements).toFixed(3)) : 0;

    return {
      assetId: assetMap.assetId,
      totalElements,
      verifiedCount,
      tentativeCount,
      unverifiedCount,
      flaggedUncertainCount,
      averageConfidence,
      unverifiedElementIds,
      uncertainLandmarks,
      verifiedElements,
      // Asset is ready for live classroom teaching if it has verified elements and 0 unverified elements
      isTeachingReady: totalElements > 0 && unverifiedCount === 0 && verifiedCount > 0,
    };
  }
}
