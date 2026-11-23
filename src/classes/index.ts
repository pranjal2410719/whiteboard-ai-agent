import type { ClassDefinition, ClassKey } from "./types";
import { humanCellClass, cellRegions, cellBoardRegions } from "./human-cell";
import { trigonometryClass, trigRegions, trigBoardRegions } from "./trigonometry";
import { cellClass, cellRegions as animalCellRegions, cellBoardRegions as animalCellBoardRegions } from "./cell";

export * from "./types";
export * from "./helpers";
export {
  humanCellClass,
  cellRegions,
  cellBoardRegions,
  mitochondriaDetailedRegions,
  mitochondriaBoardRegions,
  cellImg,
  mitochondriaImg,
  buildMitochondriaBoard,
} from "./human-cell";

export {
  cellClass,
  cellClass as animalCellClass,
  cellBaseImg,
  cellInitialBoard as animalCellInitialBoard,
  cellSceneBoards as animalCellSceneBoards,
} from "./cell";

export {
  trigonometryClass,
  trigRegions,
  trigBoardRegions,
  trigInitialBoard,
  buildTrigScenes,
  trigSceneBoards,
  trigImg,
  TRIG_IMAGE_LAYOUT,
} from "./trigonometry";

export const classesRegistry: Record<ClassKey, ClassDefinition> = {
  "human-cell": humanCellClass,
  "trigonometry": trigonometryClass,
  "cell": cellClass,
};

export const classKeys: ClassKey[] = [
  "human-cell",
  "trigonometry",
  "cell",
];

export const CANONICAL_DEMO_KEYS = new Set<string>(["human-cell", "trigonometry", "cell"]);

export function isClassKey(key: string): key is ClassKey {
  return key in classesRegistry;
}

export function getClass(key: string): ClassDefinition | undefined {
  if (key === "cell-diagram" || key === "human-cell") return classesRegistry["human-cell"];
  if (key === "trigonometry-diagram" || key === "trigonometry") return classesRegistry["trigonometry"];
  if (key === "cell" || key === "animal-cell" || key === "animal_cell") return classesRegistry["cell"];
  return classesRegistry[key as ClassKey];
}

export function getAllClasses(): ClassDefinition[] {
  return classKeys.map(k => classesRegistry[k]);
}

export function getClassInitialBoard(key: string) {
  const cls = getClass(key);
  return cls ? cls.initialBoard : undefined;
}

export function getClassScenes(key: string) {
  const cls = getClass(key);
  return cls ? cls.scenes : [];
}

export function getClassRegions(key: string) {
  const cls = getClass(key);
  return cls ? cls.regions || [] : [];
}

export function getClassScript(key: string) {
  const cls = getClass(key);
  return cls ? cls.script : undefined;
}
