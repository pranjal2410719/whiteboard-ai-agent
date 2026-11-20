import type { BoardMark, BoardPage } from "../types";
import { CanvasAssetRegistry } from "../canvas-intelligence/registry";
import { CanvasIntelligenceEngine } from "../canvas-intelligence/engine";
import type { AssetCanvasMap } from "../canvas-intelligence/types";
import type { TeachingAction } from "./types";

export class ActionDispatcher {
  /**
   * Extracts teaching action tags from raw LLM text (e.g. [ACTION:highlight element="right-atrium"])
   * and returns the cleaned verbal narration alongside structured actions.
   */
  static parseActionsFromText(rawText: string): { narrationText: string; actions: TeachingAction[] } {
    const actions: TeachingAction[] = [];
    const actionRegex = /\[ACTION:([a-z_]+)([^\]]*)\]/gi;

    const narrationText = rawText.replace(actionRegex, (match, actionType, attrString) => {
      const type = actionType.toLowerCase().trim() as TeachingAction["type"];
      const action: TeachingAction = { type };

      // Parse element="..." or element='...'
      const elemMatch = attrString.match(/element=["']([^"']+)["']/i);
      if (elemMatch) action.elementId = elemMatch[1].trim();

      // Parse from="..."
      const fromMatch = attrString.match(/from=["']([^"']+)["']/i);
      if (fromMatch) action.elementId = fromMatch[1].trim();

      // Parse to="..."
      const toMatch = attrString.match(/to=["']([^"']+)["']/i);
      if (toMatch) action.toElementId = toMatch[1].trim();

      // Parse text="..." or label="..."
      const textMatch = attrString.match(/(?:text|label)=["']([^"']+)["']/i);
      if (textMatch) action.text = textMatch[1].trim();

      // Parse color="..."
      const colorMatch = attrString.match(/color=["']([^"']+)["']/i);
      if (colorMatch) action.color = colorMatch[1].trim();

      actions.push(action);
      return ""; // Strip from narration
    }).replace(/\n{3,}/g, "\n\n").trim();

    return { narrationText, actions };
  }

  /**
   * Converts structured teaching actions into verified BoardMarks anchored to the classroom asset.
   */
  static dispatchActions(
    actions: TeachingAction[],
    page: BoardPage,
    assetKey?: string | null
  ): { marks: BoardMark[]; executedActions: TeachingAction[] } {
    if (!actions.length) return { marks: [], executedActions: [] };

    const imageMark = [...page.marks, ...page.ink].find(m => m.type === "image");
    const assetId = assetKey || imageMark?.src || imageMark?.alt || "";
    const assetMap = CanvasAssetRegistry.getAsset(assetId);

    const placement = {
      x: imageMark?.x ?? 490,
      y: imageMark?.y ?? 32,
      w: imageMark?.w ?? 450,
      h: imageMark?.h ?? 280
    };

    const engine = assetMap ? new CanvasIntelligenceEngine(assetMap, placement) : null;
    const generatedMarks: BoardMark[] = [];
    const executedActions: TeachingAction[] = [];

    for (const act of actions) {
      if (engine && act.elementId) {
        if (act.type === "highlight") {
          const res = engine.executeAction({
            action: "highlight",
            targetElementId: act.elementId,
            color: act.color || "#fef08a",
            style: "fill"
          });
          if (res.success && res.marks) {
            generatedMarks.push(...res.marks);
            executedActions.push(act);
          }
        } else if (act.type === "circle") {
          const res = engine.executeAction({
            action: "circle",
            targetElementId: act.elementId,
            color: act.color || "#c0504d"
          });
          if (res.success && res.marks) {
            generatedMarks.push(...res.marks);
            executedActions.push(act);
          }
        } else if (act.type === "arrow" && act.toElementId) {
          const res = engine.executeAction({
            action: "arrow",
            fromElementId: act.elementId,
            targetElementId: act.toElementId,
            label: act.text,
            color: act.color || "#3b805c"
          });
          if (res.success && res.marks) {
            generatedMarks.push(...res.marks);
            executedActions.push(act);
          }
        } else if (act.type === "label" && act.text) {
          const res = engine.executeAction({
            action: "label",
            targetElementId: act.elementId,
            text: act.text
          });
          if (res.success && res.marks) {
            generatedMarks.push(...res.marks);
            executedActions.push(act);
          }
        } else if (act.type === "annotate") {
          const res = engine.executeAction({
            action: "annotate",
            targetElementId: act.elementId,
            text: act.text
          });
          if (res.success && res.marks) {
            generatedMarks.push(...res.marks);
            executedActions.push(act);
          }
        }
      } else {
        // Fallback: match region by ID from page.regions
        const reg = page.regions?.find(r => r.id === act.elementId || r.aliases?.includes(act.elementId || ""));
        if (reg) {
          if (act.type === "highlight") {
            generatedMarks.push({
              type: "rect",
              x: reg.x - 4,
              y: reg.y - 4,
              w: reg.w + 8,
              h: reg.h + 8,
              fill: act.color || "#f5d76e",
              color: act.color || "#f5d76e",
              opacity: 0.45,
              annotation: true,
              layer: "teacher-annotations"
            });
            executedActions.push(act);
          } else if (act.type === "circle") {
            generatedMarks.push({
              type: "ellipse",
              x: reg.x + reg.w / 2,
              y: reg.y + reg.h / 2,
              w: reg.w / 2 + 8,
              h: reg.h / 2 + 8,
              color: act.color || "#c0504d",
              fill: "none",
              strokeWidth: 2.8,
              annotation: true,
              layer: "teacher-annotations"
            });
            executedActions.push(act);
          }
        }
      }
    }

    return { marks: generatedMarks, executedActions };
  }
}
