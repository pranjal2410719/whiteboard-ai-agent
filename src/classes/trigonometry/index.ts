import type { ClassDefinition } from "../types";
import script from "./script.json";
import { trigRegions, trigBoardRegions, TRIG_IMAGE_LAYOUT } from "./intelligence";
import { trigInitialBoard, buildTrigScenes, trigSceneBoards, trigImg } from "./board";

export { trigRegions, trigBoardRegions, TRIG_IMAGE_LAYOUT } from "./intelligence";
export { trigInitialBoard, buildTrigScenes, trigSceneBoards, trigImg } from "./board";
export { default as trigScript } from "./script.json";

export const trigonometryClass: ClassDefinition = {
  metadata: {
    key: "trigonometry",
    title: script.title,
    subject: "Mathematics",
    grade: "Class 9–11",
    durationMinutes: 2,
    totalSeconds: 120,
    summary: script.summary,
    focus: script.focus,
    prompts: [
      "“Highlight the hypotenuse”",
      "“Circle angle theta”",
      "“Explain SOH-CAH-TOA”",
      "“Where is the opposite side?”",
      "“Show the Pythagorean identity”",
    ],
    audioPath: "/class-audio/trigonometry-v2.mp3",
    assetFolder: "/src/classes/trigonometry/assets",
  },
  script: script as any,
  initialBoard: trigInitialBoard,
  scenes: buildTrigScenes(),
  regions: trigBoardRegions,
  notes: {
    notes: script.notes,
    mistake: script.mistake,
    practice: script.practice,
  },
};

export default trigonometryClass;
