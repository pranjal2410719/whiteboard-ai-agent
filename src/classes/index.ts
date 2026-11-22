import type { ClassDefinition, ClassKey } from "./types";
import { humanCellClass, cellRegions, cellBoardRegions } from "./human-cell";

export * from "./types";
export * from "./helpers";
export { humanCellClass, cellRegions, cellBoardRegions } from "./human-cell";

export const classesRegistry: Record<ClassKey, ClassDefinition> = {
  "human-cell": humanCellClass,
};

export const classKeys: ClassKey[] = [
  "human-cell",
];

export function isClassKey(key: string): key is ClassKey {
  return key in classesRegistry;
}

export function getClass(key: string): ClassDefinition | undefined {
  if (key === "cell-diagram" || key === "human-cell") return classesRegistry["human-cell"];
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
