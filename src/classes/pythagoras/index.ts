import type { ClassDefinition } from "../types";
import script from "./script.json";
import { pythagorasRegions, pythagorasBoardRegions, PYTHAGORAS_LAYOUT } from "./intelligence";
import { pythagorasInitialBoard, buildPythagorasScenes, pythagorasSceneBoards, triangle, labels } from "./board";

export { pythagorasRegions, pythagorasBoardRegions, PYTHAGORAS_LAYOUT } from "./intelligence";
export { pythagorasInitialBoard, buildPythagorasScenes, pythagorasSceneBoards, triangle, labels } from "./board";
export { default as pythagorasScript } from "./script.json";

export const pythagorasClass: ClassDefinition = {
  metadata: {
    key: "pythagoras",
    title: script.title,
    subject: "Mathematics",
    grade: "Class 8–10",
    durationMinutes: 2,
    totalSeconds: 120,
    summary: script.summary,
    focus: script.focus,
    prompts: [
      "“Show me an example”",
      "“Explain it simply”",
      "“Quiz me”",
      "“Find missing leg formula”",
    ],
    audioPath: "/class-audio/pythagoras-v2.mp3",
    assetFolder: "/src/classes/pythagoras/assets",
  },
  script: script as any,
  initialBoard: pythagorasInitialBoard,
  scenes: buildPythagorasScenes(),
  regions: pythagorasBoardRegions,
  notes: {
    notes: script.notes,
    mistake: script.mistake,
    practice: script.practice,
  },
};

export default pythagorasClass;
