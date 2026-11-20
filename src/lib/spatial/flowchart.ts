/**
 * Flowchart Manager & Interactive Demonstration Engine
 * Ported from Python whiteboard_tutor_agent/flowchart_manager.py
 * Integrates directly with SVG Whiteboard BoardMark generators.
 */

import type { BoardMark } from "../types";
import { SpatialContext } from "./context";
import {
  BoundingBox,
  Flowchart,
  FlowchartEdgeDef,
  FlowchartNodeDef,
  SemanticElement,
} from "./types";

export interface SpatialCanvasAdapter {
  addElements(elements: any[]): any;
  deleteElement(id: string): any;
  add_elements?(elements: any[]): any;
  delete_element?(id: string): any;
}

class InMemoryCanvasAdapter implements SpatialCanvasAdapter {
  elements: Map<string, any> = new Map();

  addElements(elements: any[]): any {
    for (const el of elements) {
      if (el && el.id) this.elements.set(el.id, el);
    }
    return { status: "ok", count: elements.length };
  }

  deleteElement(id: string): any {
    this.elements.delete(id);
    return { status: "ok" };
  }

  add_elements(elements: any[]): any {
    return this.addElements(elements);
  }

  delete_element(id: string): any {
    return this.deleteElement(id);
  }
}

/**
 * Helper to build an SVG arrow path string with arrowhead.
 */
export function buildSvgArrowPath(x1: number, y1: number, x2: number, y2: number): string {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const t = (a: number) => Math.round(a * 10) / 10;
  const arrowSize = 12;
  const spread = 0.46;
  const tip1X = t(x2 - arrowSize * Math.cos(angle - spread));
  const tip1Y = t(y2 - arrowSize * Math.sin(angle - spread));
  const tip2X = t(x2 - arrowSize * Math.cos(angle + spread));
  const tip2Y = t(y2 - arrowSize * Math.sin(angle + spread));
  return `M${t(x1)} ${t(y1)} L${t(x2)} ${t(y2)} M${tip1X} ${tip1Y} L${t(x2)} ${t(y2)} L${tip2X} ${tip2Y}`;
}

export class FlowchartManager {
  canvas: SpatialCanvasAdapter;
  context: SpatialContext;
  flowcharts: Record<string, Flowchart>;
  nodePositions: Map<string, { x: number; y: number; w: number; h: number }>;

  constructor(
    canvasClient?: SpatialCanvasAdapter | null,
    context?: SpatialContext | null
  ) {
    this.canvas = canvasClient || new InMemoryCanvasAdapter();
    this.context = context || new SpatialContext();
    this.flowcharts = {};
    this.nodePositions = new Map();
  }

  // ---------------------------------------------------------------------------
  // Flowchart Generation & Layout
  // ---------------------------------------------------------------------------

