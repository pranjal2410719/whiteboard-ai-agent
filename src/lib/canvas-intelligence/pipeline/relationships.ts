import type { RelationshipType, SemanticElement, SemanticRelationship } from "../types";

export interface RelationshipDefinition {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label?: string;
  notes?: string;
  directional?: boolean;
}

export class RelationshipMapper {
  /**
   * Adds a verified semantic relationship between two elements, enforcing referential integrity.
   */
  static addRelationship(
    elements: SemanticElement[],
    definition: RelationshipDefinition
  ): { success: boolean; error?: string } {
    const source = elements.find(el => el.id === definition.sourceId);
    if (!source) {
      return {
        success: false,
        error: `Source element '${definition.sourceId}' does not exist in elements list.`,
      };
    }

    const target = elements.find(el => el.id === definition.targetId);
    if (!target) {
      return {
        success: false,
        error: `Target element '${definition.targetId}' does not exist in elements list.`,
      };
    }

    if (definition.sourceId === definition.targetId) {
      return {
        success: false,
        error: `Cannot create self-referential relationship on element '${definition.sourceId}'.`,
      };
    }

    // Check for duplicate relationship
    const exists = source.relationships.some(
      r => r.targetId === definition.targetId && r.type === definition.type
    );
    if (exists) {
      return { success: true }; // Already mapped
    }

    const rel: SemanticRelationship = {
      type: definition.type,
      targetId: definition.targetId,
      label: definition.label,
      notes: definition.notes,
      directional: definition.directional ?? this.isDirectionalType(definition.type),
    };

    source.relationships.push(rel);
    return { success: true };
  }

  /**
   * Connects a sequence of elements in an educational cycle or flow chain.
   * E.g. [A -> B -> C -> D -> A]
   */
  static mapCycle(
    elements: SemanticElement[],
    orderedElementIds: string[],
    relationshipType: RelationshipType = "flows_to",
    labelGenerator?: (from: string, to: string) => string
  ): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < orderedElementIds.length; i++) {
      const sourceId = orderedElementIds[i];
      const targetId = orderedElementIds[(i + 1) % orderedElementIds.length];
      const label = labelGenerator ? labelGenerator(sourceId, targetId) : undefined;

      const res = this.addRelationship(elements, {
        sourceId,
        targetId,
        type: relationshipType,
        label,
        directional: true,
      });

      if (!res.success && res.error) {
        errors.push(res.error);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates all relationships across an entire element list.
   */
  static validateAllRelationships(elements: SemanticElement[]): {
    valid: boolean;
    errors: string[];
    validCount: number;
  } {
    const errors: string[] = [];
    const idSet = new Set(elements.map(e => e.id));
    let validCount = 0;

    for (const el of elements) {
      for (const rel of el.relationships) {
        if (!idSet.has(rel.targetId)) {
          errors.push(
            `Element '${el.id}' references non-existent targetId '${rel.targetId}' in relationship '${rel.type}'.`
          );
        } else if (rel.targetId === el.id) {
          errors.push(`Element '${el.id}' has illegal self-referential relationship '${rel.type}'.`);
        } else {
          validCount++;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      validCount,
    };
  }

  private static isDirectionalType(type: RelationshipType): boolean {
    return [
      "flows_to",
      "powers",
      "exerts",
      "opposes",
      "transforms_to",
      "cycles_to",
      "branches_into",
    ].includes(type);
  }
}
