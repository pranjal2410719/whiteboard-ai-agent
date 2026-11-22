import type { ClassDefinition, ClassKey } from "./types";
import { heartDiagramClass } from "./heart-diagram";
import { circuitDiagramClass } from "./circuit-diagram";
import { pythagorasClass } from "./pythagoras";
import { humanCellClass } from "./human-cell";

export * from "./types";
export * from "./helpers";
export { heartDiagramClass, heartRegions } from "./heart-diagram";
export { circuitDiagramClass, circuitRegions } from "./circuit-diagram";
export { pythagorasClass, pythagorasRegions } from "./pythagoras";
export { humanCellClass, cellRegions } from "./human-cell";

export const classesRegistry: Record<ClassKey, ClassDefinition> = {
  "heart-diagram": heartDiagramClass,
  "circuit-diagram": circuitDiagramClass,
  "pythagoras": pythagorasClass,
  "human-cell": humanCellClass,
};

export const classKeys: ClassKey[] = [
  "heart-diagram",
  "circuit-diagram",
  "pythagoras",
  "human-cell",
];

export function isClassKey(key: string): key is ClassKey {
  return key in classesRegistry;
}

export function getClass(key: string): ClassDefinition | undefined {
  if (key === "cell-diagram") return classesRegistry["human-cell"];
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
