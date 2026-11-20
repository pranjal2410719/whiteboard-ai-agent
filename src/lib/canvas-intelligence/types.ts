import type { BoardMark, Point } from "../types";

export type GeometryKind = "box" | "polygon" | "path" | "text";

export type BoundingBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ElementGeometry =
  | { kind: "box"; box: BoundingBox }
  | { kind: "polygon"; points: [number, number][]; bounds: BoundingBox }
  | { kind: "path"; d: string; bounds: BoundingBox }
  | { kind: "text"; text: string; box: BoundingBox; baseline: number };

export type RelationshipType =
  | "connected_to"
  | "flows_to"
  | "valved_by"
  | "branches_into"
  | "separated_by"
  | "guards"
  | "surrounds"
  | "opposes"
  | "exerts"
  | "powers"
  | "transforms_to"
  | "contains"
  | "cycles_to";

export type SemanticRelationship = {
  type: RelationshipType;
  targetId: string;
  label?: string;
  notes?: string;
  directional?: boolean;
};

export type AllowedAction =
  | "highlight"
  | "circle"
  | "box"
  | "arrow"
  | "pointer"
  | "label"
  | "underline"
  | "annotate"
  | "pulse";

export type VerificationStatus = "verified" | "tentative" | "unverified";

export type VerificationChecklist = {
  geometryBoundsChecked: boolean;
  aliasesChecked: boolean;
  pedagogicalNotesChecked: boolean;
  relationshipsChecked: boolean;
};

export type VerificationRecord = {
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  checklist?: VerificationChecklist;
  notes?: string;
  detectionSource?: "pipeline-analysis" | "human-expert" | "curriculum-manifest";
};

export type ElementCategory =
  | "chamber"
  | "valve"
  | "vessel"
  | "septum"
  | "organelle"
  | "structure"
  | "label"
  | "formula"
  | "component"
  | "source"
  | "load"
  | "force"
  | "stage"
  | "boundary"
  | "organ"
  | "equation";

export type SemanticElement = {
  id: string;
  name: string;
  category: ElementCategory;
  scientificName?: string;
  geometry: ElementGeometry;
  aliases: string[];
  relationships: SemanticRelationship[];
  labelsInAsset?: { text: string; x: number; y: number }[];
  confidence: number; // 0.00 to 1.00
  verificationStatus: VerificationStatus;
  verificationRecord?: VerificationRecord;
  allowedActions: AllowedAction[];
  pedagogicalNote?: string;
  anchorPoints?: {
    center: Point;
    top: Point;
    bottom: Point;
    left: Point;
    right: Point;
  };
};

export type AssetCanvasMap = {
  assetId: string;
  title: string;
  subject: string;
  source: string;
  naturalWidth: number;
  naturalHeight: number;
  elements: SemanticElement[];
  metadata?: Record<string, unknown>;
};

export type DisplayedAssetInfo = {
  assetId: string;
  source: string;
  x: number;
  y: number;
  w: number;
  h: number;
  scaleX: number;
  scaleY: number;
};

export type ActiveAnnotation = {
  actionId: string;
  elementId: string;
  action: AllowedAction;
  color: string;
  createdAt: number;
  markIds: number[];
  marks?: BoardMark[];
  fromElementId?: string;
  text?: string;
  label?: string;
  style?: "fill" | "halo" | "box" | "outline";
};

export type CIESafetyPolicy = {
  allowUnverified: boolean;
  allowTentative: boolean;
  minConfidence: number;
};

export type LiveCanvasState = {
  activeAssetId: string | null;
  displayedAssets: DisplayedAssetInfo[];
  activeHighlights: string[]; // element IDs currently highlighted
  activeAnnotations: ActiveAnnotation[];
  totalMarksCount: number;
  lastActionTimestamp: number;
  safetyPolicy?: CIESafetyPolicy;
};

export type ActionRequest = {
  action: AllowedAction;
  targetElementId: string;
  fromElementId?: string; // For arrows
  color?: string;
  label?: string;
  style?: "fill" | "halo" | "box" | "outline";
  text?: string;
  safetyPolicy?: Partial<CIESafetyPolicy>;
  bypassSafetyPolicy?: boolean;
};

export type ValidationResult = {
  valid: boolean;
  reason?: string;
  element?: SemanticElement;
  sourceElement?: SemanticElement; // For arrows
  transformedBounds?: BoundingBox;
};

export type ExecutionConfirmation = {
  actionId: string;
  success: boolean;
  action: AllowedAction;
  targetElementId: string;
  marks: BoardMark[];
  canvasState: LiveCanvasState;
  message?: string;
};

export type RendererExecutionConfirmation = ExecutionConfirmation & {
  renderedInDOM: boolean;
  domElementCount: number;
  domBBox?: { x: number; y: number; width: number; height: number };
  renderedLayer: "teacher-annotations";
  verifiedAt: number;
};
