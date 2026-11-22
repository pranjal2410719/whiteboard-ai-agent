import type { BoardMark } from "../types";
import type {
  AnnotationAction,
  CanvasBoundingBox,
  NormalizedBoundingBox,
  VisualObject,
  WhiteboardAnnotation,
} from "./types";

export const DEFAULT_CANVAS_PLACEMENT: CanvasBoundingBox = {
  x: 580,
  y: 16,
  width: 270,
  height: 298,
};

export const MIN_CONFIDENCE_THRESHOLD = 0.65;

const ACTION_COLORS: Record<AnnotationAction, string> = {
  circle: "#c0504d",    // Crimson/Coral for anatomical circles
  underline: "#bc7948", // Ochre/amber for text and formulas
  arrow: "#3b805c",     // Green for flow and direction
  highlight: "#e2a526", // Golden yellow for highlights
  pointer: "#293b32",   // Forest chalkboard green
  freehand: "#507aaf",  // Slate blue for contours
};

/**
 * Transforms a normalized bounding box [ymin, xmin, ymax, xmax] into whiteboard canvas pixels.
 */
export function projectToCanvas(
  normalizedBox: NormalizedBoundingBox,
  canvasPlacement: CanvasBoundingBox = DEFAULT_CANVAS_PLACEMENT
): CanvasBoundingBox {
  const x = Math.round(canvasPlacement.x + normalizedBox.xmin * canvasPlacement.width);
  const y = Math.round(canvasPlacement.y + normalizedBox.ymin * canvasPlacement.height);
  const width = Math.max(8, Math.round((normalizedBox.xmax - normalizedBox.xmin) * canvasPlacement.width));
  const height = Math.max(8, Math.round((normalizedBox.ymax - normalizedBox.ymin) * canvasPlacement.height));

  return { x, y, width, height };
}

/**
 * Generates an SVG path for a directional vector arrow pointing at a target point.
 */
function createArrowPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Arrowhead wings
  const headLen = Math.min(14, len * 0.3);
  const wing1X = toX - headLen * (ux + uy * 0.5);
  const wing1Y = toY - headLen * (uy - ux * 0.5);
  const wing2X = toX - headLen * (ux - uy * 0.5);
  const wing2Y = toY - headLen * (uy + ux * 0.5);

  return `M ${Math.round(fromX)} ${Math.round(fromY)} L ${Math.round(toX)} ${Math.round(toY)} M ${Math.round(wing1X)} ${Math.round(wing1Y)} L ${Math.round(toX)} ${Math.round(toY)} L ${Math.round(wing2X)} ${Math.round(wing2Y)}`;
}

/**
 * Generates a WhiteboardAnnotation and matching BoardMark from a detected visual object.
 */
