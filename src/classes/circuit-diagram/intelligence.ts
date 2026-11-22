import type { DiagramRegion } from "@/lib/types";

export const circuitRegions: DiagramRegion[] = [
  { id: "battery", label: "Battery (DC Source)", x: 30, y: 110, w: 65, h: 70, aliases: ["voltage source", "power supply", "cell", "positive plate"], note: "The battery supplies electromotive force (EMF) creating a potential difference across the circuit." },
  { id: "switch", label: "Control Switch", x: 150, y: 38, w: 70, h: 50, aliases: ["key", "switch s", "circuit breaker"], note: "The switch controls circuit continuity; when closed, conductive contact allows current to flow." },
  { id: "resistor", label: "Resistor (R)", x: 320, y: 110, w: 85, h: 55, aliases: ["resistance", "ohmic resistor", "load resistance"], note: "The resistor opposes electric current according to Ohm's Law (V = IR) and limits amperage." },
  { id: "lamp", label: "Lamp / Load", x: 170, y: 185, w: 65, h: 55, aliases: ["light bulb", "bulb", "load"], note: "The lamp converts electrical energy into light and thermal heat." },
  { id: "current", label: "Current Flow (I)", x: 95, y: 50, w: 60, h: 35, aliases: ["amperage", "conventional current", "i"], note: "Conventional current flows from the positive terminal toward the negative terminal." },
];
