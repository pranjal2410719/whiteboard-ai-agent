import type { BoardMark } from "../types";

/**
 * Supported whiteboard annotation actions.
 * Constrained set of drawing and highlighting tools.
 */
export type AnnotationAction =
  | "circle"
  | "underline"
  | "arrow"
  | "highlight"
  | "pointer"
  | "freehand";

/**
 * Bounding box in normalized coordinates [0, 1].
 * Top-left is (xmin, ymin), bottom-right is (xmax, ymax).
 */
export interface NormalizedBoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

/**
 * 2D bounding box in canvas coordinate space (pixels).
 */
export interface CanvasBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type VisualCategory =
  | "organ"
  | "organelle"
  | "component"
  | "label"
  | "formula"
  | "arrow"
  | "structure"
  | "calculation"
  | "unknown";

/**
 * Semantic object detected within an image or diagram.
 */
export interface VisualObject {
  id: string;
  label: string;
  category: VisualCategory;
  boundingBox: NormalizedBoundingBox;
  confidence: number;
  ocrText?: string;
  aliases?: string[];
  relationships?: Array<{
    targetId: string;
    relation: "connects_to" | "flows_to" | "part_of" | "adjacent_to" | "labels";
  }>;
}

export interface TextRegion {
  text: string;
  boundingBox: NormalizedBoundingBox;
  confidence: number;
}

export interface SpatialRelationship {
  sourceId: string;
  targetId: string;
  relation: string;
}

/**
 * Visual Scene Graph representing the full spatial composition of an image.
 */
export interface VisualScene {
  imageId: string;
  imageHash: string;
  source: "uploaded" | "board" | "camera" | "prepared-asset";
  dimensions: {
    naturalWidth: number;
    naturalHeight: number;
    aspectRatio: number;
  };
  objects: VisualObject[];
  textRegions: TextRegion[];
  relationships: SpatialRelationship[];
  detectedAt: string;
}

/**
 * Structured annotation instruction executable by the Whiteboard Action Engine.
 */
export interface WhiteboardAnnotation {
  id: string;
  action: AnnotationAction;
  target: string;
  coordinateSpace: "canvas" | "normalized" | "image";
  points: Array<{ x: number; y: number }>;
  shape?: {
    type: "ellipse" | "rect" | "arrow" | "path";
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    radiusX?: number;
    radiusY?: number;
    color?: string;
    strokeWidth?: number;
    fill?: string;
    dashed?: boolean;
  };
  label?: string;
  confidence: number;
  duration?: number;
  requiresClarification?: boolean;
}

/**
 * Central Orchestrator Structured Decision Contract
 */
export interface TutorDecision {
  intent: "explain_component" | "remediate_mistake" | "demonstrate_process" | "ask_checkpoint";
  targetComponent?: string;
  explanation: string;
  teachingStage: "INTRODUCE" | "VISUAL_DEMONSTRATION" | "CHECKPOINT_QUESTION" | "EVALUATE" | "REMEDIATE" | "SYNTHESIS";
  visualAnalysis?: {
    sceneId: string;
    detectedObjectsCount: number;
    focalObject?: VisualObject;
  };
  actions: WhiteboardAnnotation[];
  followUpQuestion?: string;
  confidence: number;
}

export interface VisionAnalysisRequest {
  imageBase64?: string;
  mimeType?: string;
  target?: string;
  action?: AnnotationAction;
  userQuery?: string;
  canvasPlacement?: {
    x: number;
    y: number;
    w?: number;
    h?: number;
    width?: number;
    height?: number;
  };
}

export interface VisionAnalysisResponse {
  success: boolean;
  cached: boolean;
  scene?: VisualScene;
  annotations: WhiteboardAnnotation[];
  marks: BoardMark[];
  clarificationRequired: boolean;
  clarificationPrompt?: string;
  confidence: number;
  latencyMs: number;
  error?: string;
}

export interface ImageIngestionResult {
  valid: boolean;
  fileHash: string;
  mimeType: string;
  buffer: Buffer;
  naturalWidth: number;
  naturalHeight: number;
  error?: string;
}

export interface PreprocessedImage {
  hash: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  dataUrl: string;
}
