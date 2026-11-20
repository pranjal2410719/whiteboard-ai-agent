/**
 * Spatial Context & Whiteboard Layout Tracking Engine
 * Ported from Python whiteboard_tutor_agent/spatial_context.py
 */

import { BoundingBox, SemanticElement } from "./types";

export class SpatialContext {
  elements: Record<string, Record<string, any>>;
  order: string[]; // Ordered list of element IDs (z-order)
  semanticIndex: Record<string, SemanticElement>;
  lastElementId: string | null;
  history: Array<Record<string, any>>;

  constructor() {
    this.elements = {};
    this.order = [];
    this.semanticIndex = {};
    this.lastElementId = null;
    this.history = [];
  }

  // Compatibility getter alias
  get semantic_index(): Record<string, SemanticElement> {
    return this.semanticIndex;
  }

  get last_element_id(): string | null {
    return this.lastElementId;
  }

  // ---------------------------------------------------------------------------
  // State Synchronization & Element Indexing
  // ---------------------------------------------------------------------------

  registerSemanticElement(element: SemanticElement): void {
    this.semanticIndex[element.id] = element;
    this.elements[element.id] = element.toObject();
    if (!this.order.includes(element.id)) {
      this.order.push(element.id);
    }
    this.lastElementId = element.id;
  }

  register_semantic_element(element: SemanticElement): void {
    this.registerSemanticElement(element);
  }

  getSemanticElement(query: string): SemanticElement | null {
    const raw = this.find(query);
    if (!raw) return null;

    const elemId = raw.id;
    if (this.semanticIndex[elemId]) {
      return this.semanticIndex[elemId];
    }

    const text = this.getText(raw);
    const sem = new SemanticElement(
      elemId,
      raw.type || "rectangle",
      raw.x || 0,
      raw.y || 0,
      raw.width || 200,
      raw.height || 100,
      text,
      raw.role || "whiteboard_element",
      raw.purpose || `Visual element: ${text || raw.type}`,
      raw.parentId || raw.parent_id || null,
      raw.sequenceIndex || raw.sequence_index || 0,
      raw
    );
    this.semanticIndex[elemId] = sem;
    return sem;
  }

  get_semantic_element(query: string): SemanticElement | null {
    return this.getSemanticElement(query);
  }

  findOverlappingElements(targetIdOrBbox: string | BoundingBox): string[] {
    let targetId: string | null = null;
    let targetBbox: BoundingBox | null = null;

    if (typeof targetIdOrBbox === "string") {
      targetId = targetIdOrBbox;
      targetBbox = this.getBbox(targetId);
    } else {
      targetBbox = targetIdOrBbox;
    }

    if (!targetBbox) return [];

    const overlapping: string[] = [];
    for (const eid of this.order) {
      if (eid === targetId) continue;
      const b = this.getBbox(eid);
      if (b && targetBbox.intersects(b)) {
        overlapping.push(eid);
      }
    }
    return overlapping;
  }

  find_overlapping_elements(targetIdOrBbox: string | BoundingBox): string[] {
    return this.findOverlappingElements(targetIdOrBbox);
  }

  explainElement(query: string): { success: boolean; context?: any; error?: string } {
    const sem = this.getSemanticElement(query);
    if (!sem) {
      return { success: false, error: `Element '${query}' not found in spatial context.` };
    }

    sem.overlappingElements = this.findOverlappingElements(sem.id);
    return { success: true, context: sem.explainContext() };
  }

  explain_element(query: string): { success: boolean; context?: any; error?: string } {
    return this.explainElement(query);
  }

  updateFromElements(elementList: any[] | { elements: any[] }): void {
    let list: any[] = [];
    if (Array.isArray(elementList)) {
      list = elementList;
    } else if (elementList && typeof elementList === "object" && Array.isArray((elementList as any).elements)) {
      list = (elementList as any).elements;
    }

    this.elements = {};
    this.order = [];
    for (const el of list) {
      if (!el || typeof el !== "object") continue;
      const elemId = el.id;
      if (!elemId) continue;
      this.elements[elemId] = { ...el };
      this.order.push(elemId);
    }
    this.lastElementId = this.order.length ? this.order[this.order.length - 1] : null;
  }

  update_from_elements(elementList: any[] | { elements: any[] }): void {
    this.updateFromElements(elementList);
  }

  addElements(elements: any[]): void {
    if (!Array.isArray(elements)) return;
    for (const el of elements) {
      if (el && typeof el === "object" && el.id) {
        this.registerElement(el);
      }
    }
  }

