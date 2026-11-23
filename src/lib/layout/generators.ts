import type { BoardMark, BoardPage, DiagramRegion, LessonCue } from "../types";
import {
  badgePill,
  cardBox,
  circleMark,
  flowArrow,
  headerMark,
  centeredHeaderMark,
  palette,
  pathMark,
  rectMark,
  textMark,
} from "./helpers";
import { LayoutPatternEngine } from "./engine";
import type {
  ComparisonPanel,
  DerivationStep,
  LayoutConfig,
  LayoutPatternType,
  RadialNode,
  RectBounds,
  TimelineStep,
} from "./types";

export type BuildLayoutPageOptions = {
  id: string;
  title: string;
  pattern: LayoutPatternType;
  narration?: string;
  seconds?: number;
  config?: LayoutConfig;
  cues?: LessonCue[];
  // Content inputs
  diagramAsset?: {
    src: string;
    alt: string;
    naturalBounds?: RectBounds;
  };
  notes?: string[];
  formula?: {
    expression: string;
    label?: string;
    highlight?: boolean;
  };
  leftCallouts?: { label: string; text: string; color?: string; targetY?: number }[];
  rightCallouts?: { label: string; text: string; color?: string; targetY?: number }[];
  derivationSteps?: DerivationStep[];
  timelineSteps?: TimelineStep[];
  comparisonPanels?: ComparisonPanel[];
  radialNodes?: RadialNode[];
  regions?: DiagramRegion[];
  customMarks?: BoardMark[];
};

export function buildClassicSplitMarks(options: {
  title: string;
  notes: string[];
  diagramSrc?: string;
  diagramAlt?: string;
  diagramBounds?: RectBounds;
  formula?: { expression: string; label?: string };
}): BoardMark[] {
  const marks: BoardMark[] = [];
  marks.push(...headerMark(options.title, 380, 52, 48, palette.greenBorder));

  let currentY = 110;
  for (let i = 0; i < options.notes.length; i++) {
    const note = options.notes[i];
    const colors = [palette.green, palette.blue, palette.purple, palette.orange];
    const bulletColor = colors[i % colors.length];
    marks.push(
      circleMark(58, currentY - 7, 3, 3, bulletColor, 2, bulletColor),
      textMark(70, currentY, note, 25, palette.ink, 550)
    );
    currentY += 40;
  }

  if (options.formula) {
    marks.push(
      cardBox(52, currentY, 390, 52, palette.greenLight, palette.greenBorder, 1.6),
      textMark(70, currentY + 34, options.formula.expression, 27, "#1e3d29", 650)
    );
    if (options.formula.label) {
      marks.push(textMark(70, currentY - 6, options.formula.label, 16, palette.green, 600));
    }
  }

  if (options.diagramSrc) {
    const db = options.diagramBounds || { x: 550, y: 16, w: 390, h: 295 };
    marks.push({
      type: "image",
      src: options.diagramSrc,
      alt: options.diagramAlt || "Diagram",
      x: db.x,
      y: db.y,
      w: db.w,
      h: db.h,
    });
  }

  return marks;
}

export function buildInvertedSplitMarks(options: {
  title: string;
  notes: string[];
  diagramSrc?: string;
  diagramAlt?: string;
  diagramBounds?: RectBounds;
  formula?: { expression: string; label?: string };
}): BoardMark[] {
  const marks: BoardMark[] = [];
  const db = options.diagramBounds || { x: 45, y: 16, w: 420, h: 295 };

  if (options.diagramSrc) {
    marks.push({
      type: "image",
      src: options.diagramSrc,
      alt: options.diagramAlt || "Diagram",
      x: db.x,
      y: db.y,
      w: db.w,
      h: db.h,
    });
  }

  const rightX = 515;
  marks.push(...headerMark(options.title, 380, rightX, 48, palette.purpleBorder));

  let currentY = 110;
  for (let i = 0; i < options.notes.length; i++) {
    const note = options.notes[i];
    const colors = [palette.purple, palette.blue, palette.green, palette.orange];
    const bulletColor = colors[i % colors.length];
    marks.push(
      circleMark(rightX + 6, currentY - 7, 3, 3, bulletColor, 2, bulletColor),
      textMark(rightX + 18, currentY, note, 25, palette.ink, 550)
    );
    currentY += 40;
  }

  if (options.formula) {
    marks.push(
      cardBox(rightX, currentY, 400, 52, palette.purpleLight, palette.purpleBorder, 1.6),
      textMark(rightX + 18, currentY + 34, options.formula.expression, 27, "#4a2a68", 650)
    );
  }

  return marks;
}