  createFlowchart(
    flowchartId: string,
    title: string,
    nodes: FlowchartNodeDef[],
    edges: FlowchartEdgeDef[],
    startX: number = 380.0,
    startY: number = 60.0,
    verticalGap: number = 50.0
  ): Flowchart {
    const fc = new Flowchart(flowchartId, title);
    const canvasElements: Array<Record<string, any>> = [];

    // 1. Flowchart Header Banner
    const bannerW = 640.0;
    const bannerH = 42.0;
    const bannerElem: Record<string, any> = {
      id: `${flowchartId}_banner`,
      type: "rectangle",
      x: startX - 100.0,
      y: startY,
      width: bannerW,
      height: bannerH,
      text: `FLOWCHART: ${title.toUpperCase()}`,
      backgroundColor: "#f8f9fa",
      strokeColor: "#343a40",
      fontSize: 15,
      flowchartId,
    };
    canvasElements.push(bannerElem);
    let currentY = startY + bannerH + 35.0;

    // 2. Node Placement Layout
    const nodePositions: Record<string, [number, number, number, number]> = {};

    for (let idx = 0; idx < nodes.length; idx++) {
      const nodeDef = nodes[idx];
      const shapeType = nodeDef.nodeType === "decision" ? "diamond" : "rectangle";

      // Auto-expand node dimensions if initial dimensions are smaller than text requirements
      const fontSize = 13;
      const lines = (nodeDef.text || "").split("\n");
      const maxLineLen = Math.max(...lines.map(l => l.length), 1);
      const estCharWidth = fontSize * 0.65;
      const neededTextW = maxLineLen * estCharWidth;
      const neededTextH = lines.length * (fontSize * 1.4);

      // Diamond inscribed rhombus is narrower than outer bounding box; needs ~1.45x width
      const minW = shapeType === "diamond" ? Math.max(nodeDef.width, neededTextW * 1.45 + 36) : Math.max(nodeDef.width, neededTextW + 28);
      const minH = shapeType === "diamond" ? Math.max(nodeDef.height, Math.max(60, neededTextH * 1.45 + 28)) : Math.max(nodeDef.height, neededTextH + 20);

      const effectiveW = Math.round(Math.max(nodeDef.width, minW) * 10) / 10;
      const effectiveH = Math.round(Math.max(nodeDef.height, minH) * 10) / 10;

      const nodeX = Math.round((startX + 100.0 - effectiveW / 2.0) * 10) / 10;
      const nodeY = Math.round(currentY * 10) / 10;

      const nodeElem: Record<string, any> = {
        id: nodeDef.id,
        type: shapeType,
        x: nodeX,
        y: nodeY,
        width: effectiveW,
        height: effectiveH,
        text: nodeDef.text,
        backgroundColor: nodeDef.bgColor,
        strokeColor: nodeDef.strokeColor,
        strokeWidth: 2.0,
        fontSize: 13,
        flowchartId,
      };

      if (["start", "end"].includes(nodeDef.nodeType)) {
        nodeElem.roundness = { type: 3 }; // Pill shape
      }

      canvasElements.push(nodeElem);
      fc.nodeIds.push(nodeDef.id);
      nodePositions[nodeDef.id] = [nodeX, nodeY, effectiveW, effectiveH];
      this.nodePositions.set(nodeDef.id, { x: nodeX, y: nodeY, w: effectiveW, h: effectiveH });

      // Register as SemanticElement in SpatialContext
      const semEl = new SemanticElement(
        nodeDef.id,
        shapeType,
        nodeX,
        nodeY,
        effectiveW,
        effectiveH,
        nodeDef.text,
        `flowchart_${nodeDef.nodeType}_node`,
        nodeDef.purpose,
        flowchartId,
        idx,
        nodeElem
      );
      this.context.registerSemanticElement(semEl);

      currentY += effectiveH + verticalGap;
    }

    // 3. Directed Edge Connectors
    for (let eIdx = 0; eIdx < edges.length; eIdx++) {
      const edgeDef = edges[eIdx];
      if (!nodePositions[edgeDef.fromNode] || !nodePositions[edgeDef.toNode]) {
        continue;
      }

      const [x1, y1, w1, h1] = nodePositions[edgeDef.fromNode];
      const [x2, y2, w2, h2] = nodePositions[edgeDef.toNode];

      // Smart edge routing using geometric anchor selection
      let startPt: [number, number];
      let endPt: [number, number];

      if (y2 < y1) {
        // Upward edge
        startPt = [x1 + w1 / 2.0, y1];
        endPt = [x2 + w2 / 2.0, y2 + h2];
      } else if (x2 > x1 + w1 + 10) {
        // Lateral right edge
        startPt = [x1 + w1, y1 + h1 / 2.0];
        endPt = [x2, y2 + h2 / 2.0];
      } else if (x2 + w2 < x1 - 10) {
        // Lateral left edge
        startPt = [x1, y1 + h1 / 2.0];
        endPt = [x2 + w2, y2 + h2 / 2.0];
      } else {
        // Default downward flow
        startPt = [x1 + w1 / 2.0, y1 + h1];
        endPt = [x2 + w2 / 2.0, y2];
      }

      const dx = endPt[0] - startPt[0];
      const dy = endPt[1] - startPt[1];

      const edgeId = `${flowchartId}_edge_${eIdx}`;
      const arrowElem: Record<string, any> = {
        id: edgeId,
        type: "arrow",
        x: startPt[0],
        y: startPt[1],
        points: [[0, 0], [dx, dy]],
        strokeColor: edgeDef.color,
        strokeWidth: 2.0,
        endArrowhead: "arrow",
        start: { id: edgeDef.fromNode },
        end: { id: edgeDef.toNode },
        flowchartId,
      };
      if (edgeDef.label) {
        arrowElem.label = { text: edgeDef.label };
      }

      canvasElements.push(arrowElem);
      fc.edgeIds.push(edgeId);
    }

    // 4. Sync elements to live canvas and spatial context
    if (typeof this.canvas.addElements === "function") {
      this.canvas.addElements(canvasElements);
    } else if (typeof this.canvas.add_elements === "function") {
      this.canvas.add_elements(canvasElements);
    }
    this.context.addElements(canvasElements);

    // Calculate bounding box of entire flowchart
    const allXs = canvasElements.map(el => Number(el.x || 0));
    const allYs = canvasElements.map(el => Number(el.y || 0));
    const allRights = canvasElements.map(el => Number(el.x || 0) + Number(el.width || el.w || 0));
    const allBottoms = canvasElements.map(el => Number(el.y || 0) + Number(el.height || el.h || 0));

    fc.bounds = new BoundingBox(
      Math.min(...allXs),
      Math.min(...allYs),
      Math.max(...allRights) - Math.min(...allXs),
      Math.max(...allBottoms) - Math.min(...allYs)
    );

    this.flowcharts[flowchartId] = fc;
    return fc;
  }

