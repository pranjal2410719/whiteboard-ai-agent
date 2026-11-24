import type { ClassDefinition } from "../types";
import type { SupportedLanguage } from "@/lib/types";
import scriptEn from "./script.json";
import scriptHi from "./script-hi.json";
import scriptHinglish from "./script-hinglish.json";
import { trigRegions, trigBoardRegions, TRIG_IMAGE_LAYOUT } from "./intelligence";
import { trigInitialBoard, getTrigInitialBoard, buildTrigScenes, trigSceneBoards, trigImg } from "./board";

export { trigRegions, trigBoardRegions, TRIG_IMAGE_LAYOUT } from "./intelligence";
export { trigInitialBoard, getTrigInitialBoard, buildTrigScenes, trigSceneBoards, trigSceneBoardsEn, trigSceneBoardsHi, trigImg } from "./board";
export { default as trigScript } from "./script.json";
export { default as trigScriptHi } from "./script-hi.json";
export { default as trigScriptHinglish } from "./script-hinglish.json";

export function getTrigonometryClass(lang: SupportedLanguage = "en"): ClassDefinition {
  const scriptData = lang === "hi" ? scriptHi : lang === "hinglish" ? scriptHinglish : scriptEn;
  const audioPath = lang === "hi"
    ? "/class-audio/trigonometry-hi.mp3"
    : lang === "hinglish"
    ? "/class-audio/trigonometry-hinglish.mp3"
    : "/class-audio/trigonometry-v2.mp3";

  return {
    metadata: {
      key: "trigonometry",
      title: scriptData.title,
      subject: lang === "hi" ? "गणित" : "Mathematics",
      grade: lang === "hi" ? "कक्षा 9–11" : "Class 9–11",
      durationMinutes: 2,
      totalSeconds: 120,
      summary: scriptData.summary,
      focus: scriptData.focus,
      prompts: lang === "hi" ? [
        "“कर्ण को हाइलाइट करें”",
        "“कोण थीटा पर गोला बनाएं”",
        "“SOH-CAH-TOA समझाएं”",
        "“लम्ब भुजा कहाँ है?”",
        "“पाइथागोरस सर्वसमिका दिखाएं”",
      ] : [
        "“Highlight the hypotenuse”",
        "“Circle angle theta”",
        "“Explain SOH-CAH-TOA”",
        "“Where is the opposite side?”",
        "“Show the Pythagorean identity”",
      ],
      audioPath,
      assetFolder: "/src/classes/trigonometry/assets",
    },
    script: scriptData as any,
    initialBoard: getTrigInitialBoard(lang),
    scenes: buildTrigScenes(lang),
    regions: trigBoardRegions,
    notes: {
      notes: scriptData.notes,
      mistake: scriptData.mistake,
      practice: scriptData.practice,
    },
  };
}

export const trigonometryClass: ClassDefinition = getTrigonometryClass("en");

export default trigonometryClass;
