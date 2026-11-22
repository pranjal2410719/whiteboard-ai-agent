import type { ClassDefinition } from "../types";
import script from "./script.json";
import { heartRegions, heartBoardRegions, HEART_IMAGE_LAYOUT } from "./intelligence";
import { heartInitialBoard, buildHeartScenes, heartSceneBoards } from "./board";

export { heartRegions, heartBoardRegions, HEART_IMAGE_LAYOUT } from "./intelligence";
export { heartInitialBoard, buildHeartScenes, heartSceneBoards, heartImg } from "./board";
export { default as heartScript } from "./script.json";

export const heartDiagramClass: ClassDefinition = {
  metadata: {
    key: "heart-diagram",
    title: script.title,
    subject: "Biology",
    grade: "Class 9–10",
    durationMinutes: 2,
    totalSeconds: 120,
    summary: script.summary,
    focus: script.focus,
    prompts: [
      "“Trace systemic circulation”",
      "“Show pulmonary circuit”",
      "“Highlight the mitral valve”",
      "“Explain the cardiac cycle”",
    ],
    audioPath: "/class-audio/heart-diagram-v2.mp3",
    assetFolder: "/src/classes/heart-diagram/assets",
  },
  script: script as any,
  initialBoard: heartInitialBoard,
  scenes: buildHeartScenes(),
  regions: heartBoardRegions,
  notes: {
    notes: script.notes,
    mistake: script.mistake,
    practice: script.practice,
  },
};

export default heartDiagramClass;
