import type { BoardMark, BoardPage, DiagramRegion, Point } from "../types";
import type { PedagogyStage } from "../pedagogy/types";

export type LayoutPatternType =
  | "classic-split"
  | "inverted-split"
  | "centered-focal-hero"
  | "top-diagram-bottom-timeline"
  | "step-by-step-derivation"
  | "multi-panel-comparison"
  | "floating-radial-annotation";

export type LayoutZoneRole =
  | "heading"
  | "content"
  | "diagram"
  | "diagram-secondary"
  | "steps"
  | "callouts-left"
  | "callouts-right"
  | "panel-left"
  | "panel-right"
  | "panel-center"
  | "derivation"
  | "reference"
  | "footer";

export type RectBounds = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LayoutZone = {
  id: string;
  role: LayoutZoneRole;
  bounds: RectBounds;
};

export type LayoutConfig = {
  splitRatio?: number;
  gap?: number;
  padding?: number;
  accentColor?: string;
  theme?: "sage" | "amber" | "violet" | "ocean";
  cardsCount?: number;
  heroAlignment?: "center" | "top" | "left" | "right";
  showContainers?: boolean;
};

export type LayoutPatternDefinition = {
  type: LayoutPatternType;
  name: string;
  description: string;
  pedagogicalAffordance: string;
  recommendedStages: PedagogyStage[];
  resolveZones(config?: LayoutConfig): LayoutZone[];
  getDiagramBounds(config?: LayoutConfig): RectBounds;
  transformRegion(
    region: DiagramRegion,
    defaultBounds: RectBounds,
    config?: LayoutConfig
  ): DiagramRegion;
};

export type DerivationStep = {
  stepNumber: number;
  title: string;
  equation: string;
  explanation: string;
  accent?: string;
  highlight?: boolean;
};

export type TimelineStep = {
  step: number;
  title: string;
  subtitle: string;
  detail: string;
  color?: string;
};

export type ComparisonPanel = {
  id: string;
  title: string;
  subtitle?: string;
  color: string;
  points: string[];
  equation?: string;
  asset?: {
    src: string;
    alt: string;
    w: number;
    h: number;
  };
};

export type RadialNode = {
  id: string;
  label: string;
  sublabel?: string;
  angleDeg: number;
  distance?: number;
  color?: string;
};
