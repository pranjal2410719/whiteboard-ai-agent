import type { BoardMark } from "../types";
import { ingestImage } from "./image-ingestion";
import { preprocessImage } from "./image-preprocessor";
import { VisualCache } from "./visual-cache";
import { getVisionProvider, type IVisionProvider } from "./vision-provider";
import { VisualSceneGraph } from "./scene-graph";
import {
  DEFAULT_CANVAS_PLACEMENT,
  groundVisualObject,
  MIN_CONFIDENCE_THRESHOLD,
} from "./grounding";
import type {
  AnnotationAction,
  CanvasBoundingBox,
  VisionAnalysisRequest,
  VisionAnalysisResponse,
  VisualScene,
  WhiteboardAnnotation,
} from "./types";

/**
 * End-to-end visual perception and spatial grounding pipeline.
 */
export async function analyzeAndGroundVisual(
  request: VisionAnalysisRequest,
  options?: {
    provider?: IVisionProvider;
    keys?: { gemini?: string | null; openai?: string | null };
  }
): Promise<VisionAnalysisResponse> {
  const startTime = Date.now();

  if (!request.imageBase64) {
    return {
      success: false,
      cached: false,
      annotations: [],
      marks: [],
      clarificationRequired: false,
      confidence: 0,
      latencyMs: Date.now() - startTime,
      error: "No image payload provided.",
    };
  }

  // 1. Ingestion & Validation
  const ingestion = ingestImage(request.imageBase64);
  if (!ingestion.valid) {
    return {
      success: false,
      cached: false,
      annotations: [],
      marks: [],
      clarificationRequired: false,
      confidence: 0,
      latencyMs: Date.now() - startTime,
      error: ingestion.error || "Image ingestion validation failed.",
    };
  }

  // 2. Preprocess
  const preprocessed = preprocessImage(ingestion);
  const cache = VisualCache.getInstance();

  let scene: VisualScene | null = cache.get(preprocessed.hash);
  let isCached = false;

  if (scene) {
    isCached = true;
  } else {
    // 3. Provider Inference
    const provider = options?.provider || getVisionProvider(options?.keys);
    scene = await provider.analyze(preprocessed, request.target || request.userQuery);

    const graph = new VisualSceneGraph(scene);
    graph.enrichSpatialRelationships();

    // Store in cache
    cache.set(preprocessed.hash, scene);
  }

  const sceneGraph = new VisualSceneGraph(scene);
  const annotations: WhiteboardAnnotation[] = [];
  const marks: BoardMark[] = [];
  let clarificationRequired = false;
  let clarificationPrompt: string | undefined;
  let confidence = 0.95;

  const canvasPlacement: CanvasBoundingBox = request.canvasPlacement
    ? {
        x: request.canvasPlacement.x,
        y: request.canvasPlacement.y,
        width:
          request.canvasPlacement.width ??
          request.canvasPlacement.w ??
          DEFAULT_CANVAS_PLACEMENT.width,
        height:
          request.canvasPlacement.height ??
          request.canvasPlacement.h ??
          DEFAULT_CANVAS_PLACEMENT.height,
      }
    : DEFAULT_CANVAS_PLACEMENT;

  // 4. Spatial Grounding if target or action requested
  if (request.target) {
    const found = sceneGraph.findObject(request.target);

    if (found) {
      confidence = found.confidence;
      const action: AnnotationAction = request.action || "circle";

      const grounded = groundVisualObject(found, action, canvasPlacement);
      annotations.push(grounded.annotation);
      marks.push(...grounded.marks);

      if (grounded.requiresClarification || found.confidence < MIN_CONFIDENCE_THRESHOLD) {
        clarificationRequired = true;
        clarificationPrompt = `I detected multiple elements near '${request.target}' (confidence: ${Math.round(found.confidence * 100)}%). Could you clarify which part you mean?`;
      }
    } else {
      clarificationRequired = true;
      clarificationPrompt = `I inspected the diagram, but could not pinpoint '${request.target}' with high confidence. Would you like me to highlight the overall structure instead?`;
      confidence = 0.4;
    }
  }

  return {
    success: true,
    cached: isCached,
    scene,
    annotations,
    marks,
    clarificationRequired,
    clarificationPrompt,
    confidence,
    latencyMs: Date.now() - startTime,
  };
}
