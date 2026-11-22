export * from "./types";
export * from "./geometry";
export * from "./validator";
export * from "./heart-asset-map";
export * from "./prepared-assets";
export * from "./registry";
export * from "./engine";

import { CanvasIntelligenceEngine } from "./engine";
import { humanHeartAssetMap } from "./heart-asset-map";
import { humanCellAssetMap, humanCellDiagramPngAssetMap } from "./prepared-assets/cell-asset-map";
import { waterCycleAssetMap } from "./prepared-assets/water-cycle-asset-map";
import { electricCircuitAssetMap } from "./prepared-assets/electric-circuit-asset-map";
import { inclinedPlaneAssetMap } from "./prepared-assets/inclined-plane-asset-map";

/**
 * Convenience factory to create a CIE pre-loaded with the Human Heart diagram
 * positioned at the standard whiteboard diagram coordinates (x: 580, y: 16, w: 270, h: 298).
 */
export function createHeartCanvasEngine(): CanvasIntelligenceEngine {
  return new CanvasIntelligenceEngine(humanHeartAssetMap, {
    x: 580,
    y: 16,
    w: 270,
    h: 298,
  });
}

/**
 * Convenience factory to create a CIE pre-loaded with the Human Cell diagram
 * positioned at standard whiteboard diagram coordinates (x: 515, y: 30, w: 430, h: 270).
 */
export function createCellCanvasEngine(): CanvasIntelligenceEngine {
  return new CanvasIntelligenceEngine(humanCellAssetMap, {
    x: 515,
    y: 30,
    w: 430,
    h: 270,
  });
}

/**
 * Convenience factory to create a CIE pre-loaded with the authentic Human Cell Diagram PNG
 * positioned at standard whiteboard diagram coordinates (x: 610, y: 14, w: 232, h: 310).
 */
export function createCellDiagramPngCanvasEngine(): CanvasIntelligenceEngine {
  return new CanvasIntelligenceEngine(humanCellDiagramPngAssetMap, {
    x: 610,
    y: 14,
    w: 232,
    h: 310,
  });
}

/**
 * Convenience factory to create a CIE pre-loaded with the Water Cycle diagram
 * positioned at standard whiteboard diagram coordinates (x: 515, y: 30, w: 430, h: 270).
 */
export function createWaterCycleCanvasEngine(): CanvasIntelligenceEngine {
  return new CanvasIntelligenceEngine(waterCycleAssetMap, {
    x: 515,
    y: 30,
    w: 430,
    h: 270,
  });
}

/**
 * Convenience factory to create a CIE pre-loaded with the DC Electric Circuit diagram
 * positioned at standard whiteboard diagram coordinates (x: 515, y: 30, w: 430, h: 270).
 */
export function createCircuitCanvasEngine(): CanvasIntelligenceEngine {
  return new CanvasIntelligenceEngine(electricCircuitAssetMap, {
    x: 515,
    y: 30,
    w: 430,
    h: 270,
  });
}

/**
 * Convenience factory to create a CIE pre-loaded with the Inclined Plane Mechanics diagram
 * positioned at standard whiteboard diagram coordinates (x: 515, y: 30, w: 430, h: 270).
 */
export function createInclinedPlaneCanvasEngine(): CanvasIntelligenceEngine {
  return new CanvasIntelligenceEngine(inclinedPlaneAssetMap, {
    x: 515,
    y: 30,
    w: 430,
    h: 270,
  });
}