export function buildCenteredFocalHeroMarks(options: {
  title: string;
  diagramSrc?: string;
  diagramAlt?: string;
  diagramBounds?: RectBounds;
  leftCallouts?: { label: string; text: string; color?: string; targetY?: number }[];
  rightCallouts?: { label: string; text: string; color?: string; targetY?: number }[];
}): BoardMark[] {
  const marks: BoardMark[] = [];
  marks.push(...centeredHeaderMark(options.title, 460, 500, 36, palette.greenBorder));

  const db = options.diagramBounds || { x: 350, y: 48, w: 300, h: 265 };
  if (options.diagramSrc) {
    marks.push({
      type: "image",
      src: options.diagramSrc,
      alt: options.diagramAlt || "Hero Diagram",
      x: db.x,
      y: db.y,
      w: db.w,
      h: db.h,
    });
  }

  // Left flank callout cards
  if (options.leftCallouts) {
    let y = 62;
    for (const callout of options.leftCallouts) {
      const color = callout.color || palette.purple;
      marks.push(
        cardBox(45, y, 260, 54, palette.purpleLight, palette.purpleBorder, 1.4),
        textMark(58, y + 22, callout.label, 17, color, 650),
        textMark(58, y + 42, callout.text, 19, palette.ink, 500),
        flowArrow(305, y + 27, db.x - 6, callout.targetY || y + 27, color, 2.2)
      );
      y += 68;
    }
  }

  // Right flank callout cards
  if (options.rightCallouts) {
    let y = 62;
    for (const callout of options.rightCallouts) {
      const color = callout.color || palette.orange;
      const rightX = db.x + db.w + 35;
      marks.push(
        cardBox(rightX, y, 260, 54, palette.orangeLight, palette.orangeBorder, 1.4),
        textMark(rightX + 14, y + 22, callout.label, 17, color, 650),
        textMark(rightX + 14, y + 42, callout.text, 19, palette.ink, 500),
        flowArrow(rightX, y + 27, db.x + db.w + 6, callout.targetY || y + 27, color, 2.2)
      );
      y += 68;
    }
  }

  return marks;
}

