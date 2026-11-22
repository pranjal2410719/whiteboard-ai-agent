import type { DiagramRegion } from "@/lib/types";

/**
 * Standard whiteboard layout for the DC Electric Circuit SVG diagram.
 * Positioned on the right side of the 1000x330 canvas at x: 515, y: 30.
 */
export const CIRCUIT_IMAGE_LAYOUT = { x: 515, y: 30, w: 430, h: 270 };

/**
 * Image-local coordinates within the 430x270 circuit SVG asset.
 */
export const circuitRegions: DiagramRegion[] = [
  { id: "battery", label: "Battery (DC Source)", x: 30, y: 110, w: 65, h: 70, aliases: ["voltage source", "power supply", "cell", "positive plate", "emf"], note: "The battery supplies electromotive force (EMF) creating a potential difference across the circuit." },
  { id: "switch", label: "Control Switch", x: 150, y: 38, w: 70, h: 50, aliases: ["key", "switch s", "circuit breaker", "knife switch"], note: "The switch controls circuit continuity; when closed, conductive contact allows current to flow." },
  { id: "resistor", label: "Resistor (R)", x: 320, y: 110, w: 85, h: 55, aliases: ["resistance", "ohmic resistor", "load resistance", "4 ohm"], note: "The resistor opposes electric current according to Ohm's Law (V = IR) and limits amperage." },
  { id: "lamp", label: "Lamp / Load", x: 170, y: 185, w: 65, h: 55, aliases: ["light bulb", "bulb", "load", "filament"], note: "The lamp converts electrical energy into light and thermal heat." },
  { id: "current", label: "Current Flow (I)", x: 95, y: 50, w: 60, h: 35, aliases: ["amperage", "conventional current", "i", "amps"], note: "Conventional current flows from the positive terminal toward the negative terminal." },
];

/**
 * Absolute whiteboard canvas coordinates matching the diagram image at (515, 30).
 * Centers align precisely with lecture animation circles:
 * Battery center (585, 165), Switch center (700, 93), Current (625, 95),
 * Resistor center (875, 165), Lamp / Load center (720, 245).
 */
export const circuitBoardRegions: DiagramRegion[] = [
  { id: "battery", label: "Battery (DC Source)", x: 555, y: 125, w: 60, h: 80, aliases: ["voltage source", "power supply", "cell", "positive plate", "emf"], note: "The battery supplies electromotive force (EMF) creating a potential difference across the circuit." },
  { id: "switch", label: "Control Switch", x: 670, y: 71, w: 60, h: 44, aliases: ["key", "switch s", "circuit breaker", "knife switch"], note: "The switch controls circuit continuity; when closed, conductive contact allows current to flow." },
  { id: "resistor", label: "Resistor (R)", x: 843, y: 123, w: 64, h: 84, aliases: ["resistance", "ohmic resistor", "load resistance", "4 ohm"], note: "The resistor opposes electric current according to Ohm's Law (V = IR) and limits amperage." },
  { id: "lamp", label: "Lamp / Load", x: 690, y: 219, w: 60, h: 52, aliases: ["light bulb", "bulb", "load", "filament"], note: "The lamp converts electrical energy into light and thermal heat." },
  { id: "current", label: "Current Flow (I)", x: 595, y: 75, w: 60, h: 40, aliases: ["amperage", "conventional current", "i", "amps"], note: "Conventional current flows from the positive terminal toward the negative terminal." },
];
