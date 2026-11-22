import type { DiagramRegion } from "@/lib/types";

export const pythagorasRegions: DiagramRegion[] = [
  { id: "right-angle", label: "Right Angle (90°)", x: 50, y: 225, w: 30, h: 30, aliases: ["square corner", "perpendicular", "90 deg", "right_angle"], note: "The 90° angle formed between legs a and b." },
  { id: "leg-a", label: "Leg a (Vertical)", x: 20, y: 100, w: 40, h: 140, aliases: ["leg 1", "wall", "height", "a"], note: "First perpendicular leg of the right-angled triangle." },
  { id: "leg-b", label: "Leg b (Base)", x: 100, y: 240, w: 200, h: 40, aliases: ["leg 2", "ground", "base", "b"], note: "Second perpendicular leg along the horizontal base." },
  { id: "hypotenuse", label: "Hypotenuse c", x: 150, y: 100, w: 180, h: 140, aliases: ["longest side", "diagonal", "c"], note: "The longest side c directly opposite the 90° right angle: a² + b² = c²." },
];