export function buildTopDiagramBottomTimelineMarks(options: {
  title: string;
  diagramSrc?: string;
  diagramAlt?: string;
  diagramBounds?: RectBounds;
  steps: TimelineStep[];
}): BoardMark[] {
  const marks: BoardMark[] = [];
  marks.push(...headerMark(options.title, 260, 50, 36, palette.greenBorder));

  const db = options.diagramBounds || { x: 380, y: 10, w: 560, h: 145 };
  if (options.diagramSrc) {
    marks.push({
      type: "image",
      src: options.diagramSrc,
      alt: options.diagramAlt || "Banner Diagram",
      x: db.x,
      y: db.y,
      w: db.w,
      h: db.h,
    });
  }

  // Horizontal step cards beneath
  const count = Math.max(1, Math.min(4, options.steps.length));
  const totalW = 910;
  const gap = 20;
  const arrowGap = 20;
  const cardW = Math.round((totalW - (count - 1) * (gap + arrowGap)) / count);
  const cardH = 135;
  const startY = 175;

  let currentX = 45;
  for (let i = 0; i < count; i++) {
    const step = options.steps[i];
    const colors = [
      { fill: palette.purpleLight, border: palette.purpleBorder, text: palette.purple },
      { fill: palette.blueLight, border: palette.blueBorder, text: palette.blue },
      { fill: palette.orangeLight, border: palette.orangeBorder, text: palette.orange },
      { fill: palette.greenLight, border: palette.greenBorder, text: palette.green },
    ];
    const theme = colors[i % colors.length];

    marks.push(
      cardBox(currentX, startY, cardW, cardH, theme.fill, theme.border, 1.6),
      ...badgePill(currentX + 12, startY + 12, 36, 22, `0${step.step || i + 1}`, theme.border, theme.border, palette.white, 15),
      textMark(currentX + 54, startY + 28, step.title, 21, theme.text, 650),
      textMark(currentX + 14, startY + 62, step.subtitle, 20, palette.ink, 550),
      textMark(currentX + 14, startY + 92, step.detail, 17, palette.inkMuted, 500)
    );

    if (i < count - 1) {
      const arrowX1 = currentX + cardW + 4;
      const arrowX2 = arrowX1 + gap + arrowGap - 8;
      const midY = startY + Math.round(cardH / 2);
      marks.push(flowArrow(arrowX1, midY, arrowX2, midY, theme.text, 2.5));
    }

    currentX += cardW + gap + arrowGap;
  }

  return marks;
}

export function buildStepByStepDerivationMarks(options: {
  title: string;
  steps: DerivationStep[];
  diagramSrc?: string;
  diagramAlt?: string;
  diagramBounds?: RectBounds;
  finalTakeaway?: string;
}): BoardMark[] {
  const marks: BoardMark[] = [];
  marks.push(...headerMark(options.title, 420, 50, 36, palette.blueBorder));

  // Stacked derivation cards on left/center
  const leftX = 50;
  const width = 560;
  let currentY = 58;

  for (let i = 0; i < options.steps.length; i++) {
    const step = options.steps[i];
    const isHighlight = step.highlight || i === options.steps.length - 1;
    const fill = isHighlight ? palette.goldLight : i % 2 === 0 ? palette.blueLight : palette.greenLight;
    const stroke = isHighlight ? palette.gold : i % 2 === 0 ? palette.blueBorder : palette.greenBorder;
    const h = 58;

    marks.push(
      cardBox(leftX, currentY, width, h, fill, stroke, isHighlight ? 2.4 : 1.6),
      ...badgePill(leftX + 10, currentY + 10, 48, 22, `Step ${step.stepNumber || i + 1}`, stroke, stroke, palette.white, 14),
      textMark(leftX + 68, currentY + 26, step.title, 19, palette.inkMuted, 600),
      textMark(leftX + 12, currentY + 48, step.equation, 24, palette.ink, 650),
      textMark(leftX + width - 14, currentY + 46, step.explanation, 17, palette.inkMuted, 500, "end")
    );

    if (i < options.steps.length - 1) {
      marks.push(
        flowArrow(leftX + 34, currentY + h + 2, leftX + 34, currentY + h + 16, stroke, 2.2)
      );
      currentY += h + 20;
    } else {
      currentY += h + 14;
    }
  }

  if (options.finalTakeaway) {
    marks.push(
      textMark(leftX + 12, currentY + 16, `★ ${options.finalTakeaway}`, 21, palette.green, 600)
    );
  }

  // Right reference diagram
  const db = options.diagramBounds || { x: 645, y: 24, w: 310, h: 285 };
  if (options.diagramSrc) {
    marks.push(
      cardBox(db.x - 10, db.y - 8, db.w + 20, db.h + 16, "#fafcf9", palette.divider, 1.2),
      textMark(db.x + 6, db.y + 12, "Visual Reference", 16, palette.green, 600),
      {
        type: "image",
        src: options.diagramSrc,
        alt: options.diagramAlt || "Reference Diagram",
        x: db.x,
        y: db.y + 20,
        w: db.w,
        h: db.h - 24,
      }
    );
  }

  return marks;
}

