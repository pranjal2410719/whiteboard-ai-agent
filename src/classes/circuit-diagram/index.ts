import type { ClassDefinition } from "../types";
import script from "./script.json";
import { circuitRegions, circuitBoardRegions, CIRCUIT_IMAGE_LAYOUT } from "./intelligence";
import { circuitInitialBoard, buildCircuitScenes, circuitSceneBoards, circuitImg } from "./board";

export { circuitRegions, circuitBoardRegions, CIRCUIT_IMAGE_LAYOUT } from "./intelligence";
export { circuitInitialBoard, buildCircuitScenes, circuitSceneBoards, circuitImg } from "./board";
export { default as circuitScript } from "./script.json";

export const circuitDiagramClass: ClassDefinition = {
  metadata: {
    key: "circuit-diagram",
    title: script.title,
    subject: "Physics",
    grade: "Class 9–10",
    durationMinutes: 2,
    totalSeconds: 120,
    summary: script.summary,
    focus: script.focus,
    prompts: [
      "“Identify the DC battery”",
      "“Trace conventional current flow”",
      "“Calculate current via Ohm’s Law”",
      "“Explain load power consumption”",
    ],
    audioPath: "/class-audio/circuit-diagram-v2.mp3",
    assetFolder: "/src/classes/circuit-diagram/assets",
  },
  script: script as any,
  initialBoard: circuitInitialBoard,
  scenes: buildCircuitScenes(),
  regions: circuitBoardRegions,
  notes: {
    notes: script.notes,
    mistake: script.mistake,
    practice: script.practice,
  },
};

export default circuitDiagramClass;
