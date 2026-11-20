import type { Point } from "../../types";
import type { BoundingBox, ElementGeometry } from "../types";
import { polygonBounds } from "../geometry";

export interface AnchorPins {
  center: Point;
  top: Point;
  bottom: Point;
  left: Point;
  right: Point;
}

export class GeometryGenerator {
  /**
   * Generates anchor pins from a bounding box.
   */
  static computeAnchorPins(box: BoundingBox): AnchorPins {
    const cx = Math.round(box.x + box.w / 2);
    const cy = Math.round(box.y + box.h / 2);
    return {
      center: { x: cx, y: cy },
      top: { x: cx, y: box.y },
      bottom: { x: cx, y: box.y + box.h },
      left: { x: box.x, y: cy },
      right: { x: box.x + box.w, y: cy },
    };
  }

  /**
   * Validates and clamps a bounding box within image bounds.
   */
  static clampBox(box: BoundingBox, maxWidth: number, maxHeight: number): BoundingBox {
    const x = Math.max(0, Math.min(box.x, maxWidth));
    const y = Math.max(0, Math.min(box.y, maxHeight));
    const w = Math.max(1, Math.min(box.w, maxWidth - x));
    const h = Math.max(1, Math.min(box.h, maxHeight - y));
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  }

  /**
   * Generates a verified Box geometry.
   */
  static createBoxGeometry(
    box: BoundingBox,
    naturalWidth: number,
    naturalHeight: number
  ): { geometry: ElementGeometry; pins: AnchorPins } {
    const clamped = this.clampBox(box, naturalWidth, naturalHeight);
    const pins = this.computeAnchorPins(clamped);
    return {
      geometry: { kind: "box", box: clamped },
      pins,
    };
  }

  /**
   * Generates a verified Polygon geometry from an array of 2D coordinates.
   */
  static createPolygonGeometry(
    points: [number, number][],
    naturalWidth: number,
    naturalHeight: number
  ): { geometry: ElementGeometry; pins: AnchorPins } {
    if (points.length < 3) {
      throw new Error(`Polygon must have at least 3 points, got ${points.length}`);
    }

    const clampedPoints: [number, number][] = points.map(([px, py]) => [
      Math.max(0, Math.min(Math.round(px), naturalWidth)),
      Math.max(0, Math.min(Math.round(py), naturalHeight)),
    ]);

    const bounds = polygonBounds(clampedPoints);
    const pins = this.computeAnchorPins(bounds);

    return {
      geometry: {
        kind: "polygon",
        points: clampedPoints,
        bounds,
      },
      pins,
    };
  }

  /**
   * Generates a verified SVG Path geometry.
   */
  static createPathGeometry(
    d: string,
    approximateBounds: BoundingBox,
    naturalWidth: number,
    naturalHeight: number
  ): { geometry: ElementGeometry; pins: AnchorPins } {
    const clamped = this.clampBox(approximateBounds, naturalWidth, naturalHeight);
    const pins = this.computeAnchorPins(clamped);

    return {
      geometry: {
        kind: "path",
        d: d.trim(),
        bounds: clamped,
      },
      pins,
    };
  }
}
