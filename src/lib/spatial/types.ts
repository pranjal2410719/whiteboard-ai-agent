/**
 * Whiteboard Spatial Types & Semantic Context Model
 * Ported from Python whiteboard_tutor_agent/spatial_context.py & semantic_element.py
 */

export class BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get right(): number {
    return this.x + this.width;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  get centerX(): number {
    return this.x + this.width / 2.0;
  }

  get centerY(): number {
    return this.y + this.height / 2.0;
  }

  // Compatibility getter aliases
  get center_x(): number {
    return this.centerX;
  }

  get center_y(): number {
    return this.centerY;
  }

  intersects(other: BoundingBox): boolean {
    return !(
      this.right <= other.x ||
      this.x >= other.right ||
      this.bottom <= other.y ||
      this.y >= other.bottom
    );
  }

  contains(other: BoundingBox): boolean {
    return (
      other.x >= this.x &&
      other.right <= this.right &&
      other.y >= this.y &&
      other.bottom <= this.bottom
    );
  }
}

export class AnchorPoints {
  top: [number, number];
  bottom: [number, number];
  left: [number, number];
  right: [number, number];
  center: [number, number];

  constructor(
    top: [number, number],
    bottom: [number, number],
    left: [number, number],
    right: [number, number],
    center: [number, number]
  ) {
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
    this.center = center;
  }

  toObject(): Record<string, [number, number]> {
    return {
      top: this.top,
      bottom: this.bottom,
      left: this.left,
      right: this.right,
      center: this.center,
    };
  }

  to_dict(): Record<string, [number, number]> {
    return this.toObject();
  }
}

export class InnerTextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    fontSize: number = 14
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.fontSize = fontSize;
  }

  get right(): number {
    return this.x + this.width;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  toObject(): Record<string, any> {
    return {
      x: Math.round(this.x * 10) / 10,
      y: Math.round(this.y * 10) / 10,
      width: Math.round(this.width * 10) / 10,
      height: Math.round(this.height * 10) / 10,
      right: Math.round(this.right * 10) / 10,
      bottom: Math.round(this.bottom * 10) / 10,
      text: this.text,
      font_size: this.fontSize,
      fontSize: this.fontSize,
    };
  }

  to_dict(): Record<string, any> {
    return this.toObject();
  }
}

export class SemanticElement {
  id: string;
  elementType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  role: string;
  purpose: string;
  parentId?: string | null;
  sequenceIndex: number;
  rawData: Record<string, any>;

  attachedAnnotations: string[];
  overlappingElements: string[];

  constructor(
    elementId: string,
    elementType: string,
    x: number,
    y: number,
    width: number,
    height: number,
    content: string = "",
    role: string = "general_element",
    purpose: string = "",
    parentId: string | null = null,
    sequenceIndex: number = 0,
    rawData: Record<string, any> = {}
  ) {
    this.id = elementId;
    this.elementType = elementType;
    this.x = Number(x);
    this.y = Number(y);
    this.width = Number(width);
    this.height = Number(height);
    this.content = content;
    this.role = role;
    this.purpose = purpose || `Whiteboard ${elementType} representing ${content || role}`;
    this.parentId = parentId;
    this.sequenceIndex = sequenceIndex;
    this.rawData = rawData || {};

    this.attachedAnnotations = [];
    this.overlappingElements = [];
  }

