import type { Point } from "../types";
import type { BoundingBox, DisplayedAssetInfo, ElementGeometry } from "./types";

/**
 * Calculates the center of a bounding box.
 */
export function boxCenter(box: BoundingBox): Point {
  return {
    x: box.x + box.w / 2,
    y: box.y + box.h / 2,
  };
}

/**
 * Calculates the bounding box of an array of 2D polygon points.
 */
export function polygonBounds(points: [number, number][]): BoundingBox {
  if (!points.length) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return {
    x: Math.round(minX),
    y: Math.round(minY),
    w: Math.round(maxX - minX),
    h: Math.round(maxY - minY),
  };
}

/**
 * Transforms an element's bounding box from asset-local coordinates to whiteboard stage coordinates.
 */
export function transformBox(
  box: BoundingBox,
  asset: DisplayedAssetInfo
): BoundingBox {
  return {
    x: Math.round(asset.x + box.x * asset.scaleX),
    y: Math.round(asset.y + box.y * asset.scaleY),
    w: Math.round(box.w * asset.scaleX),
    h: Math.round(box.h * asset.scaleY),
  };
}

/**
 * Transforms an element's polygon points from asset-local coordinates to whiteboard stage coordinates.
 */
export function transformPolygon(
  points: [number, number][],
  asset: DisplayedAssetInfo
): [number, number][] {
  return points.map(([px, py]) => [
    Math.round(asset.x + px * asset.scaleX),
    Math.round(asset.y + py * asset.scaleY),
  ]);
}

/**
 * Scales an SVG path string from asset coordinates to whiteboard stage coordinates.
 */
export function transformPath(
  d: string,
  asset: DisplayedAssetInfo
): string {
  // Regex matches SVG command letters followed by numbers
  return d.replace(/([0-9]+(?:\.[0-9]+)?)/g, (match, numStr, offset, fullStr) => {
    const val = parseFloat(numStr);
    if (!Number.isFinite(val)) return match;
    // Inspect preceding coordinate context or assume alternate x/y
    return String(Math.round(val * ((asset.scaleX + asset.scaleY) / 2)));
  });
}

/**
 * Transforms any ElementGeometry into displayed whiteboard coordinates.
 */
export function transformGeometry(
  geom: ElementGeometry,
  asset: DisplayedAssetInfo
): { bounds: BoundingBox; points?: [number, number][]; d?: string } {
  if (geom.kind === "box") {
    const bounds = transformBox(geom.box, asset);
    return { bounds };
  }
  if (geom.kind === "polygon") {
    const points = transformPolygon(geom.points, asset);
    const bounds = polygonBounds(points);
    return { bounds, points };
  }
  if (geom.kind === "path") {
    const bounds = transformBox(geom.bounds, asset);
    const d = transformPath(geom.d, asset);
    return { bounds, d };
  }
  const bounds = transformBox(geom.box, asset);
  return { bounds };
}

/**
 * Computes connection pins for drawing connecting arrows between two elements.
 */
export function getElementPins(box: BoundingBox) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return {
    center: { x: cx, y: cy },
    top: { x: cx, y: box.y },
    bottom: { x: cx, y: box.y + box.h },
    left: { x: box.x, y: cy },
    right: { x: box.x + box.w, y: cy },
  };
}

/**
 * Checks if two bounding boxes collide or overlap.
 */
export function boxesOverlap(a: BoundingBox, b: BoundingBox, margin = 0): boolean {
  return !(
    a.x + a.w + margin < b.x ||
    b.x + b.w + margin < a.x ||
    a.y + a.h + margin < b.y ||
    b.y + b.h + margin < a.y
  );
}

/**
 * Generates an SVG path string representing a closed polygon.
 */
export function polygonToSvgPath(points: [number, number][]): string {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return `M${first[0]} ${first[1]} ` + rest.map(([x, y]) => `L${x} ${y}`).join(" ") + " Z";
}
