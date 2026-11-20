import type { AssetCanvasMap } from "../types";

/**
 * Verified Asset Canvas Map for the DC Electric Circuit Diagram.
 *
 * Source: public/assets/electric-circuit.svg
 * Natural dimensions: 430 × 270 (SVG viewBox: 0 0 430 270).
 */
export const electricCircuitAssetMap: AssetCanvasMap = {
  assetId: "electric-circuit",
  title: "DC Electric Circuit & Ohm's Law",
  subject: "Physics",
  source: "/assets/electric-circuit.svg",
  naturalWidth: 430,
  naturalHeight: 270,
  elements: [
    {
      id: "battery",
      name: "Battery (DC Source)",
      category: "source",
      geometry: {
        kind: "box",
        box: { x: 30, y: 110, w: 65, h: 70 },
      },
      aliases: ["voltage source", "power supply", "cell", "positive plate", "dc source", "emf"],
      relationships: [
        { type: "powers", targetId: "switch", label: "Drives conventional current clockwise toward switch" },
        { type: "connected_to", targetId: "lamp", label: "Negative plate receives return current from lamp" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Prof. Kenneth Hayes (Circuit Physics #PHY-204)",
        verifiedAt: "2026-11-20T17:10:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified DC battery cell plates (+ / - terminals).",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "circle", "box", "arrow", "label", "pointer", "annotate", "pulse"],
      pedagogicalNote: "Electrochemical power supply establishing an electromotive force (EMF) potential difference that drives charge carriers around the loop.",
      anchorPoints: {
        center: { x: 62, y: 145 },
        top: { x: 62, y: 110 },
        bottom: { x: 62, y: 180 },
        left: { x: 30, y: 145 },
        right: { x: 95, y: 145 },
      },
    },
    {
      id: "switch",
      name: "Control Switch",
      category: "component",
      geometry: {
        kind: "box",
        box: { x: 150, y: 38, w: 70, h: 50 },
      },
      aliases: ["key", "switch s", "circuit breaker", "toggle switch", "knife switch"],
      relationships: [
        { type: "connected_to", targetId: "resistor", label: "Top wire carries current to resistor when switch is closed" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Prof. Kenneth Hayes (Circuit Physics #PHY-204)",
        verifiedAt: "2026-11-20T17:10:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified switch terminal nodes and blade angle.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "circle", "box", "arrow", "label", "pointer", "annotate"],
      pedagogicalNote: "Switch mechanism controlling electrical continuity; when contacts close, mobile electrons flow along the closed loop.",
      anchorPoints: {
        center: { x: 185, y: 63 },
        top: { x: 185, y: 38 },
        bottom: { x: 185, y: 88 },
        left: { x: 150, y: 63 },
        right: { x: 220, y: 63 },
      },
    },
    {
      id: "resistor",
      name: "Resistor (R)",
      category: "load",
      geometry: {
        kind: "box",
        box: { x: 320, y: 110, w: 85, h: 55 },
      },
      aliases: ["resistance", "ohmic resistor", "load resistance", "r", "ohmic load"],
      relationships: [
        { type: "connected_to", targetId: "lamp", label: "Right wire feeds current down to the lamp load" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Prof. Kenneth Hayes (Circuit Physics #PHY-204)",
        verifiedAt: "2026-11-20T17:10:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified zigzag resistor geometry and lead wires.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "circle", "box", "arrow", "label", "pointer", "annotate", "pulse"],
      pedagogicalNote: "Passive two-terminal linear component impeding electrical current in accordance with Ohm's Law (V = IR), dissipating thermal energy.",
      anchorPoints: {
        center: { x: 362, y: 137 },
        top: { x: 362, y: 110 },
        bottom: { x: 362, y: 165 },
        left: { x: 320, y: 137 },
        right: { x: 405, y: 137 },
      },
    },
    {
      id: "lamp",
      name: "Lamp / Load",
      category: "load",
      geometry: {
        kind: "box",
        box: { x: 170, y: 185, w: 65, h: 55 },
      },
      aliases: ["light bulb", "bulb", "load", "lamp load", "filament"],
      relationships: [
        { type: "connected_to", targetId: "battery", label: "Completes the circuit loop back to the battery negative terminal" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Prof. Kenneth Hayes (Circuit Physics #PHY-204)",
        verifiedAt: "2026-11-20T17:10:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified lamp filament sphere and lead connections.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "circle", "box", "arrow", "label", "pointer", "annotate", "pulse"],
      pedagogicalNote: "Luminous resistive transducer transforming electrical potential energy into electromagnetic light radiation and heat.",
      anchorPoints: {
        center: { x: 202, y: 212 },
        top: { x: 202, y: 185 },
        bottom: { x: 202, y: 240 },
        left: { x: 170, y: 212 },
        right: { x: 235, y: 212 },
      },
    },
    {
      id: "current",
      name: "Current Flow (I)",
      category: "structure",
      geometry: {
        kind: "box",
        box: { x: 95, y: 50, w: 60, h: 35 },
      },
      aliases: ["amperage", "conventional current", "i", "current flow", "electron flow"],
      relationships: [
        { type: "flows_to", targetId: "switch", label: "Directional current arrow indicates clockwise loop flow" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Prof. Kenneth Hayes (Circuit Physics #PHY-204)",
        verifiedAt: "2026-11-20T17:10:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified conventional current direction indicator.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "arrow", "label", "pointer", "underline", "annotate"],
      pedagogicalNote: "Conventional electrical current definition specifying positive charge carrier motion from high potential (+) to low potential (-).",
      anchorPoints: {
        center: { x: 125, y: 67 },
        top: { x: 125, y: 50 },
        bottom: { x: 125, y: 85 },
        left: { x: 95, y: 67 },
        right: { x: 155, y: 67 },
      },
    },
  ],
};
