import type { ClassDefinition } from "../types";
import script from "./script.json";
import { cellRegions, cellBoardRegions, CELL_BASE_LAYOUT } from "./intelligence";
import { cellInitialBoard, buildCellScenes, cellSceneBoards, cellBaseImg } from "./board";

export { cellRegions, cellBoardRegions, CELL_BASE_LAYOUT } from "./intelligence";
export { cellInitialBoard, buildCellScenes, cellSceneBoards, cellBaseImg } from "./board";
export { default as cellScript } from "./script.json";

export const cellClass: ClassDefinition = {
  metadata: {
    key: "cell",
    title: script.title,
    subject: "Biology",
    grade: "Class 9–10",
    durationMinutes: 5,
    totalSeconds: 300,
    summary: script.summary,
    focus: script.focus,
    prompts: [
      "“Circle the nucleus”",
      "“Highlight the mitochondria”",
      "“Underline the cell membrane”",
      "“Locate rough ER & ribosomes”",
    ],
    audioPath: "/class-audio/cell-v1.mp3",
    assetFolder: "/src/classes/cell/assets",
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

export default cellClass;