  create_flowchart(
    flowchartId: string,
    title: string,
    nodes: FlowchartNodeDef[],
    edges: FlowchartEdgeDef[],
    startX: number = 380.0,
    startY: number = 60.0,
    verticalGap: number = 50.0
  ): Flowchart {
    return this.createFlowchart(flowchartId, title, nodes, edges, startX, startY, verticalGap);
  }

  // ---------------------------------------------------------------------------
  // Context Retrieval for Flowchart & Nodes
  // ---------------------------------------------------------------------------

  getFlowchart(flowchartId: string): Flowchart | null {
    return this.flowcharts[flowchartId] || null;
  }

  get_flowchart(flowchartId: string): Flowchart | null {
    return this.getFlowchart(flowchartId);
  }

  getFirstNode(flowchartId: string): SemanticElement | null {
    const fc = this.getFlowchart(flowchartId);
    if (!fc || !fc.nodeIds.length) return null;
    return this.context.getSemanticElement(fc.nodeIds[0]);
  }

  get_first_node(flowchartId: string): SemanticElement | null {
    return this.getFirstNode(flowchartId);
  }

  getNode(flowchartId: string, nodeQuery: string | number): SemanticElement | null {
    const fc = this.getFlowchart(flowchartId);
    if (!fc) return null;

    // By integer index
    if (typeof nodeQuery === "number") {
      if (nodeQuery >= 0 && nodeQuery < fc.nodeIds.length) {
        return this.context.getSemanticElement(fc.nodeIds[nodeQuery]);
      }
      return null;
    }

    const q = String(nodeQuery).trim().toLowerCase();
    if (["first", "start", "root", "initial"].includes(q)) {
      return this.getFirstNode(flowchartId);
    }
    if (["last", "end", "terminal"].includes(q)) {
      return this.context.getSemanticElement(fc.nodeIds[fc.nodeIds.length - 1]);
    }

    // By exact ID
    if (fc.nodeIds.includes(nodeQuery)) {
      return this.context.getSemanticElement(nodeQuery);
    }

    // By text or role search
    for (const nid of fc.nodeIds) {
      const sem = this.context.getSemanticElement(nid);
      if (sem) {
        if (sem.content.toLowerCase().includes(q) || sem.role.toLowerCase().includes(q)) {
          return sem;
        }
      }
    }

    return null;
  }

  get_node(flowchartId: string, nodeQuery: string | number): SemanticElement | null {
    return this.getNode(flowchartId, nodeQuery);
  }

  inspectFlowchartContext(flowchartId: string): Record<string, any> {
    const fc = this.getFlowchart(flowchartId);
    if (!fc) {
      return { success: false, error: `Flowchart '${flowchartId}' not found.` };
    }

    const nodeContexts = [];
    for (const nid of fc.nodeIds) {
      const sem = this.context.getSemanticElement(nid);
      if (sem) {
        nodeContexts.push(sem.explainContext());
      }
    }

    return {
      success: true,
      flowchart_id: fc.id,
      title: fc.title,
      where_is_flowchart: {
        bounds: {
          x: fc.bounds ? fc.bounds.x : 0,
          y: fc.bounds ? fc.bounds.y : 0,
          width: fc.bounds ? fc.bounds.width : 0,
          height: fc.bounds ? fc.bounds.height : 0,
        },
        total_nodes: fc.nodeIds.length,
        total_connectors: fc.edgeIds.length,
      },
      nodes: nodeContexts,
    };
  }