export function buildMultiPanelComparisonMarks(options: {
  title: string;
  panels: ComparisonPanel[];
}): BoardMark[] {
  const marks: BoardMark[] = [];
  marks.push(...centeredHeaderMark(options.title, 440, 500, 34, palette.greenBorder));

  const count = Math.min(2, options.panels.length);
  const panelW = 430;
  const panelH = 256;
  const startY = 56;
  const gap = 48;
  const startX = 45;

  for (let i = 0; i < count; i++) {
    const panel = options.panels[i];
    const x = startX + i * (panelW + gap);
    const fill = i === 0 ? palette.purpleLight : palette.blueLight;
    const border = i === 0 ? palette.purpleBorder : palette.blueBorder;
    const accent = i === 0 ? palette.purple : palette.blue;

    marks.push(
      cardBox(x, startY, panelW, panelH, fill, border, 1.8),
      textMark(x + 18, startY + 32, panel.title, 26, accent, 650)
    );

    if (panel.subtitle) {
      marks.push(textMark(x + 18, startY + 54, panel.subtitle, 18, palette.inkMuted, 550));
    }

    if (panel.equation) {
      marks.push(
        cardBox(x + 16, startY + 64, panelW - 32, 42, palette.white, border, 1.4),
        textMark(x + 28, startY + 94, panel.equation, 23, accent, 650)
      );
    }

    let bulletY = panel.equation ? startY + 134 : startY + 84;
    for (const pt of panel.points) {
      marks.push(
        circleMark(x + 22, bulletY - 6, 3, 3, accent, 2, accent),
        textMark(x + 34, bulletY, pt, 22, palette.ink, 500)
      );
      bulletY += 34;
    }

    if (panel.asset) {
      marks.push({
        type: "image",
        src: panel.asset.src,
        alt: panel.asset.alt,
        x: x + panelW - panel.asset.w - 14,
        y: startY + panelH - panel.asset.h - 14,
        w: panel.asset.w,
        h: panel.asset.h,
      });
    }
  }

  // Center "VS" or comparative badge
  marks.push(
    cardBox(480, startY + 110, 40, 40, palette.white, palette.greenBorder, 2),
    textMark(500, startY + 137, "VS", 19, palette.green, 700, "middle")
  );

  return marks;
}

export function buildFloatingRadialMarks(options: {
  title: string;
  diagramSrc?: string;
  diagramAlt?: string;
  diagramBounds?: RectBounds;
  nodes: RadialNode[];
}): BoardMark[] {
  const marks: BoardMark[] = [];
  marks.push(...centeredHeaderMark(options.title, 420, 500, 34, palette.greenBorder));

  const db = options.diagramBounds || { x: 380, y: 55, w: 240, h: 250 };
  const centerX = Math.round(db.x + db.w / 2);
  const centerY = Math.round(db.y + db.h / 2);

  // Subtle orbital ring
  marks.push(
    pathMark(
      `M${centerX - 180} ${centerY} A180 120 0 1 0 ${centerX + 180} ${centerY} A180 120 0 1 0 ${centerX - 180} ${centerY}`,
      palette.divider,
      1.5,
      "none",
      true
    )
  );

  if (options.diagramSrc) {
    marks.push({
      type: "image",
      src: options.diagramSrc,
      alt: options.diagramAlt || "Radial Subject",
      x: db.x,
      y: db.y,
      w: db.w,
      h: db.h,
    });
  }

  for (const node of options.nodes) {
    const rad = (node.angleDeg * Math.PI) / 180;
    const dist = node.distance || 190;
    const nodeX = Math.round(centerX + dist * Math.cos(rad));
    const nodeY = Math.round(centerY + dist * 0.65 * Math.sin(rad));
    const color = node.color || palette.green;

    // Pointer line from center subject perimeter to badge
    const pX = Math.round(centerX + (db.w / 2) * Math.cos(rad));
    const pY = Math.round(centerY + (db.h / 2) * Math.sin(rad));

    marks.push(
      flowArrow(nodeX > centerX ? nodeX - 10 : nodeX + 10, nodeY, pX, pY, color, 1.8),
      cardBox(nodeX - 70, nodeY - 18, 140, 36, palette.white, color, 1.6),
      textMark(nodeX, nodeY + 6, node.label, 17, color, 650, "middle")
    );
  }

  return marks;
}

