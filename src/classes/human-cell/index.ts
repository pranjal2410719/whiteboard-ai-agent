import type { ClassDefinition } from "../types";
import type { SupportedLanguage } from "@/lib/types";
import scriptEn from "./script.json";
import scriptHi from "./script-hi.json";
import scriptHinglish from "./script-hinglish.json";
import { cellRegions, cellBoardRegions } from "./intelligence";
import { cellInitialBoard, getCellInitialBoard, buildCellScenes, cellSceneBoards, cellImg, mitochondriaImg, buildMitochondriaBoard } from "./board";

export { cellRegions, cellBoardRegions, mitochondriaDetailedRegions, mitochondriaBoardRegions, getPreLabelNamingConventionLayout } from "./intelligence";
export { cellInitialBoard, getCellInitialBoard, buildCellScenes, cellSceneBoards, cellSceneBoardsEn, cellSceneBoardsHi, cellImg, mitochondriaImg, buildMitochondriaBoard } from "./board";
export { default as cellScript } from "./script.json";
export { default as cellScriptHi } from "./script-hi.json";
export { default as cellScriptHinglish } from "./script-hinglish.json";

export function getHumanCellClass(lang: SupportedLanguage = "en"): ClassDefinition {
  const scriptData = lang === "hi" ? scriptHi : lang === "hinglish" ? scriptHinglish : scriptEn;
  const audioPath = lang === "hi"
    ? "/class-audio/human-cell-hi.mp3"
    : lang === "hinglish"
    ? "/class-audio/human-cell-hinglish.mp3"
    : "/class-audio/human-cell-v2.mp3";

  return {
    metadata: {
      key: "human-cell",
      title: scriptData.title,
      subject: lang === "hi" ? "जीव विज्ञान" : "Biology",
      grade: lang === "hi" ? "कक्षा 9–10" : "Class 9–10",
      durationMinutes: 2,
      totalSeconds: 120,
      summary: scriptData.summary,
      focus: scriptData.focus,
      prompts: lang === "hi" ? [
        "“केंद्रक पर गोला बनाएं”",
        "“माइटोकॉन्ड्रिया को हाइलाइट करें”",
        "“कोशिका झिल्ली को रेखांकित करें”",
        "“खुरदरी ईआर और राइबोसोम खोजें”",
      ] : [
        "“Circle the nucleus”",
        "“Highlight the mitochondria”",
        "“Underline the cell membrane”",
        "“Locate rough ER & ribosomes”",
      ],
      audioPath,
      assetFolder: "/src/classes/human-cell/assets",
    },
    script: scriptData as any,
    initialBoard: getCellInitialBoard(lang),
    scenes: buildCellScenes(lang),
    regions: cellBoardRegions,
    notes: {
      notes: scriptData.notes,
      mistake: scriptData.mistake,
      practice: scriptData.practice,
    },
  };
}

export const humanCellClass: ClassDefinition = getHumanCellClass("en");

export default humanCellClass;