  inspect_flowchart_context(flowchartId: string): Record<string, any> {
    return this.inspectFlowchartContext(flowchartId);
  }

  // ---------------------------------------------------------------------------
  // Precision Highlighting & Demonstration
  // ---------------------------------------------------------------------------

  highlightNode(
    flowchartId: string,
    nodeQuery: string | number,
    style: string = "light",
    color?: string
  ): Record<string, any> {
    const sem = this.getNode(flowchartId, nodeQuery);
    if (!sem) {
      return { success: false, error: `Node '${nodeQuery}' not found in flowchart '${flowchartId}'` };
    }

    const s = style.toLowerCase();
    const createdElements: Array<Record<string, any>> = [];
    const timestamp = Date.now();

    // 1. UNDERLINE (Placed directly under the inner text bounds)
    if (s === "underline" || s === "all") {
      const tb = sem.textBounds;
      const cColor = color || "#fab005";
      const lineY = tb ? tb.bottom + 4 : sem.bottom - 8;
      const lineX = tb ? tb.x : sem.x + 10;
      const lineW = tb ? tb.width : sem.width - 20;

      const undElem: Record<string, any> = {
        id: `und_${sem.id}_${timestamp}`,
        type: "line",
        x: lineX,
        y: lineY,
        points: [[0, 0], [lineW, 0]],
        strokeColor: cColor,
        strokeWidth: 3.5,
        roughness: 1,
        targetNodeId: sem.id,
      };
      createdElements.push(undElem);
      sem.attachedAnnotations.push(undElem.id);
    }

    // 2. CIRCLE (Placed around outer node boundaries)
    if (s === "circle" || s === "all") {
      const cColor = color || "#e03131";
      const pad = 12.0;
      const circElem: Record<string, any> = {
        id: `circ_${sem.id}_${timestamp}`,
        type: "ellipse",
        x: sem.x - pad,
        y: sem.y - pad,
        width: sem.width + 2 * pad,
        height: sem.height + 2 * pad,
        backgroundColor: "transparent",
        strokeColor: cColor,
        strokeWidth: 2.5,
        roughness: 2,
        targetNodeId: sem.id,
      };
      createdElements.push(circElem);
      sem.attachedAnnotations.push(circElem.id);
    }

    // 3. LIGHT / HALO (Translucent backdrop covering boundaries)
    if (s === "light" || s === "all") {
      const cColor = color || "#fff3bf";
      const pad = 8.0;
      const lightElem: Record<string, any> = {
        id: `light_${sem.id}_${timestamp}`,
        type: "rectangle",
        x: sem.x - pad,
        y: sem.y - pad,
        width: sem.width + 2 * pad,
        height: sem.height + 2 * pad,
        backgroundColor: cColor,
        strokeColor: "#fab005",
        strokeWidth: 1.5,
        opacity: 40,
        roughness: 0,
        targetNodeId: sem.id,
      };
      createdElements.push(lightElem);
      sem.attachedAnnotations.push(lightElem.id);
    }

    // 4. SPOTLIGHT (Highlight + Attention pointer arrow)
    if (s === "spotlight") {
      const cColor = color || "#fff3bf";
      const pad = 8.0;
      const lightElem: Record<string, any> = {
        id: `light_${sem.id}_${timestamp}`,
        type: "rectangle",
        x: sem.x - pad,
        y: sem.y - pad,
        width: sem.width + 2 * pad,
        height: sem.height + 2 * pad,
        backgroundColor: cColor,
        strokeColor: "#fab005",
        strokeWidth: 1.5,
        opacity: 40,
        targetNodeId: sem.id,
      };
      const arrowElem: Record<string, any> = {
        id: `spot_arr_${sem.id}_${timestamp}`,
        type: "arrow",
        x: sem.right + 45.0,
        y: sem.centerY,
        points: [[0, 0], [-35.0, 0]],
        strokeColor: "#e03131",
        strokeWidth: 3.0,
        endArrowhead: "arrow",
        targetNodeId: sem.id,
      };
      const lblElem: Record<string, any> = {
        id: `spot_lbl_${sem.id}_${timestamp}`,
        type: "rectangle",
        x: sem.right + 50.0,
        y: sem.centerY - 18.0,
        width: 120.0,
        height: 36.0,
        text: "CURRENT STEP",
        backgroundColor: "#ffe3e3",
        strokeColor: "#e03131",
        fontSize: 12,
        targetNodeId: sem.id,
      };
      createdElements.push(lightElem, arrowElem, lblElem);
      for (const el of [lightElem, arrowElem, lblElem]) {
        sem.attachedAnnotations.push(el.id);
      }
    }

    // Add to canvas and update context
    if (createdElements.length) {
      if (typeof this.canvas.addElements === "function") {
        this.canvas.addElements(createdElements);
      } else if (typeof this.canvas.add_elements === "function") {
        this.canvas.add_elements(createdElements);
      }
      this.context.addElements(createdElements);
    }

    return {
      success: true,
      flowchart_id: flowchartId,
      node_id: sem.id,
      node_role: sem.role,
      node_purpose: sem.purpose,
      style_applied: s,
      boundaries: sem.boundaries,
      inner_text_coordinates: sem.textBounds ? sem.textBounds.toObject() : null,
      created_annotations: createdElements.map(e => e.id),
      createdElements,
    };
  }

