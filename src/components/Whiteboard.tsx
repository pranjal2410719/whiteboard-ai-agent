"use client";

import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AudioLines, Bookmark, Check, ChevronDown, CircleCheck, Clapperboard, ChevronLeft, ChevronRight, Circle, FileStack, Image as ImageIcon, LoaderCircle, Maximize2, MessageSquareText, Mic, MicOff, Minimize2, Minus, MousePointer2, Play, Plus, Presentation, Send, SkipForward, ScreenShare, Sparkles, Type, Volume2, VolumeX, X } from "lucide-react";
import { drawingAtCue } from "@/lib/recorded-classes";
import { isCatalogKey, getStaticClassPage } from "@/lib/lessons";
import { isDiagramKey } from "@/lib/diagrams";
import { assetCatalog, type ImageAssetDefinition } from "@/lib/assets";
import type { BoardMark, BoardPage, LessonCue, Point, Preferences, StudySession, SupportedLanguage } from "@/lib/types";
import {
  CanvasAssetRegistry,
  CanvasIntelligenceEngine,
  createHeartCanvasEngine,
  humanHeartAssetMap,
  type ActionRequest,
  type ExecutionConfirmation,
  type RendererExecutionConfirmation,
} from "@/lib/canvas-intelligence";
import {
  SpatialContext,
  FlowchartManager,
  FlowchartNodeDef,
  FlowchartEdgeDef,
  Flowchart,
  BoundingBox,
} from "@/lib/spatial";

function RichText({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|Pythagorean theorem)/g).map((part, i) => part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part === "Pythagorean theorem" ? <strong key={i}>{part}</strong> : part)}</>;
}

type Tool = "pointer" | "pen" | "highlighter" | "eraser" | "rect" | "ellipse" | "text";
const colors = [{ name: "Charcoal", value: "#354139" }, { name: "Forest green", value: "#438563" }, { name: "Cornflower blue", value: "#6b90c5" }, { name: "Soft violet", value: "#a187bf" }, { name: "Apricot", value: "#df9b68" }];

export const markX = (m: BoardMark) => m.type === "path" ? Number(m.d?.match(/-?\d+(?:\.\d+)?/)?.[0] || 0) : m.x || 0;
export const mobileOffset = (x: number) => x >= 500 ? { x: -463, y: 230 } : { x: -14, y: 0 };

/**
 * Spatial Zig-Zag Canvas Layout:
 * Content is preserved across page/chapter transitions without being wiped out.
 * - Transition 1 (Page 0 -> 1): scrolls diagonally down-left (x: -1050, y: 360).
 * - Transition 2 (Page 1 -> 2): swipes diagonally down-right (x: 0, y: 720).
 * - Transition 3 (Page 2 -> 3): scrolls diagonally down-left (x: -1050, y: 1080).
 * Keeps every chapter and context permanently in the same continuous whiteboard!
 */
export function getPageOffset(index: number): Point {
  const isOdd = Math.abs(index) % 2 === 1;
  const x = isOdd ? -1050 : 0;
  const y = index * 360;
  return { x, y };
}

type CachedMark =
  | { kind: "geometry"; el: SVGGeometryElement; points: Point[]; dashed: boolean }
  | { kind: "text"; el: SVGTextElement; clipRect: SVGRectElement | null; x: number; y: number; width: number; boxWidth: number; rotate: number; ox: number; oy: number }
  | { kind: "none" };