  add_elements(elements: any[]): void {
    this.addElements(elements);
  }

  registerElement(element: Record<string, any>, setAsLast: boolean = true): string {
    const elemId = element.id;
    if (!elemId) throw new Error("Element must have an 'id'");

    this.elements[elemId] = { ...element };
    if (!this.order.includes(elemId)) {
      this.order.push(elemId);
    }
    if (setAsLast) {
      this.lastElementId = elemId;
    }
    return elemId;
  }

  register_element(element: Record<string, any>, setAsLast: boolean = true): string {
    return this.registerElement(element, setAsLast);
  }

  removeElement(elementId: string): Record<string, any> | null {
    if (this.elements[elementId]) {
      const removed = this.elements[elementId];
      delete this.elements[elementId];
      delete this.semanticIndex[elementId];
      const idx = this.order.indexOf(elementId);
      if (idx !== -1) {
        this.order.splice(idx, 1);
      }
      if (this.lastElementId === elementId) {
        this.lastElementId = this.order.length ? this.order[this.order.length - 1] : null;
      }
      return removed;
    }
    return null;
  }

  remove_element(elementId: string): Record<string, any> | null {
    return this.removeElement(elementId);
  }

  getAllElements(): Array<Record<string, any>> {
    return this.order.filter(eid => this.elements[eid]).map(eid => this.elements[eid]);
  }

  get_all_elements(): Array<Record<string, any>> {
    return this.getAllElements();
  }

  // ---------------------------------------------------------------------------
  // Bounding Box & Query Helpers
  // ---------------------------------------------------------------------------

  getBbox(elementOrId: string | Record<string, any>): BoundingBox | null {
    let el: Record<string, any> | undefined;
    if (typeof elementOrId === "string") {
      el = this.elements[elementOrId];
    } else {
      el = elementOrId;
    }

    if (!el) return null;

    let x = Number(el.x || 0);
    let y = Number(el.y || 0);
    let w = Number(el.width || el.w || 0);
    let h = Number(el.height || el.h || 0);

    // Handle lines or arrows where points define dimensions
    if ((w === 0 || h === 0) && Array.isArray(el.points) && el.points.length) {
      const xs = el.points.map((p: any) => p[0]);
      const ys = el.points.map((p: any) => p[1]);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      x += minX;
      y += minY;
      w = Math.max(Math.abs(maxX - minX), 10.0);
      h = Math.max(Math.abs(maxY - minY), 10.0);
    }

    // Ensure minimal positive dimensions for zero-sized elements
    w = Math.max(w, 20.0);
    h = Math.max(h, 20.0);

    return new BoundingBox(x, y, w, h);
  }

  get_bbox(elementOrId: string | Record<string, any>): BoundingBox | null {
    return this.getBbox(elementOrId);
  }

  getText(el: Record<string, any>): string {
    if (!el) return "";
    if (el.text) return String(el.text);
    if (el.label && typeof el.label === "object" && el.label.text) {
      return String(el.label.text);
    }
    return "";
  }

  get_text(el: Record<string, any>): string {
    return this.getText(el);
  }

  find(query: string): Record<string, any> | null {
    if (!this.order.length) return null;

    const q = query.trim();
    const qLower = q.toLowerCase();

    // Positional keywords
    if (["last", "previous", "recent", "prev"].includes(qLower)) {
      if (this.lastElementId && this.elements[this.lastElementId]) {
        return this.elements[this.lastElementId];
      }
      return this.order.length ? this.elements[this.order[this.order.length - 1]] : null;
    }

    if (qLower === "first") {
      return this.order.length ? this.elements[this.order[0]] : null;
    }

    // Exact ID match
    if (this.elements[q]) {
      return this.elements[q];
    }

    // Case-insensitive ID match
    for (const [eid, el] of Object.entries(this.elements)) {
      if (eid.toLowerCase() === qLower) {
        return el;
      }
    }

    // Match by text content (search recent first)
    const all = [...this.getAllElements()].reverse();
    for (const el of all) {
      const text = this.getText(el).toLowerCase();
      if (text.includes(qLower)) {
        return el;
      }
    }

    // Match by element type
    for (const el of all) {
      if (String(el.type || "").toLowerCase() === qLower) {
        return el;
      }
    }

    return null;
  }

  findAllByType(elementType: string): Array<Record<string, any>> {
    const t = elementType.toLowerCase();
    return this.getAllElements().filter(el => String(el.type || "").toLowerCase() === t);
  }