  highlight_node(
    flowchartId: string,
    nodeQuery: string | number,
    style: string = "light",
    color?: string
  ): Record<string, any> {
    return this.highlightNode(flowchartId, nodeQuery, style, color);
  }

  clearNodeHighlights(flowchartId: string, nodeQuery: string | number): number {
    const sem = this.getNode(flowchartId, nodeQuery);
    if (!sem || !sem.attachedAnnotations.length) return 0;

    let clearedCount = 0;
    const annotations = [...sem.attachedAnnotations];
    for (const annId of annotations) {
      try {
        if (typeof this.canvas.deleteElement === "function") {
          this.canvas.deleteElement(annId);
        } else if (typeof this.canvas.delete_element === "function") {
          this.canvas.delete_element(annId);
        }
        this.context.removeElement(annId);
        const idx = sem.attachedAnnotations.indexOf(annId);
        if (idx !== -1) sem.attachedAnnotations.splice(idx, 1);
        clearedCount++;
      } catch {
        // Silently continue
      }
    }
    return clearedCount;
  }

  clear_node_highlights(flowchartId: string, nodeQuery: string | number): number {
    return this.clearNodeHighlights(flowchartId, nodeQuery);
  }

  // ---------------------------------------------------------------------------
  // Whiteboard SVG Vector Mark Conversion
  // ---------------------------------------------------------------------------

  /**
   * Convert an entire flowchart to standard SVG BoardMark marks for Whiteboard.tsx.
   */
  flowchartToBoardMarks(flowchart: Flowchart): BoardMark[] {
    const marks: BoardMark[] = [];

    // 1. Flowchart Header Banner
    const banner = this.context.find(`${flowchart.id}_banner`);
    if (banner) {
      marks.push({
        type: "rect",
        x: banner.x,
        y: banner.y,
        w: banner.width,
        h: banner.height,
        fill: banner.backgroundColor || "#f8f9fa",
        color: banner.strokeColor || "#343a40",
        strokeWidth: 1.8,
        layer: "teacher-permanent",
        elementId: banner.id,
      });
      marks.push({
        type: "text",
        x: banner.x + 20,
        y: banner.y + 26,
        text: banner.text || `FLOWCHART: ${flowchart.title.toUpperCase()}`,
        size: 16,
        color: "#212529",
        weight: 600,
        layer: "teacher-permanent",
        elementId: `${banner.id}_text`,
      });
    }

    // 2. Nodes
    for (const nid of flowchart.nodeIds) {
      const nodeEl = this.context.find(nid);
      const sem = this.context.getSemanticElement(nid);
      if (!nodeEl || !sem) continue;

      const x = nodeEl.x;
      const y = nodeEl.y;
      const w = nodeEl.width;
      const h = nodeEl.height;
      const stroke = nodeEl.strokeColor || "#2b8a3e";
      const fill = nodeEl.backgroundColor || "#d3f9d8";

      if (nodeEl.type === "diamond") {
        // Diamond SVG path
        const cx = x + w / 2;
        const cy = y + h / 2;
        marks.push({
          type: "path",
          d: `M${cx} ${y} L${x + w} ${cy} L${cx} ${y + h} L${x} ${cy} Z`,
          fill,
          color: stroke,
          strokeWidth: 2,
          layer: "teacher-permanent",
          elementId: nid,
        });

        // Centered text for diamond
        marks.push({
          type: "text",
          x: cx,
          y: cy + 5,
          text: nodeEl.text || sem.content,
          size: 13,
          color: "#212529",
          weight: 600,
          textAnchor: "middle",
          align: "middle",
          layer: "teacher-permanent",
          elementId: `${nid}_text`,
        });
      } else {
        // Rect or pill
        marks.push({
          type: "rect",
          x,
          y,
          w,
          h,
          fill,
          color: stroke,
          strokeWidth: 2,
          layer: "teacher-permanent",
          elementId: nid,
        });

        // Inner text
        marks.push({
          type: "text",
          x: x + 15,
          y: y + h / 2 + 5,
          text: nodeEl.text || sem.content,
          size: 14,
          color: "#212529",
          weight: 600,
          layer: "teacher-permanent",
          elementId: `${nid}_text`,
        });
      }
    }

    // 3. Edges
    for (const eid of flowchart.edgeIds) {
      const edgeEl = this.context.find(eid);
      if (!edgeEl) continue;

      const pts = edgeEl.points || [[0, 0], [0, 40]];
      const startX = edgeEl.x;
      const startY = edgeEl.y;
      const endX = startX + pts[1][0];
      const endY = startY + pts[1][1];

      const arrowPath = buildSvgArrowPath(startX, startY, endX, endY);
      marks.push({
        type: "path",
        d: arrowPath,
        color: edgeEl.strokeColor || "#495057",
        strokeWidth: 2.2,
        layer: "teacher-permanent",
        elementId: eid,
      });

      if (edgeEl.label && edgeEl.label.text) {
        marks.push({
          type: "text",
          x: (startX + endX) / 2 + 10,
          y: (startY + endY) / 2,
          text: edgeEl.label.text,
          size: 13,
          color: "#495057",
          weight: 600,
          layer: "teacher-permanent",
          elementId: `${eid}_label`,
        });
      }
    }

    return marks;
  }