function rotatePoint(x: number, y: number, cx: number, cy: number, deg: number): Point {
  if (!deg) return { x, y };
  const rad = (deg * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

function samplePoints(el: SVGGeometryElement, mark: BoardMark, ox: number, oy: number): Point[] {
  const cx = mark.x || 0, cy = mark.y || 0, deg = mark.rotate || 0;
  try {
    const total = el.getTotalLength();
    if (!Number.isFinite(total) || total <= 0) return [{ x: markX(mark) + ox, y: cy + oy }];
    // Dynamic curvature sampling: sample every ~4px of path length for silky-smooth curves
    const samples = Math.max(48, Math.min(240, Math.ceil(total / 4)));
    const pts: Point[] = [];
    for (let i = 0; i <= samples; i++) {
      const p = el.getPointAtLength((total * i) / samples);
      const r = rotatePoint(p.x, p.y, cx, cy, deg);
      pts.push({ x: r.x + ox, y: r.y + oy });
    }
    return pts;
  } catch {
    return [{ x: markX(mark) + ox, y: cy + oy }];
  }
}

function interpolatePoints(points: Point[], amount: number): Point {
  if (points.length <= 1) return points[0] || { x: 60, y: 60 };
  const clamped = Math.max(0, Math.min(1, amount));
  const scaled = clamped * (points.length - 1);
  const idx = Math.min(points.length - 2, Math.floor(scaled));
  const t = scaled - idx;
  const a = points[idx], b = points[idx + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function MarkView({ mark, pending = false, clipId }: { mark: BoardMark; pending?: boolean; clipId?: string }) {
  const { x = 0, y = 0 } = mark;
  const isWhite = mark.color === "#ffffff" || mark.color === "#fff" || mark.color?.toLowerCase() === "white";
  const effectiveColor = isWhite ? "#ff2a7a" : (mark.color || "#293b32");
  const shared = {
    transform: mark.rotate ? `rotate(${mark.rotate} ${x} ${y})` : undefined,
    opacity: mark.opacity ?? 1,
    filter: isWhite ? "drop-shadow(0 0 2px rgba(0,0,0,0.85))" : undefined,
  };
  if (mark.type === "text") {
    return <text {...shared} x={x} y={y} fill={effectiveColor} textAnchor={mark.textAnchor || mark.align} fontFamily="'Caveat Variable', 'Kalam', 'Noto Sans Devanagari', system-ui, cursive" fontSize={mark.size || 28} fontWeight={mark.weight || 500} clipPath={pending && clipId ? `url(#${clipId})` : undefined}>{mark.text}</text>;
  }
  if (mark.type === "image") {
    return <image {...shared} href={mark.src} x={x} y={y} width={mark.w || 0} height={mark.h || 0} preserveAspectRatio="xMidYMid meet" data-diagram="true"/>;
  }
  const painted = {
    ...shared,
    stroke: effectiveColor,
    strokeWidth: mark.strokeWidth ?? 2.6,
    fill: mark.fill || "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: mark.dashed && !pending ? undefined : 1,
    strokeDasharray: pending ? "1" : mark.dashed ? "6 6" : undefined,
    strokeDashoffset: pending ? "1" : undefined,
    fillOpacity: pending ? 0 : 1,
  };
  if (mark.type === "path") return <path {...painted} d={mark.d}/>;
  if (mark.type === "rect") return <rect {...painted} x={x} y={y} width={mark.w} height={mark.h} rx="2"/>;
  return <ellipse {...painted} cx={x} cy={y} rx={mark.w} ry={mark.h}/>;
}
export const Mark = memo(MarkView);

export function BoardThumbnail({ page, lessonKey }: { page: BoardPage; lessonKey?: string }) {
  const isDemo = Boolean(lessonKey && isCatalogKey(lessonKey));
  const staticPage = isDemo ? getStaticClassPage(lessonKey!) : page;
  const marks = isDemo ? staticPage.marks : [...page.marks, ...(page.ink || [])];
  return <svg aria-label={staticPage.title} role="img" viewBox="0 0 1000 330" className="board-thumbnail">{marks.map((mark, i) => <Mark key={i} mark={mark}/>)}</svg>;
}

export function MarkerCursor({ point, drawing, label, markerRef }: { point: Point; drawing: boolean; label?: string; markerRef?: React.RefObject<SVGGElement | null> }) {
  return <g ref={markerRef} className={`marker-cursor ${drawing ? "is-drawing" : ""}`} style={{ transform: `translate3d(${point.x}px, ${point.y}px, 0)`, willChange: "transform" }} pointerEvents="none" aria-hidden="true">
    <g transform="rotate(35) scale(0.65)"><path d="M-3 -7 -4.3 -33.5 Q-4.3 -37 0 -37 Q4.3 -37 4.3 -33.5 L3.2 -7 0 0 Z" fill="#edf1e9" stroke="#37503e" strokeWidth="1.7"/><path d="M-4.1 -27.5 4.1 -27.5 4.2 -33.5 Q4.2 -36.5 0 -36.5 Q-4.2 -36.5 -4.2 -33.5Z" fill="#7ba287" stroke="#37503e" strokeWidth="1.3"/><path d="m-3.1-8.5 6.3.1L0 0Z" fill="#365641"/><path d="m-1.7-11.5-.4-13.2" stroke="white" strokeWidth="1.8"/></g>
    {label && label !== "AI Tutor" && label !== "Ai Tutor" && (
      <g transform="translate(7 5)"><rect width="55" height="18" rx="5" fill="#3d7655"/><text x="27.5" y="12" fill="white" textAnchor="middle" fontFamily="'DM Sans Variable', sans-serif" fontSize="10" fontWeight="600">{label}</text></g>
    )}
  </g>;
}

type Props = {
  session: StudySession; paper: Preferences["paper"]; animation: number; busy: boolean;
  onInk: (id: string, ink: BoardMark[]) => void; onPage: (index: number) => void; onSave: () => void; notify: (message: string) => void;
  overridePage?: BoardPage | null; overrideIndex?: number; overrideTotal?: number; locked?: boolean;
  overrideScenes?: BoardPage[];
  playbackPlaying?: boolean; readPlayback?: () => number; playbackSceneStart?: number; playbackSceneSeconds?: number;
  playbackCues?: LessonCue[]; playbackMarkPosition?: number; playbackRevision?: number;
  onClass?: () => void; classDisabled?: boolean; classComplete?: boolean;
  tutorSpeaking?: boolean; tutorPaused?: boolean; tutorMuted?: boolean;
  listening?: boolean;
  speaking?: boolean;
  onAskMic?: () => void;
  onSendQuery?: (query: string) => void;
  onDoubtPoint?: (point: Point) => void;
  onWhiteboardStroke?: (stroke: any) => void;
  language?: SupportedLanguage;
  liveUserSpeech?: string;
  pendingQuestion?: string;
  latestReply?: string;
  onOpenTranscript?: () => void;
  onToggleVoiceReadAloud?: () => void;
  suggestions?: string[];
  cameraActive?: boolean;
  studentName?: string;
  presentationStream?: MediaStream | null;
  onStopPresent?: () => void;
  animationDuration?: number;
  doubtMarks?: BoardMark[];
  boostMode?: boolean;
  classLoading?: boolean;
  classTitle?: string;
  classTotalSeconds?: number;
  classSceneCount?: number;
  toast?: string;
  onDismissToast?: () => void;
};

function WhiteboardView({
  session, paper, animation, busy, onInk, onPage, onSave, notify,
  overridePage = null, overrideIndex = 0, overrideTotal = 1, locked = false,
  overrideScenes,
  playbackPlaying = false, readPlayback, playbackSceneStart = 0, playbackSceneSeconds = 40,
  playbackCues, playbackMarkPosition, playbackRevision = 0,
  onClass, classDisabled, classComplete, tutorSpeaking = false, tutorPaused = false, tutorMuted = false,
  listening = false, speaking = false, onAskMic, onSendQuery, onDoubtPoint, onWhiteboardStroke, language = "en",
  liveUserSpeech = "", pendingQuestion = "", latestReply = "", onOpenTranscript, onToggleVoiceReadAloud, suggestions = [],
  cameraActive = false, studentName = "You", presentationStream = null, onStopPresent,
  animationDuration = 0,
  doubtMarks = [],
  boostMode = false,
  classLoading = false,
  classTitle,
  classTotalSeconds,
  classSceneCount,
  toast,
  onDismissToast,
}: Props) {
  const [inClassQuery, setInClassQuery] = useState("");
  const isCatalogDemo = Boolean(session.data.lessonKey && isCatalogKey(session.data.lessonKey) && !session.data.classroomContext);
  const staticClassPage = useMemo(() => {
    return (isCatalogDemo && session.data.lessonKey) ? getStaticClassPage(session.data.lessonKey) : null;
  }, [isCatalogDemo, session.data.lessonKey]);
  const page = overridePage || (isCatalogDemo && (session.data.pageIndex ?? 0) === 0 && staticClassPage
    ? staticClassPage
    : (session.data.pages[session.data.pageIndex] || session.data.pages[0]));

  const activePageIndex = overridePage !== null && overridePage !== undefined
    ? (overrideIndex ?? 0)
    : (session.data.pageIndex ?? 0);

  const allPages: BoardPage[] = useMemo(() => {
    if (overrideScenes && overrideScenes.length > 0) {
      return overrideScenes;
    }
    if (session.data.pages && session.data.pages.length > 0) {
      return session.data.pages;
    }
    return [page];
  }, [overrideScenes, session.data.pages, page]);

  const [maxVisitedIndex, setMaxVisitedIndex] = useState(activePageIndex);
  useEffect(() => {
    setMaxVisitedIndex(prev => Math.max(prev, activePageIndex));
  }, [activePageIndex]);
  useEffect(() => {
    setMaxVisitedIndex(overridePage ? (overrideIndex ?? 0) : (session.data.pageIndex ?? 0));
  }, [session.id]);

  const activeOffset = useMemo(() => getPageOffset(activePageIndex), [activePageIndex]);
  const clipPrefix = useId().replace(/:/g, "");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [replayLimit, setReplayLimit] = useState<number | null>(null);
  const [timedState, setTimedState] = useState<{ pageId: string; count: number }>(() => ({ pageId: page.id, count: overridePage ? Math.ceil(playbackMarkPosition ?? 0) : page.marks.length }));
  const [replay, setReplay] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const frame = useRef(0);
  const cacheRef = useRef<(CachedMark | undefined)[]>([]);
  const clipRectsRef = useRef<(SVGRectElement | null)[]>([]);
  const activeDomIndexRef = useRef<number>(-1);
  const timedLimitRef = useRef<number>(page.marks.length);
  const gesture = useRef<{ origin: Point; points: Point[]; pan: Point; tool: Tool } | null>(null);
  const draftRef = useRef<BoardMark | null>(null);
  const previousAnimation = useRef(`${animation}:0`);
  const lastMarksCountRef = useRef<number>(page.marks.length);
  const prevReplayRef = useRef<number>(0);
  useEffect(() => {
    lastMarksCountRef.current = page.marks.length;
  }, [page.id]);
  const staticPosRef = useRef(playbackMarkPosition);
  useEffect(() => {
    staticPosRef.current = playbackMarkPosition;
  }, [playbackMarkPosition]);
  const lastMeasuredPosRef = useRef(0);

  const [cieMarks, setCieMarks] = useState<BoardMark[]>([]);
  const cieRef = useRef<CanvasIntelligenceEngine | null>(null);

  const spatialContextRef = useRef<SpatialContext>(new SpatialContext());
  const flowchartManagerRef = useRef<FlowchartManager>(new FlowchartManager(null, spatialContextRef.current));
  const [spatialMarks, setSpatialMarks] = useState<BoardMark[]>([]);
  const [localDoubtMarks, setLocalDoubtMarks] = useState<BoardMark[]>([]);

  // Sync CanvasIntelligenceEngine whenever the page or its diagram assets update
  useEffect(() => {
    const imageMark = [...page.marks, ...page.ink].find(m => m.type === "image");
    if (imageMark) {
      const srcOrAlt = imageMark.src || imageMark.alt || "";
      const matchedAsset =
        CanvasAssetRegistry.getAsset(srcOrAlt) ||
        (srcOrAlt.includes("heart") || page.id.includes("heart") ? humanHeartAssetMap : undefined);

      if (matchedAsset) {
        const placement = {
          x: imageMark.x ?? (matchedAsset.assetId === "heart-diagram" ? 550 : 515),
          y: imageMark.y ?? (matchedAsset.assetId === "heart-diagram" ? 25 : 30),
          w: imageMark.w ?? (matchedAsset.assetId === "heart-diagram" ? 370 : 430),
          h: imageMark.h ?? (matchedAsset.assetId === "heart-diagram" ? 250 : 270),
        };
        if (!cieRef.current || cieRef.current.getCanvasState().activeAssetId !== matchedAsset.assetId) {
          cieRef.current = new CanvasIntelligenceEngine(matchedAsset, placement);
        } else {
          cieRef.current.repositionAsset(placement);
        }
        setCieMarks(cieRef.current.getActiveMarks());
      }
    } else {
      if (cieRef.current) {
        cieRef.current.clearAllAnnotations();
        setCieMarks([]);
      }
    }
  }, [page.id, page.marks, page.ink]);

  const executeCieAction = useCallback(async (actionFn: (engine: CanvasIntelligenceEngine) => ExecutionConfirmation): Promise<RendererExecutionConfirmation> => {
    if (!cieRef.current) {
      const img = [...page.marks, ...page.ink].find(m => m.type === "image");
      const srcOrAlt = img?.src || img?.alt || "";
      const matchedAsset = CanvasAssetRegistry.getAsset(srcOrAlt) || humanHeartAssetMap;
      cieRef.current = new CanvasIntelligenceEngine(matchedAsset, {
        x: img?.x ?? (matchedAsset.assetId === "heart-diagram" ? 550 : 515),
        y: img?.y ?? (matchedAsset.assetId === "heart-diagram" ? 25 : 30),
        w: img?.w ?? (matchedAsset.assetId === "heart-diagram" ? 370 : 430),
        h: img?.h ?? (matchedAsset.assetId === "heart-diagram" ? 250 : 270),
      });
    }
    const engine = cieRef.current;
    const res = actionFn(engine);
    if (!res.success) {
      return {
        ...res,
        renderedInDOM: false,
        domElementCount: 0,
        renderedLayer: "teacher-annotations",
        verifiedAt: Date.now(),
      };
    }

    setCieMarks([...engine.getActiveMarks()]);

    // Wait for React commit and SVG render with frame polling
    const svg = svgRef.current;
    let elements = svg?.querySelectorAll(`[data-annotation-id="${res.actionId}"]`);
    if (!elements || elements.length === 0) {
      const start = performance.now();
      while (performance.now() - start < 200) {
        await new Promise(resolve => setTimeout(resolve, 16));
        elements = svg?.querySelectorAll(`[data-annotation-id="${res.actionId}"]`);
        if (elements && elements.length > 0) break;
      }
    }
    const isRendered = Boolean(elements && elements.length > 0);

    let domBBox: { x: number; y: number; width: number; height: number } | undefined = undefined;
    if (isRendered && elements && elements[0]) {
      try {
        const el = elements[0] as SVGGraphicsElement;
        if (typeof el.getBBox === "function") {
          const bbox = el.getBBox();
          domBBox = { x: Math.round(bbox.x), y: Math.round(bbox.y), width: Math.round(bbox.width), height: Math.round(bbox.height) };
        }
      } catch {
        // Fallback
      }
    }

    return {
      ...res,
      renderedInDOM: isRendered,
      domElementCount: elements?.length || 0,
      domBBox,
      renderedLayer: "teacher-annotations",
      verifiedAt: Date.now(),
    };
  }, [page.marks, page.ink]);

  const eraseCieAction = useCallback(async (elementIdOrActionId: string): Promise<RendererExecutionConfirmation> => {
    const engine = cieRef.current || (cieRef.current = createHeartCanvasEngine());
    const res = engine.eraseTeacherMark(elementIdOrActionId);
    setCieMarks([...engine.getActiveMarks()]);

    const svg = svgRef.current;
    const targetId = elementIdOrActionId.trim().toLowerCase();
    let elements = svg?.querySelectorAll(`[data-annotation-id="${targetId}"], [data-element-id="${targetId}"]`);
    if (elements && elements.length > 0) {
      const start = performance.now();
      while (performance.now() - start < 200) {
        await new Promise(resolve => setTimeout(resolve, 16));
        elements = svg?.querySelectorAll(`[data-annotation-id="${targetId}"], [data-element-id="${targetId}"]`);
        if (!elements || elements.length === 0) break;
      }
    }
    const stillInDOM = Boolean(elements && elements.length > 0);

    return {
      ...res,
      renderedInDOM: !stillInDOM,
      domElementCount: 0,
      renderedLayer: "teacher-annotations",
      verifiedAt: Date.now(),
    };
  }, []);

  const repositionImageAction = useCallback(async (placement: { x: number; y: number; w: number; h: number }): Promise<RendererExecutionConfirmation> => {
    const engine = cieRef.current || (cieRef.current = createHeartCanvasEngine());
    engine.repositionAsset(placement);
    setCieMarks([...engine.getActiveMarks()]);

    const svg = svgRef.current;
    let elements = svg?.querySelectorAll(`[data-layer="teacher-annotations"] [data-cie-mark="true"]`);
    const activeMarksCount = engine.getActiveMarks().length;
    if (activeMarksCount > 0 && (!elements || elements.length === 0)) {
      const start = performance.now();
      while (performance.now() - start < 200) {
        await new Promise(resolve => setTimeout(resolve, 16));
        elements = svg?.querySelectorAll(`[data-layer="teacher-annotations"] [data-cie-mark="true"]`);
        if (elements && elements.length > 0) break;
      }
    }
    const renderedInDOM = activeMarksCount === 0 || Boolean(elements && elements.length > 0);

    return {
      actionId: `reposition_${Date.now()}`,
      success: true,
      action: "highlight",
      targetElementId: engine.getCanvasState().activeAssetId || "asset",
      marks: engine.getActiveMarks(),
      canvasState: engine.getCanvasState(),
      renderedInDOM,
      domElementCount: elements?.length || 0,
      renderedLayer: "teacher-annotations",
      verifiedAt: Date.now(),
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__qrieCIE = {
      getEngine: () => cieRef.current,
      getRegistry: () => CanvasAssetRegistry,
      listRegisteredAssets: () => CanvasAssetRegistry.listRegisteredAssets(),
      switchAsset: (idOrAlias: string) => {
        const asset = CanvasAssetRegistry.getAsset(idOrAlias);
        if (asset) {
          const placement = {
            x: asset.assetId === "heart-diagram" ? 580 : asset.assetId === "mitochondria" ? 550 : 515,
            y: asset.assetId === "heart-diagram" ? 16 : asset.assetId === "mitochondria" ? 12 : 30,
            w: asset.assetId === "heart-diagram" ? 270 : asset.assetId === "mitochondria" ? 390 : 430,
            h: asset.assetId === "heart-diagram" ? 298 : asset.assetId === "mitochondria" ? 310 : 270,
          };
          cieRef.current = new CanvasIntelligenceEngine(asset, placement);
          setCieMarks([]);
          return true;
        }
        return false;
      },
      setSafetyPolicy: (policy: any) => {
        cieRef.current?.setSafetyPolicy(policy);
      },
      executeAction: (req: ActionRequest) => executeCieAction(eng => eng.executeAction(req)),
      highlightElement: (id: string, color?: string, style?: "fill" | "halo" | "box") =>
        executeCieAction(eng => eng.highlightElement(id, color, style)),
      circleElement: (id: string, color?: string) =>
        executeCieAction(eng => eng.circleElement(id, color)),
      underlineElement: (id: string, color?: string) =>
        executeCieAction(eng => eng.underlineElement(id, color)),
      drawArrow: (fromId: string, toId: string, color?: string, label?: string) =>
        executeCieAction(eng => eng.drawArrow(fromId, toId, color, label)),
      addAnnotation: (id: string, text: string, color?: string) =>
        executeCieAction(eng => eng.addAnnotation(id, text, color)),
      addLabel: (id: string, label?: string, color?: string) =>
        executeCieAction(eng => eng.addLabel(id, label, color)),
      eraseTeacherMark: (id: string) => eraseCieAction(id),
      clearAllAnnotations: () => {
        const engine = cieRef.current || (cieRef.current = createHeartCanvasEngine());
        const res = engine.clearAllAnnotations();
        setCieMarks([]);
        return res;
      },
      repositionImage: repositionImageAction,
      getCanvasState: () => cieRef.current?.getCanvasState() || null,
      getRenderedLayers: () => {
        const svg = svgRef.current;
        return {
          assets: svg?.querySelectorAll('[data-layer="assets"] > *').length || 0,
          teacherPermanent: svg?.querySelectorAll('[data-layer="teacher-permanent"] > *').length || 0,
          teacherAnnotations: svg?.querySelectorAll('[data-layer="teacher-annotations"] > *').length || 0,
          doubtMarks: svg?.querySelectorAll('[data-layer="doubt-marks"] > *').length || 0,
          student: svg?.querySelectorAll('[data-layer="student"] > *').length || 0,
          overlays: svg?.querySelectorAll('[data-layer="overlays"] > *').length || 0,
        };
      },
    };

    (window as any).__qrieSpatial = {
      getContext: () => spatialContextRef.current,
      getFlowchartManager: () => flowchartManagerRef.current,
      drawFlowchart: (
        flowchartId: string,
        title: string,
        nodes: FlowchartNodeDef[],
        edges: FlowchartEdgeDef[],
        startX?: number,
        startY?: number,
        gap?: number
      ) => {
        const fm = flowchartManagerRef.current;
        const fc = fm.createFlowchart(flowchartId, title, nodes, edges, startX, startY, gap);
        const marks = fm.flowchartToBoardMarks(fc);
        setSpatialMarks(prev => [...prev.filter(m => !m.elementId?.startsWith(flowchartId)), ...marks]);
        return fc;
      },
      highlightFlowchartNode: (
        flowchartId: string,
        nodeQuery: string | number,
        style?: string,
        color?: string
      ) => {
        const fm = flowchartManagerRef.current;
        const res = fm.highlightNode(flowchartId, nodeQuery, style, color);
        if (res.success && res.createdElements) {
          const annMarks = fm.annotationsToBoardMarks(res.createdElements);
          setSpatialMarks(prev => [...prev, ...annMarks]);
        }
        return res;
      },
      clearFlowchartHighlights: (flowchartId: string, nodeQuery: string | number) => {
        const fm = flowchartManagerRef.current;
        const sem = fm.getNode(flowchartId, nodeQuery);
        const annIds = sem ? [...sem.attachedAnnotations] : [];
        const count = fm.clearNodeHighlights(flowchartId, nodeQuery);
        if (annIds.length > 0) {
          setSpatialMarks(prev => prev.filter(m => !annIds.some(aid => m.actionId === aid || m.actionId?.startsWith(`${aid}_`))));
        }
        return count;
      },
      clearAllFlowcharts: () => {
        spatialContextRef.current = new SpatialContext();
        flowchartManagerRef.current = new FlowchartManager(null, spatialContextRef.current);
        setSpatialMarks([]);
      },
      inspectFlowchart: (flowchartId: string) => {
        return flowchartManagerRef.current.inspectFlowchartContext(flowchartId);
      },
      calculateRelativePosition: (
        ref: any,
        placement?: string,
        width?: number,
        height?: number,
        gap?: number,
        align?: string
      ) => {
        return spatialContextRef.current.calculateRelativePosition(ref, placement, width, height, gap, align);
      },
      computeAlignment: (ids: string[], to?: string) => {
        return spatialContextRef.current.computeAlignment(ids, to);
      },
      computeDistribution: (ids: string[], dir?: string, gap?: number | null) => {
        return spatialContextRef.current.computeDistribution(ids, dir, gap);
      },
      findNonOverlappingSpot: (
        x: number,
        y: number,
        w: number,
        h: number,
        stepY?: number,
        max?: number
      ) => {
        return spatialContextRef.current.findNonOverlappingSpot(x, y, w, h, stepY, max);
      },
      addDoubtMarks: (marks: BoardMark[]) => {
        setLocalDoubtMarks(prev => [...prev, ...marks]);
      },
      clearDoubtMarks: () => {
        setLocalDoubtMarks([]);
        if (page && page.doubtMarks) {
          page.doubtMarks = [];
        }
      },
      getDoubtMarks: () => {
        return [...(page?.doubtMarks || []), ...localDoubtMarks];
      },
    };
  }, [executeCieAction, eraseCieAction, repositionImageAction]);

  const shouldStack = narrow && page.marks.some(m => markX(m) >= 500);
  const stageWidth = shouldStack ? 500 : 1000, stageHeight = shouldStack ? 550 : 330;
  const place = (m: BoardMark) => { const o = mobileOffset(markX(m)); return shouldStack ? `translate(${o.x} ${o.y})` : undefined; };

  const cursorOffset = shouldStack ? mobileOffset(page.cursor.x) : { x: 0, y: 0 };
  const cursor = { x: Math.max(0, Math.min(stageWidth - 75, page.cursor.x + cursorOffset.x)), y: Math.max(0, Math.min(stageHeight - 28, page.cursor.y + cursorOffset.y)) };
  const lastMarkerPointRef = useRef<Point>(cursor);

  const placeMarker = useCallback((point: Point) => {
    lastMarkerPointRef.current = point;
    const el = markerRef.current; if (!el) return;
    const x = Math.max(0, Math.min(stageWidth - 75, point.x)), y = Math.max(0, Math.min(stageHeight - 28, point.y));
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, [stageWidth, stageHeight]);

  const applyMarkProgress = useCallback((idx: number, amount: number) => {
    const entry = cacheRef.current[idx];
    if (!entry || entry.kind === "none") return;
    const clamped = Math.max(0, Math.min(1, amount));
    if (entry.kind === "text") {
      if (clamped >= 1) {
        entry.el.removeAttribute("clip-path");
      } else {
        entry.el.setAttribute("clip-path", `url(#${clipPrefix}-${idx})`);
        entry.clipRect?.setAttribute("width", String(Math.max(0, (entry.boxWidth + 20) * clamped)));
      }
      return;
    }
    if (clamped >= 1) {
      if (entry.dashed) entry.el.removeAttribute("pathLength");
      entry.el.style.strokeDasharray = entry.dashed ? "6 6" : "";
      entry.el.style.strokeDashoffset = "";
      entry.el.style.fillOpacity = "";
    } else {
      if (entry.dashed && !entry.el.hasAttribute("pathLength")) entry.el.setAttribute("pathLength", "1");
      entry.el.style.strokeDasharray = "1";
      entry.el.style.strokeDashoffset = String(1 - clamped);
      entry.el.style.fillOpacity = String(clamped < 0.6 ? 0 : (clamped - 0.6) / 0.4);
    }
  }, [clipPrefix]);

  const tipForCachedMark = useCallback((idx: number, amount: number): Point | null => {
    const entry = cacheRef.current[idx];
    if (!entry || entry.kind === "none") return null;
    if (entry.kind === "geometry") return interpolatePoints(entry.points, amount);
    const clamped = Math.max(0, Math.min(1, amount));
    const localX = entry.x + entry.width * clamped;
    // Subtle cursive handwriting bounce as letters and words are formed
    const bounce = clamped < 1 ? Math.sin(clamped * Math.PI * Math.max(1, entry.width / 18)) * 2.8 : 0;
    const rotated = rotatePoint(localX, entry.y + 1 + bounce, entry.x, entry.y, entry.rotate);
    return { x: rotated.x + entry.ox, y: rotated.y + entry.oy };
  }, []);

  const measureMark = useCallback((idx: number, mark: BoardMark): CachedMark | undefined => {
    const shape = layerRef.current?.querySelector(`[data-tutor-mark="${idx}"] > *`) ||
      layerRef.current?.querySelector(`[data-tutor-mark="doubt-${idx}"] > *`);
    if (!shape) return undefined;
    const offset = shouldStack ? mobileOffset(markX(mark)) : { x: 0, y: 0 };
    if (shape instanceof SVGTextElement) {
      let width = (mark.text?.length || 1) * (mark.size || 28) * 0.4;
      let bx = (mark.x || 0) - 8, by = (mark.y || 100) - (mark.size || 28), bw = width + 16, bh = (mark.size || 28) * 1.4;
      try {
        width = shape.getComputedTextLength();
        const bbox = shape.getBBox();
        bx = bbox.x; by = bbox.y; bw = bbox.width; bh = bbox.height;
      } catch { /* Fallback to estimated bounds if hidden. */ }
      const clipRect = clipRectsRef.current[idx] || null;
      if (clipRect) {
        clipRect.setAttribute("x", String(bx - 10));
        clipRect.setAttribute("y", String(by - 10));
        clipRect.setAttribute("height", String(bh + 20));
      }
      return { kind: "text", el: shape, clipRect, x: mark.x || 0, y: mark.y || 120, width, boxWidth: bw, rotate: mark.rotate || 0, ox: offset.x, oy: offset.y };
    }
    if (shape instanceof SVGGeometryElement) {
      return { kind: "geometry", el: shape, points: samplePoints(shape, mark, offset.x, offset.y), dashed: Boolean(mark.dashed) };
    }
    return { kind: "none" };
  }, [shouldStack]);

  // Clear geometry cache and reset positions when the active page or responsive layout changes.
  useLayoutEffect(() => {
    cacheRef.current = [];
    clipRectsRef.current = [];
    activeDomIndexRef.current = -1;
    lastMeasuredPosRef.current = 0;
    lastMarkerPointRef.current = cursor;
    const initCount = overridePage ? Math.ceil(playbackMarkPosition ?? 0) : page.marks.length;
    timedLimitRef.current = initCount;
    setTimedState({ pageId: page.id, count: initCount });
  }, [page.id, shouldStack, overridePage]);

  // Re-measure text marks once web fonts finish loading so clip rects & marker tips match Caveat glyphs.
  useEffect(() => {
    let active = true;
    document.fonts?.ready.then(() => {
      if (!active) return;
      for (let i = 0; i < cacheRef.current.length; i++) {
        if (cacheRef.current[i]?.kind === "text" && page.marks[i]) {
          cacheRef.current[i] = measureMark(i, page.marks[i]);
        }
      }
    });
    return () => { active = false; };
  }, [page.id, page.marks, measureMark]);

  useEffect(() => {
    const node = svgRef.current?.parentElement; if (!node) return;
    const observer = new ResizeObserver(entries => setNarrow(entries[0].contentRect.width < 530));
    observer.observe(node); return () => observer.disconnect();
  }, []);

  const currentPageKeyRef = useRef<string>(`${session.data.lessonKey || session.id}:${page.id}`);
  useEffect(() => {
    const key = `${session.data.lessonKey || session.id}:${page.id}`;
    if (currentPageKeyRef.current !== key) {
      currentPageKeyRef.current = key;
      gesture.current = null;
      setPan({ x: 0, y: 0 }); setZoom(1);
    }
  }, [page.id, session.id, session.data.lessonKey]);

  useEffect(() => { if (locked) { gesture.current = null; } }, [locked]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduceMotion(media.matches);
    change(); media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  // Measure any newly revealed tutor marks once upon mount.
  const timedStaticPos = overridePage && playbackMarkPosition !== undefined ? Math.max(0, Math.min(page.marks.length, playbackMarkPosition)) : page.marks.length;
  const activeTimedCount = timedState.pageId === page.id ? timedState.count : Math.ceil(timedStaticPos);
  const effectiveTimedLimit = overridePage ? (playbackPlaying && !reduceMotion ? activeTimedCount : Math.ceil(timedStaticPos)) : undefined;
  const visibleLimit = overridePage ? effectiveTimedLimit : (replaying && replayLimit !== null ? replayLimit : undefined);
  const visibleCount = visibleLimit === undefined ? page.marks.length : Math.min(page.marks.length, visibleLimit);

  const isStale = (entry: CachedMark | undefined) => !entry || entry.kind === "none" || !entry.el.isConnected;

  useLayoutEffect(() => {
    for (let i = visibleCount; i < cacheRef.current.length; i++) cacheRef.current[i] = undefined;
    for (let i = 0; i < visibleCount; i++) {
      if (isStale(cacheRef.current[i]) && page.marks[i]) {
        cacheRef.current[i] = measureMark(i, page.marks[i]);
      }
    }
  }, [visibleCount, page.marks, measureMark]);

  // Path A: Standalone Replay / New Tutor Turn animation (60fps+ direct DOM updates, 1 React render per mark).
  useEffect(() => {
    if (overridePage && playbackPlaying) {
      cancelAnimationFrame(frame.current);
      previousAnimation.current = `${animation}:${replay}`;
      setReplaying(false); setReplayLimit(null);
      return;
    }
    const currentDoubtMarks = (doubtMarks && doubtMarks.length > 0) ? doubtMarks : (overridePage?.doubtMarks || []);
    const isDoubtTurn = Boolean(overridePage && !playbackPlaying && currentDoubtMarks.length > 0);
    const marksList = isDoubtTurn ? currentDoubtMarks : page.marks;

    const token = `${animation}:${replay}:${marksList.length}`;
    if (previousAnimation.current === token) { setReplaying(false); setReplayLimit(null); return; }
    previousAnimation.current = token;
    if (reduceMotion || !marksList.length) return;

    const isReplayClick = prevReplayRef.current !== replay;
    prevReplayRef.current = replay;

    // If this is a replay click or doubt turn, start from mark 0.
    // If it's a live tutor turn, animate starting from the newly added marks!
    const prevCount = lastMarksCountRef.current;
    const startIndex = isReplayClick || isDoubtTurn ? 0 : Math.min(marksList.length, Math.max(0, prevCount));
    lastMarksCountRef.current = marksList.length;

    // If no new marks were added and not a replay, keep everything visible and finish
    if (!isReplayClick && !isDoubtTurn && startIndex >= marksList.length) {
      setReplaying(false);
      setReplayLimit(null);
      return;
    }

    setReplaying(true);
    setReplayLimit(startIndex + 1);
    let index = startIndex, started = performance.now();

    const marksToAnimate = Math.max(1, marksList.length - startIndex);
    const targetPerMark = (animationDuration && animationDuration > 0)
      ? Math.floor(animationDuration / marksToAnimate)
      : 0;

    const tick = (now: number) => {
      const mark = marksList[index];
      if (!mark) { setReplaying(false); setReplayLimit(null); return; }
      if (isStale(cacheRef.current[index])) cacheRef.current[index] = measureMark(index, mark);

      const duration = targetPerMark > 0
        ? Math.max(400, Math.min(3000, targetPerMark))
        : (mark.type === "text" ? Math.min(900, 170 + (mark.text?.length || 1) * 16) : 420);
      const raw = Math.min(1, (now - started) / duration);
      const eased = raw < 1 ? 1 - Math.pow(1 - raw, 1.35) : 1;

      if (activeDomIndexRef.current !== index) {
        if (activeDomIndexRef.current >= 0 && activeDomIndexRef.current < index) {
          applyMarkProgress(activeDomIndexRef.current, 1);
        }
        activeDomIndexRef.current = index;
      }
      applyMarkProgress(index, eased);
      const tip = tipForCachedMark(index, eased);
      if (tip) {
        const prev = lastMarkerPointRef.current;
        const dist = Math.hypot(tip.x - prev.x, tip.y - prev.y);
        // Glide between distant marks instead of single-frame teleportation
        if (dist > 45 && eased < 0.15) {
          placeMarker({ x: prev.x + (tip.x - prev.x) * 0.45, y: prev.y + (tip.y - prev.y) * 0.45 });
        } else {
          placeMarker(tip);
        }
      }

      if (raw >= 1) {
        applyMarkProgress(index, 1);
        index++;
        started = now;
        if (index >= marksList.length) {
          activeDomIndexRef.current = -1;
          setReplaying(false);
          setReplayLimit(null);
          const off = shouldStack ? mobileOffset(page.cursor.x) : { x: 0, y: 0 };
          placeMarker({ x: page.cursor.x + off.x, y: page.cursor.y + off.y });
          return;
        }
        setReplayLimit(index + 1);
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [animation, replay, animationDuration, page.id, page.marks, page.cursor, overridePage, playbackPlaying, doubtMarks, reduceMotion, shouldStack, applyMarkProgress, measureMark, placeMarker, tipForCachedMark]);

  // Path B: Prerecorded / Timed Class 60fps+ rAF loop locked to readPlayback().
  useEffect(() => {
    if (!overridePage) return;
    if (!playbackPlaying || reduceMotion || !readPlayback || !page.marks.length) {
      const staticPos = staticPosRef.current ?? page.marks.length;
      const ceilCount = Math.min(page.marks.length, Math.ceil(staticPos));
      timedLimitRef.current = ceilCount;
      setTimedState({ pageId: page.id, count: ceilCount });
      return;
    }

    const computePos = () => {
      const elapsedInScene = Math.max(0, readPlayback() - playbackSceneStart);
      if (playbackCues?.length) return drawingAtCue(playbackCues, elapsedInScene).markProgress;
      return Math.min(1, elapsedInScene / Math.max(1, playbackSceneSeconds)) * page.marks.length;
    };

    const initialLimit = Math.min(page.marks.length, Math.ceil(computePos()));
    timedLimitRef.current = initialLimit;
    setTimedState({ pageId: page.id, count: initialLimit });

    let rafId = 0;
    const tick = () => {
      const pos = Math.max(0, Math.min(page.marks.length, computePos()));
      lastMeasuredPosRef.current = pos;
      const needed = Math.min(page.marks.length, Math.ceil(pos));
      if (needed !== timedLimitRef.current) {
        if (activeDomIndexRef.current >= 0 && activeDomIndexRef.current < needed - 1) {
          applyMarkProgress(activeDomIndexRef.current, 1);
        }
        timedLimitRef.current = needed;
        setTimedState({ pageId: page.id, count: needed });
      }
      if (pos > 0) {
        const idx = Math.max(0, Math.ceil(pos) - 1);
        const amt = pos - idx;
        if (isStale(cacheRef.current[idx]) && page.marks[idx]) cacheRef.current[idx] = measureMark(idx, page.marks[idx]);
        if (activeDomIndexRef.current !== idx) {
          if (activeDomIndexRef.current >= 0 && activeDomIndexRef.current < idx) {
            applyMarkProgress(activeDomIndexRef.current, 1);
          }
          activeDomIndexRef.current = idx;
        }
        applyMarkProgress(idx, amt);
        const tip = tipForCachedMark(idx, amt);
        if (tip) {
          const prev = lastMarkerPointRef.current;
          const dist = Math.hypot(tip.x - prev.x, tip.y - prev.y);
          // Glide between distant marks instead of single-frame teleportation
          if (dist > 45 && amt < 0.15) {
            placeMarker({ x: prev.x + (tip.x - prev.x) * 0.45, y: prev.y + (tip.y - prev.y) * 0.45 });
          } else {
            placeMarker(tip);
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [overridePage, playbackPlaying, reduceMotion, readPlayback, playbackSceneStart, playbackSceneSeconds, playbackCues, playbackRevision, page.id, page.marks, applyMarkProgress, measureMark, placeMarker, tipForCachedMark]);

  useEffect(() => {
    if (!overridePage || (playbackPlaying && !reduceMotion)) return;
    const staticPos = playbackMarkPosition ?? page.marks.length;
    const ceilCount = Math.min(page.marks.length, Math.ceil(staticPos));
    timedLimitRef.current = ceilCount;
    setTimedState({ pageId: page.id, count: ceilCount });
  }, [overridePage, playbackPlaying, reduceMotion, playbackMarkPosition, page.marks.length, page.id]);

  // Synchronize newly mounted marks and paused / sought states immediately on commit.
  useLayoutEffect(() => {
    if (!overridePage) return;
    if (playbackPlaying && !reduceMotion) {
      const pos = lastMeasuredPosRef.current;
      if (pos > 0 && visibleCount > 0) {
        const idx = visibleCount - 1;
        const amt = Math.max(0, Math.min(1, pos - idx));
        applyMarkProgress(idx, amt);
        const tip = tipForCachedMark(idx, amt);
        if (tip) {
          const prev = lastMarkerPointRef.current;
          const dist = Math.hypot(tip.x - prev.x, tip.y - prev.y);
          // Glide between distant marks instead of single-frame teleportation
          if (dist > 45 && amt < 0.15) {
            placeMarker({ x: prev.x + (tip.x - prev.x) * 0.45, y: prev.y + (tip.y - prev.y) * 0.45 });
          } else {
            placeMarker(tip);
          }
        }
      }
      return;
    }
    const pos = Math.max(0, Math.min(page.marks.length, playbackMarkPosition ?? page.marks.length));
    for (let i = 0; i < visibleCount; i++) {
      if (isStale(cacheRef.current[i]) && page.marks[i]) cacheRef.current[i] = measureMark(i, page.marks[i]);
      const amt = reduceMotion || i < visibleCount - 1 ? 1 : pos - i;
      applyMarkProgress(i, amt);
    }
    if (!reduceMotion && pos > 0 && visibleCount > 0) {
      const idx = visibleCount - 1;
      const tip = tipForCachedMark(idx, pos - idx);
      if (tip) { placeMarker(tip); return; }
    }
    const off = shouldStack ? mobileOffset(page.cursor.x) : { x: 0, y: 0 };
    placeMarker({ x: page.cursor.x + off.x, y: page.cursor.y + off.y });
  }, [overridePage, playbackPlaying, reduceMotion, playbackMarkPosition, visibleCount, page.marks, page.cursor, shouldStack, applyMarkProgress, measureMark, placeMarker, tipForCachedMark]);

  useEffect(() => {
    if (!expanded) return;
    const before = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = before; };
  }, [expanded]);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setExpanded(false); return; }
      if (e.target instanceof HTMLElement && (e.target.closest("input, textarea, [contenteditable=true]") || document.querySelector('[role="dialog"]'))) return;
      if (e.key === " " && onClass && !overridePage && !(e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable=true]"))) {
        e.preventDefault();
        onClass();
        return;
      }
      if (e.key.toLowerCase() === "m" && onAskMic && !(e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable=true]"))) {
        e.preventDefault();
        onAskMic();
        return;
      }
    };
    document.addEventListener("keydown", keydown); return () => document.removeEventListener("keydown", keydown);
  }, [onClass, overridePage, onAskMic]);

  // Real Frame-Time & FPS Runtime Profiler
  const [measuredFps, setMeasuredFps] = useState<number>(60);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    let animId: number;
    const measure = (now: number) => {
      if (lastFrameTimeRef.current > 0) {
        const delta = now - lastFrameTimeRef.current;
        if (delta > 0 && delta < 100) {
          frameTimesRef.current.push(delta);
          if (frameTimesRef.current.length > 60) {
            frameTimesRef.current.shift();
          }
          const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
          const currentFps = Math.min(144, Math.max(30, Math.round(1000 / avg)));
          setMeasuredFps(prev => (Math.abs(prev - currentFps) >= 3 ? currentFps : prev));
        }
      }
      lastFrameTimeRef.current = now;
      animId = requestAnimationFrame(measure);
    };
    animId = requestAnimationFrame(measure);

    if (typeof window !== "undefined") {
      (window as any).__CHALKLY_PERF__ = {
        getMeasuredFps: () => measuredFps,
        getFrameIntervals: () => [...frameTimesRef.current],
        getAverageFrameTime: () => {
          const times = frameTimesRef.current;
          return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 16.67;
        },
        isBoostActive: () => boostMode,
      };
    }

    return () => cancelAnimationFrame(animId);
  }, [boostMode, measuredFps]);

  const getPoint = (e: ReactPointerEvent<SVGSVGElement>, root = false): Point => {
    const matrix = (root ? svgRef.current : layerRef.current)?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    const offset = shouldStack && !root ? (gesture.current ? mobileOffset(gesture.current.origin.x) : p.y > 272 ? { x: -463, y: 230 } : { x: -14, y: 0 }) : { x: 0, y: 0 };
    const rawX = p.x - offset.x;
    const rawY = p.y - offset.y;
    const localX = root ? rawX : rawX - activeOffset.x;
    const localY = root ? rawY : rawY - activeOffset.y;
    return { x: Math.round(localX * 10) / 10, y: Math.round(localY * 10) / 10 };
  };
  const pointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    // Student Voice-Only Mode: strictly only doubt-point pinpointing is permitted.
    // Freehand drawing and canvas panning are disabled to maintain lecture focus.
    if (e.button !== 0) return;
    const point = getPoint(e, false);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    gesture.current = { origin: point, points: [point], pan: { ...pan }, tool: "pointer" };
    onDoubtPoint?.(point);
    onWhiteboardStroke?.({ type: "doubt_point", point, boostMode });
  };
  const pointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    // Freehand drawing and canvas panning are disabled in student voice-only mode.
    // Pointer drag is strictly ignored.
  };
  const pointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    gesture.current = null;
  };

  const drawing = !overridePage && replaying;
  const visibleMarks = page.marks.slice(0, visibleCount);
  const activeMarkPending = !reduceMotion && ((drawing && visibleCount > 0) || (Boolean(overridePage) && playbackPlaying && visibleCount > 0));

  return <>
    {expanded && <div className="board-backdrop"/>}
    <section className={`board-card${expanded ? " is-expanded" : ""}${overridePage ? " has-class" : ""}${overridePage && locked ? " class-playing" : ""}${boostMode ? " boost-mode-active" : ""}`} data-boost-mode={boostMode ? "true" : "false"} data-measured-fps={measuredFps} aria-label="Interactive lesson whiteboard">
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={16} />
          <span>{toast}</span>
          <button type="button" aria-label="Dismiss notification" onClick={onDismissToast}>
            <X size={14} />
          </button>
        </div>
      )}
      <div className="board-header"><div className="board-heading"><Presentation size={18}/><h2>Whiteboard</h2><span className="live-badge"><i className={busy || drawing ? "pulsing" : ""}/>{busy ? "Demonstrating" : overridePage ? classComplete ? "Complete" : locked ? "Class" : "Paused" : drawing ? "Drawing" : listening ? "Listening" : speaking ? "Speaking" : "Live"}</span></div>
        {suggestions && suggestions.length > 0 && !overridePage && (
          <div className="board-header-prompts" role="toolbar" aria-label="Lesson study actions">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                className="board-prompt-pill"
                onClick={() => onSendQuery?.(s)}
                disabled={busy}
              >
                <Sparkles size={11}/>
                <span>{s}</span>
              </button>
            ))}
          </div>
        )}
        <div className="board-actions">{onClass && <button type="button" className="board-class-button" aria-label="Watch prerecorded class" title="Watch the two-minute prerecorded class" onClick={() => { setExpanded(false); onClass(); }} disabled={classDisabled}><Clapperboard size={14}/><span>Watch class</span></button>}{!overridePage && <><button type="button" className="replay-button" title={drawing ? "Finish drawing" : "Replay the tutor’s drawing"} aria-label={drawing ? "Finish drawing" : "Replay the tutor’s drawing"} onClick={() => {
          if (drawing) {
            cancelAnimationFrame(frame.current);
            for (let i = 0; i < page.marks.length; i++) {
              if (isStale(cacheRef.current[i]) && page.marks[i]) cacheRef.current[i] = measureMark(i, page.marks[i]);
              applyMarkProgress(i, 1);
            }
            activeDomIndexRef.current = -1;
            setReplaying(false); setReplayLimit(null);
            placeMarker(cursor);
          } else setReplay(n => n + 1);
        }}>{drawing ? <SkipForward size={13}/> : <Play size={12}/>}<span>{drawing ? "Finish" : "Replay"}</span></button><span className="small-divider"/></>}{onOpenTranscript && <><button type="button" className="icon-button" title="View conversation history" aria-label="View conversation history" onClick={onOpenTranscript}><MessageSquareText size={16}/></button><span className="small-divider"/></>}<button className={`icon-button bookmark-action ${session.data.saved ? "is-saved" : ""}`} title={session.data.saved ? "Remove from saved boards" : "Save board"} aria-label={session.data.saved ? "Remove from saved boards" : "Save board"} onClick={onSave}><Bookmark size={16} fill={session.data.saved ? "currentColor" : "none"}/></button><span className="small-divider"/><button className="icon-button" title={expanded ? "Exit expanded view" : "Expand whiteboard"} aria-label={expanded ? "Exit expanded view" : "Expand whiteboard"} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button></div>
      </div>
      <div className={`board-paper paper-${paper}`}>
        <div className={`drawing-area ${shouldStack ? "stacked-board" : ""}`}>
          {overridePage && <div className="board-lock-note"><Presentation size={12}/><span>{classComplete ? "Class complete · voice mic active" : locked ? "Playing · voice mic active" : "Paused · ask Professor via voice mic"}</span></div>}
          {onClass && !overridePage && isDiagramKey(session.data.lessonKey || "") && !session.data.classroomContext && (
            <div className="class-preview-hero" role="region" aria-label="Demo class overview">
              <div className="class-hero-glass">
                <div className="class-hero-meta">
                  <span className="class-hero-badge">
                    <Sparkles size={12}/>
                    <span>Interactive AI Lecture</span>
                  </span>
                  <span className="class-hero-dot">•</span>
                  <span className="class-hero-stat">{classSceneCount || overrideTotal || 1} Chapters</span>
                  <span className="class-hero-dot">•</span>
                  <span className="class-hero-stat">{Math.round((classTotalSeconds || 120) / 60)} min</span>
                </div>
                <h2 className="class-hero-title">{classTitle || page.title}</h2>
                <p className="class-hero-tagline">Watch the AI Tutor draw, explain, and annotate this diagram in real-time with synchronized voice.</p>
                <div className="class-hero-actions">
                  <button
                    type="button"
                    className="class-hero-play-button"
                    onClick={onClass}
                    disabled={classDisabled || classLoading}
                    aria-label={`Start ${classTitle || page.title} class`}
                  >
                    {classLoading ? (
                      <>
                        <LoaderCircle size={17} className="spin" />
                        <span>Preparing classroom…</span>
                      </>
                    ) : (
                      <>
                        <Play size={17} fill="currentColor" />
                        <span>Start Class</span>
                      </>
                    )}
                  </button>
                  <span className="class-hero-hint">or press Space to play</span>
                </div>
              </div>
            </div>
          )}
          <svg ref={svgRef} className="drawing-svg cursor-default" viewBox={`0 0 ${stageWidth} ${stageHeight}`} aria-label={`${page.title}. Interactive whiteboard.`} data-visible-marks={visibleMarks.length} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null; }}>
          <defs>{page.marks.map((mark, i) => mark.type === "text" ? <clipPath key={`${page.id}-clip-${i}`} id={`${clipPrefix}-${i}`}><rect ref={el => { clipRectsRef.current[i] = el; }} x={0} y={0} width={0} height={0}/></clipPath> : null)}</defs>
          <g
            ref={layerRef}
            style={{
              transition: (reduceMotion || gesture.current) ? "none" : "transform 1.25s cubic-bezier(0.22, 1, 0.36, 1)",
              willChange: "transform",
            }}
            transform={`translate(${pan.x + (stageWidth / 2) * (1 - zoom) - activeOffset.x * zoom} ${pan.y + (stageHeight / 2) * (1 - zoom) - activeOffset.y * zoom}) scale(${zoom})`}
          >
            {/* Persistent Journey History: all visited chapters kept without wiping out */}
            <g className="canvas-journey-history" data-layer="history">
              {allPages.map((histPage, k) => {
                if (k > maxVisitedIndex || k === activePageIndex) return null;
                const offset = getPageOffset(k);
                return (
                  <g key={`history-page-${histPage.id || k}`} className="journey-page" transform={`translate(${offset.x}, ${offset.y})`}>
                    <g className="history-layer-assets">
                      {histPage.marks.filter(m => m.type === "image").map((mark, i) => (
                        <g key={`hist-${k}-img-${i}`} transform={place(mark)}>
                          <Mark mark={mark}/>
                        </g>
                      ))}
                    </g>
                    <g className="history-layer-permanent">
                      {histPage.marks.filter(m => m.type !== "image" && !m.annotation).map((mark, i) => (
                        <g key={`hist-${k}-perm-${i}`} transform={place(mark)}>
                          <Mark mark={mark}/>
                        </g>
                      ))}
                    </g>
                    <g className="history-layer-annotations">
                      {histPage.marks.filter(m => m.annotation).map((mark, i) => (
                        <g key={`hist-${k}-ann-${i}`} transform={place(mark)}>
                          <Mark mark={mark}/>
                        </g>
                      ))}
                    </g>
                    {histPage.ink && histPage.ink.length > 0 && (
                      <g className="history-layer-ink">
                        {histPage.ink.map((mark, i) => (
                          <g key={`hist-${k}-ink-${i}`} transform={place(mark)}>
                            <Mark mark={mark}/>
                          </g>
                        ))}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Active Tutor Marks (Assets, Permanent, and Annotations) */}
            <g className="tutor-marks active-scene" transform={`translate(${activeOffset.x}, ${activeOffset.y})`}>
              {/* Layer 1: Base Diagram Assets */}
              <g className="canvas-layer-assets" data-layer="assets">
                {visibleMarks.map((mark, i) => mark.type === "image" ? (
                  <g key={`${page.id}-${i}`} data-tutor-mark={i} data-asset-id={mark.alt || "diagram"} transform={place(mark)}>
                    <Mark mark={mark} pending={activeMarkPending && i === visibleCount - 1} clipId={`${clipPrefix}-${i}`}/>
                  </g>
                ) : null)}
              </g>

              {/* Layer 2: Permanent Teacher Annotations (headings, equations, text, flowcharts) */}
              <g className="canvas-layer-teacher-permanent" data-layer="teacher-permanent">
                {visibleMarks.map((mark, i) => (mark.type !== "image" && !mark.annotation) ? (
                  <g key={`${page.id}-${i}`} data-tutor-mark={i} transform={place(mark)}>
                    <Mark mark={mark} pending={activeMarkPending && i === visibleCount - 1} clipId={`${clipPrefix}-${i}`}/>
                  </g>
                ) : null)}
                {spatialMarks.filter(m => !m.annotation).map((mark, i) => (
                  <g key={`spatial-${mark.elementId || i}`} data-flowchart-mark="true" data-flowchart-node={mark.elementId} data-element-id={mark.elementId} transform={place(mark)}>
                    <Mark mark={mark}/>
                  </g>
                ))}
              </g>

              {/* Layer 3: Temporary Teacher Highlights, Circles, Arrows, Callouts (from recorded cues, CIE, and Spatial) */}
              <g className="canvas-layer-teacher-annotations" data-layer="teacher-annotations">
                {visibleMarks.map((mark, i) => mark.annotation ? (
                  <g key={`${page.id}-${i}`} data-tutor-mark={i} data-annotation-id={mark.actionId} data-element-id={mark.elementId} transform={place(mark)}>
                    <Mark mark={mark} pending={activeMarkPending && i === visibleCount - 1} clipId={`${clipPrefix}-${i}`}/>
                  </g>
                ) : null)}
                {cieMarks.map((mark, i) => (
                  <g key={`cie-${mark.actionId || "mark"}-${i}`} data-cie-mark="true" data-annotation-id={mark.actionId} data-element-id={mark.elementId} transform={place(mark)}>
                    <Mark mark={mark}/>
                  </g>
                ))}
                {spatialMarks.filter(m => m.annotation).map((mark, i) => (
                  <g key={`spatial-ann-${mark.actionId || i}`} data-flowchart-annotation="true" data-annotation-id={mark.actionId} data-element-id={mark.elementId} transform={place(mark)}>
                    <Mark mark={mark}/>
                  </g>
                ))}
              </g>
            </g>

            {/* Ephemeral Doubt Sketch Layer (Phase 5) */}
            {(() => {
              const activeDoubtMarks = (doubtMarks && doubtMarks.length > 0) ? doubtMarks : [...(page.doubtMarks || []), ...localDoubtMarks];
              if (!activeDoubtMarks.length) return null;
              const isDoubtTurn = Boolean(overridePage && !playbackPlaying);
              const doubtLimit = (replaying && isDoubtTurn && replayLimit !== null) ? replayLimit : activeDoubtMarks.length;
              return (
                <g className="canvas-layer-doubt" data-layer="doubt-marks" transform={`translate(${activeOffset.x}, ${activeOffset.y})`}>
                  {activeDoubtMarks.slice(0, doubtLimit).map((mark, i) => (
                    <g key={`doubt-${i}`} data-doubt-mark="true" data-tutor-mark={`doubt-${i}`} transform={place(mark)}>
                      <Mark mark={mark} />
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* Layer 4: Student Drawings */}
            <g className="canvas-layer-student" data-layer="student" transform={`translate(${activeOffset.x}, ${activeOffset.y})`}>
              {page.ink.map((mark, i) => (
                <g key={i} data-ink-index={i} className="student-mark" transform={place(mark)}>
                  <Mark mark={mark}/>
                  {mark.type === "path" && <path d={mark.d} stroke="transparent" fill="none" strokeWidth="17"/>}
                </g>
              ))}
            </g>

            {/* Layer 5: Captions and Overlays */}
            <g className="canvas-layer-overlays" data-layer="overlays" transform={`translate(${activeOffset.x}, ${activeOffset.y})`}>
              <MarkerCursor point={drawing || replaying || (Boolean(overridePage) && ((lastMeasuredPosRef.current ?? 0) > 0 || (playbackMarkPosition ?? 0) > 0)) ? lastMarkerPointRef.current : cursor} markerRef={markerRef} drawing={drawing || (Boolean(overridePage) && playbackPlaying && !reduceMotion) || replaying}/>
            </g>
          </g>
        </svg>
        </div>

        <div className="canvas-bottom"><div className="page-count"><FileStack size={14}/>{!overridePage && session.data.pages.length > 1 && <button aria-label="Previous board page" disabled={session.data.pageIndex === 0} onClick={() => onPage(session.data.pageIndex - 1)}><ChevronLeft size={13}/></button>}<span>{overridePage ? <>Chapter {overrideIndex + 1} <b>/</b> {overrideTotal}</> : <>Page {session.data.pageIndex + 1} <b>/</b> {session.data.pages.length}</>}</span>{!overridePage && session.data.pages.length > 1 && <button aria-label="Next board page" disabled={session.data.pageIndex >= session.data.pages.length - 1} onClick={() => onPage(session.data.pageIndex + 1)}><ChevronRight size={13}/></button>}</div>
          <div className="voice-interaction-bar" role="region" aria-label="Student voice interaction">
            <button
              type="button"
              className={`voice-mic-pill ${listening ? "is-listening" : ""} ${speaking ? "is-speaking" : ""}`}
              onClick={onAskMic}
              aria-label={listening ? "Microphone listening to your voice" : "Ask Professor via voice mic"}
              title={listening ? "Listening to your voice... (tap to finish speaking)" : "Tap to speak to Professor via voice mic (Hotkey: M)"}
            >
              <div className={`voice-mic-icon-wrap ${listening ? "pulse" : ""}`}>
                <Mic size={15} />
              </div>
              <span className="voice-mic-label">
                {listening ? "Listening to your voice…" : speaking ? "Professor speaking…" : "Voice Mic Active · Ask Professor to draw or explain"}
              </span>
              {listening ? (
                <span className="voice-mic-wave" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <kbd className="voice-mic-kbd">M</kbd>
              )}
            </button>
          </div>

          <div className="sr-only" role="region" aria-label="In-class tutor query">
            <form
              onSubmit={e => {
                e.preventDefault();
                if (inClassQuery.trim()) {
                  onSendQuery?.(inClassQuery.trim());
                  setInClassQuery("");
                }
              }}
            >
              <input
                type="text"
                aria-label="Ask your tutor a question"
                placeholder="Ask your tutor a question…"
                value={inClassQuery}
                onChange={e => setInClassQuery(e.target.value)}
                disabled={busy}
              />
              <button type="submit">Ask</button>
            </form>
            {latestReply && (
              <div className="tutor-copy" aria-live="polite">
                {latestReply}
              </div>
            )}
          </div>

          <div className="zoom-control"><button title="Zoom out" aria-label="Zoom out" disabled={zoom <= .3} onClick={() => setZoom(z => Math.max(.3, Math.round((z - .1) * 10) / 10))}><Minus size={13}/></button><button className="zoom-label" title="Reset zoom and position" aria-label="Reset zoom and position" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>{Math.round(zoom * 100)}%</button><button title="Zoom in" aria-label="Zoom in" disabled={zoom >= 1.8} onClick={() => setZoom(z => Math.min(1.8, Math.round((z + .1) * 10) / 10))}><Plus size={13}/></button></div>
        </div>
      </div>
    </section>
  </>;
}

export default memo(WhiteboardView);