  get right(): number {
    return this.x + this.width;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  get centerX(): number {
    return this.x + this.width / 2.0;
  }

  get centerY(): number {
    return this.y + this.height / 2.0;
  }

  // Compatibility aliases
  get center_x(): number {
    return this.centerX;
  }

  get center_y(): number {
    return this.centerY;
  }

  get element_type(): string {
    return this.elementType;
  }

  get parent_id(): string | null | undefined {
    return this.parentId;
  }

  get sequence_index(): number {
    return this.sequenceIndex;
  }

  get raw_data(): Record<string, any> {
    return this.rawData;
  }

  get attached_annotations(): string[] {
    return this.attachedAnnotations;
  }

  get overlapping_elements(): string[] {
    return this.overlappingElements;
  }

  get anchors(): AnchorPoints {
    return new AnchorPoints(
      [Math.round(this.centerX * 10) / 10, Math.round(this.y * 10) / 10],
      [Math.round(this.centerX * 10) / 10, Math.round(this.bottom * 10) / 10],
      [Math.round(this.x * 10) / 10, Math.round(this.centerY * 10) / 10],
      [Math.round(this.right * 10) / 10, Math.round(this.centerY * 10) / 10],
      [Math.round(this.centerX * 10) / 10, Math.round(this.centerY * 10) / 10]
    );
  }

  get boundaries(): Record<string, number> {
    return {
      top: Math.round(this.y * 10) / 10,
      bottom: Math.round(this.bottom * 10) / 10,
      left: Math.round(this.x * 10) / 10,
      right: Math.round(this.right * 10) / 10,
      width: Math.round(this.width * 10) / 10,
      height: Math.round(this.height * 10) / 10,
    };
  }

  get textBounds(): InnerTextBounds | null {
    if (!this.content) return null;

    const fontSize = Number(this.rawData.fontSize || this.rawData.font_size || 14);
    const lines = this.content.split("\n");
    const maxLineLen = lines.length ? Math.max(...lines.map(l => l.length)) : this.content.length;
    const estCharWidth = fontSize * 0.58;
    const estLineHeight = fontSize * 1.35;

    const textW = Math.min(maxLineLen * estCharWidth, this.width - 10);
    const textH = Math.min(lines.length * estLineHeight, this.height - 10);

    const textX = this.centerX - textW / 2.0;
    const textY = this.centerY - textH / 2.0;

    return new InnerTextBounds(
      Math.max(textX, this.x + 5),
      Math.max(textY, this.y + 5),
      textW,
      textH,
      this.content,
      fontSize
    );
  }

  get text_bounds(): InnerTextBounds | null {
    return this.textBounds;
  }

  determineQuadrant(canvasWidth: number = 1200.0, canvasHeight: number = 800.0): string {
    const midX = canvasWidth / 2.0;
    const midY = canvasHeight / 2.0;
    const horiz = this.centerX < midX ? "Left" : "Right";
    const vert = this.centerY < midY ? "Top" : "Bottom";
    return `${vert}-${horiz} Quadrant`;
  }

  determine_quadrant(canvasWidth: number = 1200.0, canvasHeight: number = 800.0): string {
    return this.determineQuadrant(canvasWidth, canvasHeight);
  }

  explainContext(): Record<string, any> {
    const tb = this.textBounds;
    return {
      element_id: this.id,
      where_is_element: {
        quadrant: this.determineQuadrant(),
        parent_entity: this.parentId || "Independent element on canvas",
        center_point: [Math.round(this.centerX * 10) / 10, Math.round(this.centerY * 10) / 10],
      },
      what_is_position: {
        sequence_index: this.sequenceIndex,
        role: this.role,
        z_layer: this.rawData.version || 1,
      },
      what_are_coordinates: {
        exact_x: Math.round(this.x * 10) / 10,
        exact_y: Math.round(this.y * 10) / 10,
        width: Math.round(this.width * 10) / 10,
        height: Math.round(this.height * 10) / 10,
        boundaries: this.boundaries,
        anchors: this.anchors.toObject(),
        inner_text_coordinates: tb ? tb.toObject() : null,
      },
      what_content_is_on_operation: {
        type: this.elementType,
        content_text: this.content,
        background_color: this.rawData.backgroundColor || this.rawData.background_color || "transparent",
        stroke_color: this.rawData.strokeColor || this.rawData.stroke_color || "#000000",
        font_size: Number(this.rawData.fontSize || this.rawData.font_size || 14),
      },
      why_was_this_element_there: this.purpose,
      is_there_any_element_over_it: {
        has_overlays: this.overlappingElements.length > 0 || this.attachedAnnotations.length > 0,
        overlapping_elements: [...this.overlappingElements],
        attached_annotations: [...this.attachedAnnotations],
      },
    };
  }

  explain_context(): Record<string, any> {
    return this.explainContext();
  }

  toObject(): Record<string, any> {
    return {
      ...this.rawData,
      id: this.id,
      type: this.elementType,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      role: this.role,
      purpose: this.purpose,
      parent_id: this.parentId,
      sequence_index: this.sequenceIndex,
    };
  }

  to_dict(): Record<string, any> {
    return this.toObject();
  }
}

export class FlowchartNodeDef {
  id: string;
  text: string;
  nodeType: "start" | "process" | "decision" | "end" | string;
  purpose: string;
  width: number;
  height: number;
  bgColor: string;
  strokeColor: string;

  constructor(
    nodeId: string,
    text: string,
    nodeType: "start" | "process" | "decision" | "end" | string = "process",
    purpose: string = "",
    width: number = 240.0,
    height: number = 80.0,
    bgColor?: string,
    strokeColor?: string
  ) {
    this.id = nodeId;
    this.text = text;
    this.nodeType = nodeType;
    this.purpose = purpose || `Flowchart ${nodeType} step: ${text}`;
    this.width = width;
    this.height = height;

    const colors: Record<string, [string, string]> = {
      start: ["#d3f9d8", "#2b8a3e"],     // Green pill
      end: ["#ffe3e3", "#e03131"],       // Red pill
      process: ["#e7f5ff", "#1971c2"],   // Blue rectangle
      decision: ["#fff9db", "#f59f00"],  // Yellow diamond
    };
    const [defBg, defStroke] = colors[nodeType] || ["#f8f9fa", "#adb5bd"];
    this.bgColor = bgColor || defBg;
    this.strokeColor = strokeColor || defStroke;
  }

  get bg_color(): string {
    return this.bgColor;
  }

  get stroke_color(): string {
    return this.strokeColor;
  }

  get node_type(): string {
    return this.nodeType;
  }
}

export class FlowchartEdgeDef {
  fromNode: string;
  toNode: string;
  label: string;
  color: string;

  constructor(
    fromNode: string,
    toNode: string,
    label: string = "",
    color: string = "#495057"
  ) {
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.label = label;
    this.color = color;
  }

  get from_node(): string {
    return this.fromNode;
  }

  get to_node(): string {
    return this.toNode;
  }
}

export class Flowchart {
  id: string;
  title: string;
  description: string;
  nodeIds: string[];
  edgeIds: string[];
  bounds: BoundingBox | null;

  constructor(flowchartId: string, title: string, description: string = "") {
    this.id = flowchartId;
    this.title = title;
    this.description = description;
    this.nodeIds = [];
    this.edgeIds = [];
    this.bounds = null;
  }

  get node_ids(): string[] {
    return this.nodeIds;
  }

  get edge_ids(): string[] {
    return this.edgeIds;
  }
}