  /**
   * Convert dynamic highlight elements to BoardMark SVG marks.
   */
  annotationsToBoardMarks(rawElements: any[]): BoardMark[] {
    const marks: BoardMark[] = [];
    for (const el of rawElements) {
      if (el.type === "line") {
        const pts = el.points || [[0, 0], [100, 0]];
        const x2 = el.x + pts[1][0];
        marks.push({
          type: "path",
          d: `M${el.x} ${el.y} L${x2} ${el.y}`,
          color: el.strokeColor || "#fab005",
          strokeWidth: el.strokeWidth || 3.5,
          annotation: true,
          actionId: el.id,
          elementId: el.targetNodeId,
          layer: "teacher-annotations",
        });
      } else if (el.type === "ellipse") {
        marks.push({
          type: "ellipse",
          x: el.x + el.width / 2,
          y: el.y + el.height / 2,
          w: el.width / 2,
          h: el.height / 2,
          color: el.strokeColor || "#e03131",
          fill: "none",
          strokeWidth: el.strokeWidth || 2.5,
          annotation: true,
          actionId: el.id,
          elementId: el.targetNodeId,
          layer: "teacher-annotations",
        });
      } else if (el.type === "rectangle") {
        marks.push({
          type: "rect",
          x: el.x,
          y: el.y,
          w: el.width,
          h: el.height,
          fill: el.backgroundColor || "#fff3bf",
          color: el.strokeColor || "#fab005",
          strokeWidth: el.strokeWidth || 1.5,
          opacity: el.opacity ? el.opacity / 100 : 0.4,
          annotation: true,
          actionId: el.id,
          elementId: el.targetNodeId,
          layer: "teacher-annotations",
        });
        if (el.text) {
          marks.push({
            type: "text",
            x: el.x + 10,
            y: el.y + el.height / 2 + 4,
            text: el.text,
            size: el.fontSize || 12,
            color: el.strokeColor || "#e03131",
            weight: 700,
            annotation: true,
            actionId: `${el.id}_txt`,
            elementId: el.targetNodeId,
            layer: "teacher-annotations",
          });
        }
      } else if (el.type === "arrow") {
        const pts = el.points || [[0, 0], [-35, 0]];
        const arrowPath = buildSvgArrowPath(el.x, el.y, el.x + pts[1][0], el.y + pts[1][1]);
        marks.push({
          type: "path",
          d: arrowPath,
          color: el.strokeColor || "#e03131",
          strokeWidth: el.strokeWidth || 3.0,
          annotation: true,
          actionId: el.id,
          elementId: el.targetNodeId,
          layer: "teacher-annotations",
        });
      }
    }
    return marks;
  }
}
