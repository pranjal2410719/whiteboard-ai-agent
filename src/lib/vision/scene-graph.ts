import type {
  NormalizedBoundingBox,
  SpatialRelationship,
  VisualObject,
  VisualScene,
} from "./types";

const normalize = (val: string) => val.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Calculates directional or containment relationship between two normalized boxes.
 */
export function computeSpatialRelation(
  a: NormalizedBoundingBox,
  b: NormalizedBoundingBox
): string {
  const aCenterY = (a.ymin + a.ymax) / 2;
  const aCenterX = (a.xmin + a.xmax) / 2;
  const bCenterY = (b.ymin + b.ymax) / 2;
  const bCenterX = (b.xmin + b.xmax) / 2;

  // Check containment
  if (a.xmin <= b.xmin && a.xmax >= b.xmax && a.ymin <= b.ymin && a.ymax >= b.ymax) {
    return "contains";
  }
  if (b.xmin <= a.xmin && b.xmax >= a.xmax && b.ymin <= a.ymin && b.ymax >= a.ymax) {
    return "inside";
  }

  // Directional
  const dy = bCenterY - aCenterY;
  const dx = bCenterX - aCenterX;

  if (Math.abs(dy) > Math.abs(dx)) {
    return dy > 0 ? "above" : "below";
  } else {
    return dx > 0 ? "left_of" : "right_of";
  }
}

/**
 * Visual Scene Graph Model.
 */
export class VisualSceneGraph {
  public scene: VisualScene;

  constructor(scene: VisualScene) {
    this.scene = scene;
  }

  /**
   * Finds an object in the scene graph by exact name, normalized name, or alias.
   */
  public findObject(query: string): VisualObject | null {
    if (!query) return null;
    const normQuery = normalize(query);
    if (!normQuery) return null;

    // 1. Exact or normalized label match
    for (const obj of this.scene.objects) {
      if (normalize(obj.label) === normQuery || normalize(obj.id) === normQuery) {
        return obj;
      }
    }

    // 2. Check aliases
    for (const obj of this.scene.objects) {
      if (obj.aliases?.some((alias) => normalize(alias) === normQuery)) {
        return obj;
      }
    }

    // 3. Substring inclusion
    for (const obj of this.scene.objects) {
      const normObjLabel = normalize(obj.label);
      if (normObjLabel.includes(normQuery) || normQuery.includes(normObjLabel)) {
        return obj;
      }
      if (obj.aliases?.some((a) => normalize(a).includes(normQuery) || normQuery.includes(normalize(a)))) {
        return obj;
      }
    }

    return null;
  }

  /**
   * Finds all objects that have a relationship with the given target object ID.
   */
  public findRelatedObjects(objectId: string): Array<{ object: VisualObject; relation: string }> {
    const results: Array<{ object: VisualObject; relation: string }> = [];
    const directRelations = this.scene.relationships.filter(
      (r) => r.sourceId === objectId || r.targetId === objectId
    );

    for (const rel of directRelations) {
      const otherId = rel.sourceId === objectId ? rel.targetId : rel.sourceId;
      const otherObj = this.scene.objects.find((o) => o.id === otherId);
      if (otherObj) {
        results.push({
          object: otherObj,
          relation: rel.relation,
        });
      }
    }

    return results;
  }

  /**
   * Automatically computes and enriches pairwise spatial relationships for all objects.
   */
  public enrichSpatialRelationships(): void {
    const relationships: SpatialRelationship[] = [...this.scene.relationships];

    for (let i = 0; i < this.scene.objects.length; i++) {
      for (let j = i + 1; j < this.scene.objects.length; j++) {
        const objA = this.scene.objects[i];
        const objB = this.scene.objects[j];

        const relAB = computeSpatialRelation(objA.boundingBox, objB.boundingBox);
        relationships.push({
          sourceId: objA.id,
          targetId: objB.id,
          relation: relAB,
        });
      }
    }

    this.scene.relationships = relationships;
  }
}
