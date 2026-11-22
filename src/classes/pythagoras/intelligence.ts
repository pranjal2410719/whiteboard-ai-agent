import type { DiagramRegion } from "@/lib/types";

/**
 * Standard whiteboard layout for the Pythagoras right-angled triangle.
 * Triangle vertices: top (608, 89), corner (608, 245), right (853, 245).
 */
export const PYTHAGORAS_LAYOUT = { x: 550, y: 80, w: 320, h: 210 };

/**
 * Image/local-relative coordinates (if embedded as an asset).
 */
export const pythagorasRegions: DiagramRegion[] = [
  { id: "right-angle", label: "Right Angle (90°)", x: 50, y: 145, w: 45, h: 35, aliases: ["square corner", "perpendicular", "90 deg", "right_angle"], note: "The 90° angle formed between legs a and b." },
  { id: "leg-a", label: "Leg a (Vertical)", x: 30, y: 10, w: 55, h: 165, aliases: ["leg 1", "wall", "height", "a", "vertical leg"], note: "First perpendicular leg of the right-angled triangle." },
  { id: "leg-b", label: "Leg b (Base)", x: 58, y: 155, w: 250, h: 45, aliases: ["leg 2", "ground", "base", "b", "horizontal leg"], note: "Second perpendicular leg along the horizontal base." },
  { id: "hypotenuse", label: "Hypotenuse c", x: 80, y: 15, w: 225, h: 150, aliases: ["longest side", "diagonal", "c", "ladder", "hypotenuse c"], note: "The longest side c directly opposite the 90° right angle: a² + b² = c²." },
];

/**
 * Absolute whiteboard canvas coordinates matching the SVG triangle:
 * Vertices at (608, 89), (608, 245), and (853, 245).
 * Leg a center: (608, 167), Leg b center: (730, 255),
 * Hypotenuse center: (730, 167), Right angle center: (627, 235).
 */
export const pythagorasBoardRegions: DiagramRegion[] = [
  { id: "right-angle", label: "Right Angle (90°)", x: 605, y: 220, w: 45, h: 30, aliases: ["square corner", "perpendicular", "90 deg", "right_angle"], note: "The 90° angle formed between legs a and b." },
  { id: "leg-a", label: "Leg a (Vertical)", x: 580, y: 85, w: 55, h: 165, aliases: ["leg 1", "wall", "height", "a", "vertical leg"], note: "First perpendicular leg of the right-angled triangle." },
  { id: "leg-b", label: "Leg b (Base)", x: 608, y: 235, w: 250, h: 45, aliases: ["leg 2", "ground", "base", "b", "horizontal leg"], note: "Second perpendicular leg along the horizontal base." },
  { id: "hypotenuse", label: "Hypotenuse c", x: 630, y: 95, w: 225, h: 150, aliases: ["longest side", "diagonal", "c", "ladder", "hypotenuse c"], note: "The longest side c directly opposite the 90° right angle: a² + b² = c²." },
];