export function groundVisualObject(
  target: VisualObject,
  action: AnnotationAction = "circle",
  canvasPlacement: CanvasBoundingBox = DEFAULT_CANVAS_PLACEMENT,
  options?: {
    color?: string;
    strokeWidth?: number;
    duration?: number;
    arrowFrom?: { x: number; y: number };
  }
): {
  annotation: WhiteboardAnnotation;
  marks: BoardMark[];
  requiresClarification: boolean;
} {
  const confidence = target.confidence ?? 0.85;

  // Low confidence check
  if (confidence < MIN_CONFIDENCE_THRESHOLD) {
    const annotation: WhiteboardAnnotation = {
      id: `ann_lowconf_${target.id}_${Date.now()}`,
      action,
      target: target.label,
      coordinateSpace: "canvas",
      points: [],
      confidence,
      requiresClarification: true,
    };
    return {
      annotation,
      marks: [],
      requiresClarification: true,
    };
  }

  const canvasBox = projectToCanvas(target.boundingBox, canvasPlacement);
  const color = options?.color || ACTION_COLORS[action];
  const strokeWidth = options?.strokeWidth ?? 2.6;

  const centerX = Math.round(canvasBox.x + canvasBox.width / 2);
  const centerY = Math.round(canvasBox.y + canvasBox.height / 2);

  const marks: BoardMark[] = [];
  let annotation: WhiteboardAnnotation;

  switch (action) {
    case "circle": {
      // Ellipse surrounding the component with comfortable label clearance
      const paddingX = Math.max(6, canvasBox.width * 0.12);
      const paddingY = Math.max(6, canvasBox.height * 0.12);
      const rx = Math.round((canvasBox.width / 2) + paddingX);
      const ry = Math.round((canvasBox.height / 2) + paddingY);

      annotation = {
        id: `ann_circle_${target.id}_${Date.now()}`,
        action: "circle",
        target: target.label,
        coordinateSpace: "canvas",
        points: [{ x: centerX, y: centerY }],
        shape: {
          type: "ellipse",
          centerX,
          centerY,
          width: rx * 2,
          height: ry * 2,
          radiusX: rx,
          radiusY: ry,
          color,
          strokeWidth,
          fill: "none",
        },
        confidence,
        duration: options?.duration,
      };

      marks.push({
        type: "ellipse",
        x: centerX,
        y: centerY,
        w: rx,
        h: ry,
        color,
        strokeWidth,
        fill: "none",
        annotation: true,
        layer: "teacher-annotations",
      });
      break;
    }

    case "underline": {
      const underlineY = Math.min(326, canvasBox.y + canvasBox.height + 4);
      const startX = Math.max(10, canvasBox.x - 2);
      const endX = Math.min(990, canvasBox.x + canvasBox.width + 2);

      annotation = {
        id: `ann_underline_${target.id}_${Date.now()}`,
        action: "underline",
        target: target.label,
        coordinateSpace: "canvas",
        points: [{ x: startX, y: underlineY }, { x: endX, y: underlineY }],
        shape: {
          type: "path",
          centerX,
          centerY: underlineY,
          width: endX - startX,
          height: strokeWidth,
          color,
          strokeWidth,
        },
        confidence,
        duration: options?.duration,
      };

      marks.push({
        type: "path",
        d: `M ${startX} ${underlineY} L ${endX} ${underlineY}`,
        color,
        strokeWidth,
        fill: "none",
        annotation: true,
        layer: "teacher-annotations",
      });
      break;
    }

    case "arrow": {
      // Points from specified origin (or left/above) towards the center of the target
      const fromX = options?.arrowFrom?.x ?? Math.max(10, canvasBox.x - 45);
      const fromY = options?.arrowFrom?.y ?? centerY;
      const toX = canvasBox.x - 4;
      const toY = centerY;

      const pathData = createArrowPath(fromX, fromY, toX, toY);

      annotation = {
        id: `ann_arrow_${target.id}_${Date.now()}`,
        action: "arrow",
        target: target.label,
        coordinateSpace: "canvas",
        points: [{ x: fromX, y: fromY }, { x: toX, y: toY }],
        shape: {
          type: "arrow",
          centerX: (fromX + toX) / 2,
          centerY: (fromY + toY) / 2,
          width: Math.abs(toX - fromX),
          height: Math.abs(toY - fromY),
          color,
          strokeWidth,
        },
        confidence,
        duration: options?.duration,
      };

      marks.push({
        type: "path",
        d: pathData,
        color,
        strokeWidth,
        fill: "none",
        annotation: true,
        layer: "teacher-annotations",
      });
      break;
    }

    case "highlight": {
      const padding = 4;
      const hx = Math.max(0, canvasBox.x - padding);
      const hy = Math.max(0, canvasBox.y - padding);
      const hw = canvasBox.width + padding * 2;
      const hh = canvasBox.height + padding * 2;

      annotation = {
        id: `ann_highlight_${target.id}_${Date.now()}`,
        action: "highlight",
        target: target.label,
        coordinateSpace: "canvas",
        points: [{ x: hx, y: hy }],
        shape: {
          type: "rect",
          centerX,
          centerY,
          width: hw,
          height: hh,
          color,
          strokeWidth: 1.5,
          fill: color,
        },
        confidence,
        duration: options?.duration,
      };

      marks.push({
        type: "rect",
        x: hx,
        y: hy,
        w: hw,
        h: hh,
        color,
        strokeWidth: 1.5,
        fill: color,
        opacity: 0.22,
        annotation: true,
        layer: "teacher-annotations",
      });
      break;
    }

    case "pointer": {
      annotation = {
        id: `ann_pointer_${target.id}_${Date.now()}`,
        action: "pointer",
        target: target.label,
        coordinateSpace: "canvas",
        points: [{ x: centerX, y: centerY }],
        shape: {
          type: "ellipse",
          centerX,
          centerY,
          width: 24,
          height: 24,
          radiusX: 12,
          radiusY: 12,
          color,
          fill: color,
        },
        confidence,
        duration: options?.duration ?? 2500,
      };

      // Ephemeral pulsing spotlight crosshair / dot on overlay layer
      marks.push(
        {
          type: "ellipse",
          x: centerX,
          y: centerY,
          w: 8,
          h: 8,
          color,
          fill: color,
          opacity: 0.85,
          annotation: true,
          layer: "overlays",
        },
        {
          type: "ellipse",
          x: centerX,
          y: centerY,
          w: 18,
          h: 18,
          color,
          strokeWidth: 1.8,
          dashed: true,
          fill: "none",
          opacity: 0.6,
          annotation: true,
          layer: "overlays",
        }
      );
      break;
    }

    case "freehand": {
      // Default to contour outline
      const padding = 6;
      const fx = canvasBox.x - padding;
      const fy = canvasBox.y - padding;
      const fw = canvasBox.width + padding * 2;
      const fh = canvasBox.height + padding * 2;

      const pathData = `M ${fx} ${fy + fh / 2} Q ${fx + fw / 2} ${fy - 4} ${fx + fw} ${fy + fh / 2} Q ${fx + fw / 2} ${fy + fh + 4} ${fx} ${fy + fh / 2}`;

      annotation = {
        id: `ann_freehand_${target.id}_${Date.now()}`,
        action: "freehand",
        target: target.label,
        coordinateSpace: "canvas",
        points: [{ x: fx, y: fy }, { x: fx + fw, y: fy + fh }],
        shape: {
          type: "path",
          centerX,
          centerY,
          width: fw,
          height: fh,
          color,
          strokeWidth,
        },
        confidence,
      };

      marks.push({
        type: "path",
        d: pathData,
        color,
        strokeWidth,
        fill: "none",
        annotation: true,
        layer: "teacher-annotations",
      });
      break;
    }
  }

  return {
    annotation,
    marks,
    requiresClarification: false,
  };
}