export function buildPageWithLayout(options: BuildLayoutPageOptions): BoardPage {
  const patternDef = LayoutPatternEngine.getPattern(options.pattern);
  const diagramBounds = LayoutPatternEngine.getDiagramBounds(options.pattern, options.config);

  let marks: BoardMark[] = [];

  switch (options.pattern) {
    case "classic-split":
      marks = buildClassicSplitMarks({
        title: options.title,
        notes: options.notes || [],
        diagramSrc: options.diagramAsset?.src,
        diagramAlt: options.diagramAsset?.alt,
        diagramBounds,
        formula: options.formula,
      });
      break;

    case "inverted-split":
      marks = buildInvertedSplitMarks({
        title: options.title,
        notes: options.notes || [],
        diagramSrc: options.diagramAsset?.src,
        diagramAlt: options.diagramAsset?.alt,
        diagramBounds,
        formula: options.formula,
      });
      break;

    case "centered-focal-hero":
      marks = buildCenteredFocalHeroMarks({
        title: options.title,
        diagramSrc: options.diagramAsset?.src,
        diagramAlt: options.diagramAsset?.alt,
        diagramBounds,
        leftCallouts: options.leftCallouts,
        rightCallouts: options.rightCallouts,
      });
      break;

    case "top-diagram-bottom-timeline":
      marks = buildTopDiagramBottomTimelineMarks({
        title: options.title,
        diagramSrc: options.diagramAsset?.src,
        diagramAlt: options.diagramAsset?.alt,
        diagramBounds,
        steps: options.timelineSteps || [],
      });
      break;

    case "step-by-step-derivation":
      marks = buildStepByStepDerivationMarks({
        title: options.title,
        steps: options.derivationSteps || [],
        diagramSrc: options.diagramAsset?.src,
        diagramAlt: options.diagramAsset?.alt,
        diagramBounds,
        finalTakeaway: options.notes?.[0],
      });
      break;

    case "multi-panel-comparison":
      marks = buildMultiPanelComparisonMarks({
        title: options.title,
        panels: options.comparisonPanels || [],
      });
      break;

    case "floating-radial-annotation":
      marks = buildFloatingRadialMarks({
        title: options.title,
        diagramSrc: options.diagramAsset?.src,
        diagramAlt: options.diagramAsset?.alt,
        diagramBounds,
        nodes: options.radialNodes || [],
      });
      break;

    default:
      marks = buildClassicSplitMarks({
        title: options.title,
        notes: options.notes || [],
        diagramSrc: options.diagramAsset?.src,
        diagramAlt: options.diagramAsset?.alt,
        diagramBounds,
      });
      break;
  }

  if (options.customMarks && options.customMarks.length > 0) {
    marks.push(...options.customMarks);
  }

  // Spatially ground regions to the target diagram bounds
  let transformedRegions: DiagramRegion[] | undefined = undefined;
  if (options.regions && options.regions.length > 0) {
    const natural = options.diagramAsset?.naturalBounds || {
      x: 540,
      y: 16,
      w: 420,
      h: 300,
    };
    transformedRegions = LayoutPatternEngine.transformRegions(
      options.regions,
      natural,
      diagramBounds
    );
  }

  const page: BoardPage = {
    id: options.id,
    title: options.title,
    marks,
    ink: [],
    cursor: { x: 852, y: 250 },
    narration: options.narration,
    seconds: options.seconds || 0,
    cues: options.cues,
    ...(transformedRegions ? { regions: transformedRegions } : {}),
  };

  (page as any).layoutPattern = options.pattern;
  (page as any).layoutConfig = options.config;

  return page;
}
