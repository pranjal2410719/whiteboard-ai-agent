import type { ClassDefinition } from "../types";
import script from "./script.json";
import { cellRegions, cellBoardRegions } from "./intelligence";
import { cellInitialBoard, buildCellScenes, cellSceneBoards, cellImg } from "./board";

export { cellRegions, cellBoardRegions } from "./intelligence";
export { cellInitialBoard, buildCellScenes, cellSceneBoards, cellImg } from "./board";
export { default as cellScript } from "./script.json";

export const humanCellClass: ClassDefinition = {
  metadata: {
    key: "human-cell",
    title: script.title,
    subject: "Biology",
    grade: "Class 9–10",
    durationMinutes: 2,
    totalSeconds: 120,
    summary: script.summary,
    focus: script.focus,
    prompts: [
      "“Circle the nucleus”",
      "“Highlight the mitochondria”",
      "“Underline the cell membrane”",
      "“Locate rough ER & ribosomes”",
    ],
    audioPath: "/class-audio/human-cell-v2.mp3",
    assetFolder: "/src/classes/human-cell/assets",
  },
  script: script as any,
  initialBoard: cellInitialBoard,
  scenes: buildCellScenes(),
  regions: cellBoardRegions,
  notes: {
    notes: script.notes,
    mistake: script.mistake,
    practice: script.practice,
  },
};

export default humanCellClass;
