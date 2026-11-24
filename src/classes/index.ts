import type { ClassDefinition, ClassKey } from "./types";
import type { SupportedLanguage } from "@/lib/types";
import { humanCellClass, getHumanCellClass, cellRegions, cellBoardRegions } from "./human-cell";
import { trigonometryClass, getTrigonometryClass, trigRegions, trigBoardRegions } from "./trigonometry";

export * from "./types";
export * from "./helpers";
export {
  humanCellClass,
  getHumanCellClass,
  cellRegions,
  cellBoardRegions,
  mitochondriaDetailedRegions,
  mitochondriaBoardRegions,
  getPreLabelNamingConventionLayout,
  cellImg,
  mitochondriaImg,
  buildMitochondriaBoard,
  cellInitialBoard,
  getCellInitialBoard,
  cellSceneBoards,
  cellSceneBoardsEn,
  cellSceneBoardsHi,
  buildCellScenes,
} from "./human-cell";

export {
  trigonometryClass,
  getTrigonometryClass,
  trigRegions,
  trigBoardRegions,
  trigInitialBoard,
  getTrigInitialBoard,
  buildTrigScenes,
  trigSceneBoards,
  trigSceneBoardsEn,
  trigSceneBoardsHi,
  trigImg,
  TRIG_IMAGE_LAYOUT,
} from "./trigonometry";

export const classesRegistry: Record<ClassKey, ClassDefinition> = {
  "human-cell": humanCellClass,
  "trigonometry": trigonometryClass,
};

export const classKeys: ClassKey[] = [
  "human-cell",
  "trigonometry",
];

export const CANONICAL_DEMO_KEYS = new Set<string>(["human-cell", "trigonometry"]);

export function isClassKey(key: string): key is ClassKey {
  return key in classesRegistry;
}

export function getClass(key: string, language: SupportedLanguage = "en"): ClassDefinition | undefined {
  if (key === "cell-diagram" || key === "human-cell") return getHumanCellClass(language);
  if (key === "trigonometry-diagram" || key === "trigonometry") return getTrigonometryClass(language);
  return classesRegistry[key as ClassKey];
}

export function getAllClasses(language: SupportedLanguage = "en"): ClassDefinition[] {
  return classKeys.map(k => getClass(k, language)!);
}

export function getClassInitialBoard(key: string, language: SupportedLanguage = "en") {
  const cls = getClass(key, language);
  return cls ? cls.initialBoard : undefined;
}

export function getClassScenes(key: string, language: SupportedLanguage = "en") {
  const cls = getClass(key, language);
  return cls ? cls.scenes : [];
}

export function getClassRegions(key: string, language: SupportedLanguage = "en") {
  const cls = getClass(key, language);
  return cls ? cls.regions || [] : [];
}

export function getClassScript(key: string, language: SupportedLanguage = "en") {
  const cls = getClass(key, language);
  return cls ? cls.script : undefined;
}