  find_all_by_type(elementType: string): Array<Record<string, any>> {
    return this.findAllByType(elementType);
  }

  // ---------------------------------------------------------------------------
  // Relative Spatial Positioning Calculations
  // ---------------------------------------------------------------------------

  calculateRelativePosition(
    reference: string | Record<string, any> | BoundingBox,
    placement: string = "below",
    width: number = 200.0,
    height: number = 100.0,
    gap: number = 20.0,
    align: string = "center"
  ): [number, number] {
    let refBbox: BoundingBox | null = null;
    if (reference instanceof BoundingBox) {
      refBbox = reference;
    } else {
      refBbox = this.getBbox(reference);
    }

    if (!refBbox) {
      return [100.0, 100.0];
    }

    const p = placement.toLowerCase();
    const a = align.toLowerCase();

    let x = 0;
    let y = 0;

    if (p === "below") {
      y = refBbox.bottom + gap;
      if (a === "center") {
        x = refBbox.centerX - width / 2.0;
      } else if (["start", "left"].includes(a)) {
        x = refBbox.x;
      } else if (["end", "right"].includes(a)) {
        x = refBbox.right - width;
      } else {
        x = refBbox.x;
      }
    } else if (p === "above") {
      y = refBbox.y - height - gap;
      if (a === "center") {
        x = refBbox.centerX - width / 2.0;
      } else if (["start", "left"].includes(a)) {
        x = refBbox.x;
      } else if (["end", "right"].includes(a)) {
        x = refBbox.right - width;
      } else {
        x = refBbox.x;
      }
    } else if (["right", "beside", "beside_right"].includes(p)) {
      x = refBbox.right + gap;
      if (a === "center") {
        y = refBbox.centerY - height / 2.0;
      } else if (["start", "top"].includes(a)) {
        y = refBbox.y;
      } else if (["end", "bottom"].includes(a)) {
        y = refBbox.bottom - height;
      } else {
        y = refBbox.y;
      }
    } else if (["left", "beside_left"].includes(p)) {
      x = refBbox.x - width - gap;
      if (a === "center") {
        y = refBbox.centerY - height / 2.0;
      } else if (["start", "top"].includes(a)) {
        y = refBbox.y;
      } else if (["end", "bottom"].includes(a)) {
        y = refBbox.bottom - height;
      } else {
        y = refBbox.y;
      }
    } else if (p === "inside") {
      x = refBbox.centerX - width / 2.0;
      y = refBbox.centerY - height / 2.0;
    } else {
      x = refBbox.x;
      y = refBbox.bottom + gap;
    }

    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  }

  calculate_relative_position(
    reference: string | Record<string, any> | BoundingBox,
    placement: string = "below",
    width: number = 200.0,
    height: number = 100.0,
    gap: number = 20.0,
    align: string = "center"
  ): [number, number] {
    return this.calculateRelativePosition(reference, placement, width, height, gap, align);
  }

  // ---------------------------------------------------------------------------
  // Spatial Alignment & Distribution
  // ---------------------------------------------------------------------------

  computeAlignment(
    elementIds: string[],
    to: string = "left"
  ): Record<string, { x?: number; y?: number }> {
    const validBboxes: Array<[string, BoundingBox]> = [];
    for (const eid of elementIds) {
      const bbox = this.getBbox(eid);
      if (bbox) {
        validBboxes.push([eid, bbox]);
      }
    }

    if (validBboxes.length < 2) {
      return {};
    }

    const t = to.toLowerCase();
    const updates: Record<string, { x?: number; y?: number }> = {};

    if (t === "left") {
      const targetX = Math.min(...validBboxes.map(([, b]) => b.x));
      for (const [eid] of validBboxes) {
        updates[eid] = { x: targetX };
      }
    } else if (t === "right") {
      const targetRight = Math.max(...validBboxes.map(([, b]) => b.right));
      for (const [eid, b] of validBboxes) {
        updates[eid] = { x: targetRight - b.width };
      }
    } else if (t === "center") {
      const avgCenterX = validBboxes.reduce((acc, [, b]) => acc + b.centerX, 0) / validBboxes.length;
      for (const [eid, b] of validBboxes) {
        updates[eid] = { x: Math.round((avgCenterX - b.width / 2.0) * 10) / 10 };
      }
    } else if (t === "top") {
      const targetY = Math.min(...validBboxes.map(([, b]) => b.y));
      for (const [eid] of validBboxes) {
        updates[eid] = { y: targetY };
      }
    } else if (t === "bottom") {
      const targetBottom = Math.max(...validBboxes.map(([, b]) => b.bottom));
      for (const [eid, b] of validBboxes) {
        updates[eid] = { y: targetBottom - b.height };
      }
    } else if (["middle", "vertical_center"].includes(t)) {
      const avgCenterY = validBboxes.reduce((acc, [, b]) => acc + b.centerY, 0) / validBboxes.length;
      for (const [eid, b] of validBboxes) {
        updates[eid] = { y: Math.round((avgCenterY - b.height / 2.0) * 10) / 10 };
      }
    }

    return updates;
  }

  compute_alignment(
    elementIds: string[],
    to: string = "left"
  ): Record<string, { x?: number; y?: number }> {
    return this.computeAlignment(elementIds, to);
  }

  computeDistribution(
    elementIds: string[],
    direction: string = "horizontal",
    gap: number | null = null
  ): Record<string, { x?: number; y?: number }> {
    const validItems: Array<[string, BoundingBox]> = [];
    for (const eid of elementIds) {
      const bbox = this.getBbox(eid);
      if (bbox) {
        validItems.push([eid, bbox]);
      }
    }

    if (validItems.length < 2) {
      return {};
    }

    const dir = direction.toLowerCase();
    const updates: Record<string, { x?: number; y?: number }> = {};

    if (dir === "horizontal") {
      validItems.sort((a, b) => a[1].x - b[1].x);
      const firstX = validItems[0][1].x;
      const lastX = validItems[validItems.length - 1][1].right;
      const totalElementsWidth = validItems.reduce((acc, [, b]) => acc + b.width, 0);

      let calculatedGap: number;
      if (gap === null || gap === undefined) {
        const totalSpan = lastX - firstX;
        const remainingSpace = totalSpan - totalElementsWidth;
        calculatedGap = Math.max(remainingSpace / (validItems.length - 1), 10.0);
      } else {
        calculatedGap = gap;
      }

      let currX = firstX;
      for (const [eid, bbox] of validItems) {
        updates[eid] = { x: Math.round(currX * 10) / 10 };
        currX += bbox.width + calculatedGap;
      }
    } else if (dir === "vertical") {
      validItems.sort((a, b) => a[1].y - b[1].y);
      const firstY = validItems[0][1].y;
      const lastY = validItems[validItems.length - 1][1].bottom;
      const totalElementsHeight = validItems.reduce((acc, [, b]) => acc + b.height, 0);

      let calculatedGap: number;
      if (gap === null || gap === undefined) {
        const totalSpan = lastY - firstY;
        const remainingSpace = totalSpan - totalElementsHeight;
        calculatedGap = Math.max(remainingSpace / (validItems.length - 1), 10.0);
      } else {
        calculatedGap = gap;
      }

      let currY = firstY;
      for (const [eid, bbox] of validItems) {
        updates[eid] = { y: Math.round(currY * 10) / 10 };
        currY += bbox.height + calculatedGap;
      }
    }

    return updates;
  }

  compute_distribution(
    elementIds: string[],
    direction: string = "horizontal",
    gap: number | null = null
  ): Record<string, { x?: number; y?: number }> {
    return this.computeDistribution(elementIds, direction, gap);
  }

  // ---------------------------------------------------------------------------
  // Collision Avoidance
  // ---------------------------------------------------------------------------

  findNonOverlappingSpot(
    targetX: number,
    targetY: number,
    width: number,
    height: number,
    stepY: number = 30.0,
    maxAttempts: number = 20
  ): [number, number] {
    const candidate = new BoundingBox(targetX, targetY, width, height);
    const allBboxes = this.getAllElements()
      .map(el => this.getBbox(el))
      .filter((b): b is BoundingBox => b !== null);

    let attempts = 0;
    while (attempts < maxAttempts) {
      const collision = allBboxes.some(b => candidate.intersects(b));
      if (!collision) {
        return [candidate.x, candidate.y];
      }
      candidate.y += stepY;
      attempts++;
    }

    return [candidate.x, candidate.y];
  }

  find_non_overlapping_spot(
    targetX: number,
    targetY: number,
    width: number,
    height: number,
    stepY: number = 30.0,
    maxAttempts: number = 20
  ): [number, number] {
    return this.findNonOverlappingSpot(targetX, targetY, width, height, stepY, maxAttempts);
  }
}
