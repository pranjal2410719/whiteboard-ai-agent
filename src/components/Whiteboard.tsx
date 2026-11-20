"use client";

import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AudioLines, Bookmark, Check, ChevronDown, Clapperboard, ChevronLeft, ChevronRight, Circle, Eraser, FileStack, Image as ImageIcon, LoaderCircle, Maximize2, MessageSquareText, Mic, Minimize2, Minus, MousePointer2, Pencil, Play, Plus, Presentation, Send, SkipForward, Redo2, Shapes, Sparkles, Square, Type, Undo2, Volume2, VolumeX, X } from "lucide-react";
import { drawingAtCue } from "@/lib/recorded-classes";
import { assetCatalog, type ImageAssetDefinition } from "@/lib/assets";
import type { BoardMark, BoardPage, LessonCue, Point, Preferences, StudySession, SupportedLanguage } from "@/lib/types";
import { TeacherCam } from "./TeacherCam";

function RichText({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|Pythagorean theorem)/g).map((part, i) => part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part === "Pythagorean theorem" ? <strong key={i}>{part}</strong> : part)}</>;
}

type Tool = "pointer" | "pen" | "eraser" | "rect" | "ellipse" | "text";
const colors = [{ name: "Charcoal", value: "#354139" }, { name: "Forest green", value: "#438563" }, { name: "Cornflower blue", value: "#6b90c5" }, { name: "Soft violet", value: "#a187bf" }, { name: "Apricot", value: "#df9b68" }];

export const markX = (m: BoardMark) => m.type === "path" ? Number(m.d?.match(/-?\d+(?:\.\d+)?/)?.[0] || 0) : m.x || 0;
export const mobileOffset = (x: number) => x >= 500 ? { x: -463, y: 230 } : { x: -14, y: 0 };

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
  const samples = 36;
  const cx = mark.x || 0, cy = mark.y || 0, deg = mark.rotate || 0;
  try {
    const total = el.getTotalLength();
    if (!Number.isFinite(total) || total <= 0) return [{ x: markX(mark) + ox, y: cy + oy }];
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
  const shared = { transform: mark.rotate ? `rotate(${mark.rotate} ${x} ${y})` : undefined, opacity: mark.opacity ?? 1 };
  if (mark.type === "text") {
    return <text {...shared} x={x} y={y} fill={mark.color || "#293b32"} fontFamily="'Caveat Variable', 'Kalam', 'Noto Sans Devanagari', system-ui, cursive" fontSize={mark.size || 28} fontWeight={mark.weight || 500} clipPath={pending && clipId ? `url(#${clipId})` : undefined}>{mark.text}</text>;
  }
  if (mark.type === "image") {
    return <image {...shared} href={mark.src} x={x} y={y} width={mark.w || 0} height={mark.h || 0} preserveAspectRatio="xMidYMid meet" data-diagram="true"/>;
  }
  const painted = {
    ...shared,
    stroke: mark.color || "#293b32",
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

export function BoardThumbnail({ page }: { page: BoardPage }) {
  return <svg aria-label={page.title} role="img" viewBox="0 0 1000 330" className="board-thumbnail">{[...page.marks, ...page.ink].map((mark, i) => <Mark key={i} mark={mark}/>)}</svg>;
}

export function MarkerCursor({ point, drawing, label = "AI Tutor", markerRef }: { point: Point; drawing: boolean; label?: string; markerRef?: React.RefObject<SVGGElement | null> }) {
  return <g ref={markerRef} className={`marker-cursor ${drawing ? "is-drawing" : ""}`} style={{ transform: `translate(${point.x}px, ${point.y}px)` }} pointerEvents="none" aria-hidden="true">
    <g transform="rotate(35)"><path d="M-3 -7 -4.3 -33.5 Q-4.3 -37 0 -37 Q4.3 -37 4.3 -33.5 L3.2 -7 0 0 Z" fill="#edf1e9" stroke="#37503e" strokeWidth="1.7"/><path d="M-4.1 -27.5 4.1 -27.5 4.2 -33.5 Q4.2 -36.5 0 -36.5 Q-4.2 -36.5 -4.2 -33.5Z" fill="#7ba287" stroke="#37503e" strokeWidth="1.3"/><path d="m-3.1-8.5 6.3.1L0 0Z" fill="#365641"/><path d="m-1.7-11.5-.4-13.2" stroke="white" strokeWidth="1.8"/></g>
    <g transform="translate(9 6)"><rect width="63" height="22" rx="6" fill="#3d7655"/><text x="31.5" y="15" fill="white" textAnchor="middle" fontFamily="'DM Sans Variable', sans-serif" fontSize="11.5" fontWeight="600">{label}</text></g>
  </g>;
}

type Props = {
  session: StudySession; paper: Preferences["paper"]; animation: number; busy: boolean;
  onInk: (id: string, ink: BoardMark[]) => void; onPage: (index: number) => void; onSave: () => void; notify: (message: string) => void;
  overridePage?: BoardPage | null; overrideIndex?: number; overrideTotal?: number; locked?: boolean;
  playbackPlaying?: boolean; readPlayback?: () => number; playbackSceneStart?: number; playbackSceneSeconds?: number;
  playbackCues?: LessonCue[]; playbackMarkPosition?: number; playbackRevision?: number;
  onClass?: () => void; classDisabled?: boolean; classComplete?: boolean;
  tutorSpeaking?: boolean; tutorPaused?: boolean; tutorMuted?: boolean;
  listening?: boolean;
  speaking?: boolean;
  onAskMic?: () => void;
  onSendQuery?: (query: string) => void;
  language?: SupportedLanguage;
  onSwitchLanguage?: (lang: SupportedLanguage) => void;
  liveUserSpeech?: string;
  pendingQuestion?: string;
  latestReply?: string;
  onOpenTranscript?: () => void;
  onToggleVoiceReadAloud?: () => void;
  suggestions?: string[];
};

function WhiteboardView({
  session, paper, animation, busy, onInk, onPage, onSave, notify,
  overridePage = null, overrideIndex = 0, overrideTotal = 1, locked = false,
  playbackPlaying = false, readPlayback, playbackSceneStart = 0, playbackSceneSeconds = 40,
  playbackCues, playbackMarkPosition, playbackRevision = 0,
  onClass, classDisabled, classComplete, tutorSpeaking = false, tutorPaused = false, tutorMuted = false,
  listening = false, speaking = false, onAskMic, onSendQuery, language = "en", onSwitchLanguage,
  liveUserSpeech = "", pendingQuestion = "", latestReply = "", onOpenTranscript, onToggleVoiceReadAloud, suggestions = [],
}: Props) {
  const [inClassQuery, setInClassQuery] = useState("");
  const page = overridePage || session.data.pages[session.data.pageIndex] || session.data.pages[0];
  const clipPrefix = useId().replace(/:/g, "");
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(colors[1].value);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(false);
  const [shapeMenu, setShapeMenu] = useState(false);
  const [assetMenu, setAssetMenu] = useState(false);
  const [draft, setDraft] = useState<BoardMark | null>(null);
  const [textBox, setTextBox] = useState<{ at: Point; left: number; top: number } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [undoStack, setUndoStack] = useState<BoardMark[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardMark[][]>([]);
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
  const staticPosRef = useRef(playbackMarkPosition);
  useEffect(() => {
    staticPosRef.current = playbackMarkPosition;
  }, [playbackMarkPosition]);
  const lastMeasuredPosRef = useRef(0);

  const shouldStack = narrow && page.marks.some(m => markX(m) >= 500);
  const stageWidth = shouldStack ? 500 : 1000, stageHeight = shouldStack ? 550 : 330;
  const place = (m: BoardMark) => { const o = mobileOffset(markX(m)); return shouldStack ? `translate(${o.x} ${o.y})` : undefined; };

  const placeMarker = useCallback((point: Point) => {
    const el = markerRef.current; if (!el) return;
    const x = Math.max(0, Math.min(stageWidth - 75, point.x)), y = Math.max(0, Math.min(stageHeight - 28, point.y));
    el.style.transform = `translate(${x}px, ${y}px)`;
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
    const localX = entry.x + entry.width * Math.max(0, Math.min(1, amount));
    const rotated = rotatePoint(localX, entry.y + 1, entry.x, entry.y, entry.rotate);
    return { x: rotated.x + entry.ox, y: rotated.y + entry.oy };
  }, []);

  const measureMark = useCallback((idx: number, mark: BoardMark): CachedMark | undefined => {
    const shape = layerRef.current?.querySelector(`[data-tutor-mark="${idx}"] > *`);
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

  // Clear geometry cache when the active page or responsive layout changes.
  useLayoutEffect(() => {
    cacheRef.current = [];
    activeDomIndexRef.current = -1;
  }, [page.id, shouldStack]);

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

  useEffect(() => {
    gesture.current = null; draftRef.current = null;
    setUndoStack([]); setRedoStack([]); setPan({ x: 0, y: 0 }); setZoom(1); setTextBox(null); setDraft(null); setShapeMenu(false); setAssetMenu(false);
  }, [page.id, session.id]);

  useEffect(() => { if (locked) { gesture.current = null; draftRef.current = null; setTextBox(null); setDraft(null); setShapeMenu(false); setAssetMenu(false); } }, [locked]);

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
    if (overridePage) {
      cancelAnimationFrame(frame.current);
      previousAnimation.current = `${animation}:${replay}`;
      setReplaying(false); setReplayLimit(null);
      return;
    }
    const token = `${animation}:${replay}`;
    if (previousAnimation.current === token) { setReplaying(false); setReplayLimit(null); return; }
    previousAnimation.current = token;
    if (reduceMotion || !page.marks.length) return;

    setReplaying(true);
    setReplayLimit(1);
    let index = 0, started = performance.now();

    const tick = (now: number) => {
      const mark = page.marks[index];
      if (!mark) { setReplaying(false); setReplayLimit(null); return; }
      if (isStale(cacheRef.current[index])) cacheRef.current[index] = measureMark(index, mark);

      const duration = mark.type === "text" ? Math.min(900, 170 + (mark.text?.length || 1) * 16) : 420;
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
      if (tip) placeMarker(tip);

      if (raw >= 1) {
        applyMarkProgress(index, 1);
        index++;
        started = now;
        if (index >= page.marks.length) {
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
  }, [animation, replay, page.id, page.marks, page.cursor, overridePage, reduceMotion, shouldStack, applyMarkProgress, measureMark, placeMarker, tipForCachedMark]);

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
        if (tip) placeMarker(tip);
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
        if (tip) placeMarker(tip);
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

  const commit = useCallback((ink: BoardMark[]) => {
    if (ink.length > 500) { notify("This page is full. Ask your tutor for a new example to start another page."); return; }
    setUndoStack(s => [...s.slice(-39), page.ink]); setRedoStack([]); onInk(page.id, ink);
  }, [onInk, page.id, page.ink, notify]);
  const undo = useCallback(() => { if (locked || !undoStack.length) return; setRedoStack(s => [...s, page.ink]); onInk(page.id, undoStack[undoStack.length - 1]); setUndoStack(s => s.slice(0, -1)); }, [undoStack, onInk, page.id, page.ink, locked]);
  const redo = useCallback(() => { if (locked || !redoStack.length) return; setUndoStack(s => [...s, page.ink]); onInk(page.id, redoStack[redoStack.length - 1]); setRedoStack(s => s.slice(0, -1)); }, [redoStack, onInk, page.id, page.ink, locked]);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setExpanded(false); setShapeMenu(false); setTextBox(null); return; }
      if (e.target instanceof HTMLElement && (e.target.closest("input, textarea, [contenteditable=true]") || document.querySelector('[role="dialog"]'))) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || locked) return;
      const tools: Record<string, Tool> = { v: "pointer", p: "pen", e: "eraser", r: "rect", c: "ellipse", t: "text" };
      if (tools[e.key.toLowerCase()]) { setTool(tools[e.key.toLowerCase()]); setShapeMenu(false); }
    };
    document.addEventListener("keydown", keydown); return () => document.removeEventListener("keydown", keydown);
  }, [undo, redo, locked]);

  const getPoint = (e: ReactPointerEvent<SVGSVGElement>, root = false): Point => {
    const matrix = (root ? svgRef.current : layerRef.current)?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    const offset = shouldStack && !root ? (gesture.current ? mobileOffset(gesture.current.origin.x) : p.y > 272 ? { x: -463, y: 230 } : { x: -14, y: 0 }) : { x: 0, y: 0 };
    return { x: Math.round((p.x - offset.x) * 10) / 10, y: Math.round((p.y - offset.y) * 10) / 10 };
  };
  const changeDraft = (mark: BoardMark | null) => { draftRef.current = mark; setDraft(mark); };
  const pointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 || textBox) return;
    if (locked) { notify("This is lecture mode. Pause the lecture, or choose “Sketch notes”, to use the marker."); return; }
    setShapeMenu(false);
    const point = getPoint(e, tool === "pointer");
    if (tool === "text") {
      const bounds = svgRef.current!.getBoundingClientRect(); setTextValue(""); setTextBox({ at: point, left: Math.max(4, Math.min(e.clientX - bounds.left, bounds.width - 221)), top: Math.max(0, Math.min(e.clientY - bounds.top - 16, bounds.height - 44)) }); return;
    }
    if (tool === "eraser") {
      const target = (e.target as Element).closest("[data-ink-index]");
      if (target) commit(page.ink.filter((_, i) => i !== Number(target.getAttribute("data-ink-index"))));
      else notify("Tap one of your annotations to erase it. The tutor’s lesson stays intact.");
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { origin: point, points: [point], pan: { ...pan }, tool };
    if (tool === "pen") changeDraft({ type: "path", d: `M${point.x} ${point.y} l.1 .1`, color, strokeWidth: 3.1 });
    else if (tool !== "pointer") changeDraft({ type: tool, x: point.x, y: point.y, w: 1, h: 1, color, fill: "none", strokeWidth: 2.8 });
  };
  const pointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current; if (!g) return;
    const point = getPoint(e, g.tool === "pointer");
    if (g.tool === "pointer") { setPan({ x: Math.min(650, Math.max(-650, g.pan.x + point.x - g.origin.x)), y: Math.min(230, Math.max(-230, g.pan.y + point.y - g.origin.y)) }); return; }
    if (g.tool === "pen") {
      const last = g.points[g.points.length - 1]; if (Math.hypot(point.x - last.x, point.y - last.y) < 1 || g.points.length > 1700) return;
      g.points.push(point); changeDraft({ type: "path", d: g.points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" "), color, strokeWidth: 3.1 });
    } else {
      const x = Math.min(g.origin.x, point.x), y = Math.min(g.origin.y, point.y), w = Math.abs(point.x - g.origin.x), h = Math.abs(point.y - g.origin.y);
      changeDraft(g.tool === "rect" ? { type: "rect", x, y, w, h, color, fill: "none", strokeWidth: 2.8 } : { type: "ellipse", x: x + w / 2, y: y + h / 2, w: w / 2, h: h / 2, color, fill: "none", strokeWidth: 2.8 });
    }
  };
  const pointerUp = () => { if (!locked && gesture.current && draftRef.current) commit([...page.ink, draftRef.current]); gesture.current = null; changeDraft(null); };

  const drawing = !overridePage && replaying;
  const visibleMarks = page.marks.slice(0, visibleCount);
  const activeMarkPending = !reduceMotion && ((drawing && visibleCount > 0) || (Boolean(overridePage) && playbackPlaying && visibleCount > 0));
  const cursorOffset = shouldStack ? mobileOffset(page.cursor.x) : { x: 0, y: 0 };
  const cursor = { x: Math.max(0, Math.min(stageWidth - 75, page.cursor.x + cursorOffset.x)), y: Math.max(0, Math.min(stageHeight - 28, page.cursor.y + cursorOffset.y)) };

  const toolButton = (key: Tool, label: string, icon: React.ReactNode) => <button type="button" className={`tool-button ${tool === key ? "active" : ""}`} aria-label={label} title={locked ? "Pause the lecture to sketch" : label} aria-pressed={tool === key} disabled={locked} onClick={() => { setTool(key); setShapeMenu(false); }}>{icon}</button>;

  return <>
    {expanded && <div className="board-backdrop"/>}
    <section className={`board-card${expanded ? " is-expanded" : ""}${overridePage ? " has-class" : ""}${overridePage && locked ? " class-playing" : ""}`} aria-label="Interactive lesson whiteboard">
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
        }}>{drawing ? <SkipForward size={13}/> : <Play size={12}/>}<span>{drawing ? "Finish" : "Replay"}</span></button><span className="small-divider"/></>}{onOpenTranscript && <><button type="button" className="icon-button" title="View conversation history" aria-label="View conversation history" onClick={onOpenTranscript}><MessageSquareText size={16}/></button><span className="small-divider"/></>}<button className={`icon-button bookmark-action ${session.data.saved ? "is-saved" : ""}`} title={session.data.saved ? "Remove from saved boards" : "Save board"} aria-label={session.data.saved ? "Remove from saved boards" : "Save board"} onClick={onSave}><Bookmark size={16} fill={session.data.saved ? "currentColor" : "none"}/></button><span className="small-divider"/><button className="icon-button" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={locked || !undoStack.length} onClick={undo}><Undo2 size={17}/></button><button className="icon-button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={locked || !redoStack.length} onClick={redo}><Redo2 size={17}/></button><span className="small-divider"/><button className="icon-button" title={expanded ? "Exit expanded view" : "Expand whiteboard"} aria-label={expanded ? "Exit expanded view" : "Expand whiteboard"} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button></div>
      </div>
      <div className={`board-paper paper-${paper}`}>
        <div className={`drawing-area ${shouldStack ? "stacked-board" : ""}`}>{overridePage && <div className="board-lock-note"><Presentation size={12}/><span>{classComplete ? "Class complete · sketch your notes" : locked ? "Playing · pause to sketch" : "Paused · sketch your notes"}</span></div>}<svg ref={svgRef} className={`drawing-svg cursor-${tool}`} viewBox={`0 0 ${stageWidth} ${stageHeight}`} aria-label={`${page.title}. Use the drawing toolbar to annotate the whiteboard.`} data-visible-marks={visibleMarks.length} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null; changeDraft(null); }}>
          <defs>{page.marks.map((mark, i) => mark.type === "text" ? <clipPath key={`${page.id}-clip-${i}`} id={`${clipPrefix}-${i}`}><rect ref={el => { clipRectsRef.current[i] = el; }} x={0} y={0} width={0} height={0}/></clipPath> : null)}</defs>
          <g ref={layerRef} transform={`translate(${pan.x + stageWidth / 2 * (1 - zoom)} ${pan.y + stageHeight / 2 * (1 - zoom)}) scale(${zoom})`}>
            <g className="tutor-marks">{visibleMarks.map((mark, i) => <g key={`${page.id}-${i}`} data-tutor-mark={i} transform={place(mark)}><Mark mark={mark} pending={activeMarkPending && i === visibleCount - 1} clipId={`${clipPrefix}-${i}`}/></g>)}</g>
            {page.ink.map((mark, i) => <g key={i} data-ink-index={i} className="student-mark" transform={place(mark)}><Mark mark={mark}/>{mark.type === "path" && <path d={mark.d} stroke="transparent" fill="none" strokeWidth="17"/>}</g>)}
            {draft && <g transform={place(draft)}><Mark mark={draft}/></g>}<MarkerCursor point={cursor} markerRef={markerRef} drawing={drawing || (Boolean(overridePage) && playbackPlaying && !reduceMotion)}/>
          </g>
        </svg>
        <TeacherCam speaking={Boolean(tutorSpeaking || (drawing && !overridePage))} paused={Boolean(tutorPaused && !drawing)} muted={tutorMuted}/>
        {onAskMic && !overridePage && (
          <div className="board-center-mic">
            <button
              type="button"
              className={`board-mic-button ${listening ? "is-listening" : speaking ? "is-speaking" : ""}`}
              onClick={onAskMic}
              disabled={busy}
              title={listening ? "Listening… tap to send your question" : speaking ? "The teacher is speaking — tap to ask" : "Ask the tutor with your microphone"}
              aria-label={listening ? "Stop listening and send your question" : "Ask the tutor with your microphone"}
            >
              {busy ? (
                <LoaderCircle size={24} className="spin"/>
              ) : listening ? (
                <span className="mic-live-soundwaves" aria-hidden="true"><span className="wave-bar b1"/><span className="wave-bar b2"/><span className="wave-bar b3"/><span className="wave-bar b4"/></span>
              ) : speaking ? (
                <Volume2 size={24} className="speaking-wave"/>
              ) : (
                <Mic size={24}/>
              )}
            </button>
            <div className={`board-mic-caption ${liveUserSpeech ? "is-live" : ""}`} role="status" aria-live="polite">
              {liveUserSpeech
                ? `You: “${liveUserSpeech}”`
                : busy
                ? "Drawing your answer on the board…"
                : listening
                ? "Listening — speak, then pause"
                : speaking
                ? "Teacher is explaining…"
                : "Ask the tutor about this board"}
            </div>
          </div>
        )}
        {textBox && <form className="board-text-form" style={{ left: textBox.left, top: textBox.top }} onSubmit={e => { e.preventDefault(); if (textValue.trim()) commit([...page.ink, { type: "text", x: textBox.at.x, y: textBox.at.y, text: textValue.trim().slice(0, 150), size: 27, color }]); setTextBox(null); }}><input aria-label="Whiteboard annotation" autoFocus placeholder="Write a note…" maxLength={150} value={textValue} onChange={e => setTextValue(e.target.value)}/><button aria-label="Add annotation" type="submit"><Check size={16}/></button><button aria-label="Cancel annotation" type="button" onClick={() => setTextBox(null)}><X size={14}/></button></form>}
        </div>

        {latestReply && (
          <div className={`in-class-demonstration-hud ${busy ? "is-demonstrating" : ""}`}>
            <div className="demonstration-hud-header">
              <span className="hud-tutor-tag">
                <Sparkles size={12}/>
                <span>Teacher Demonstration</span>
              </span>
              {onToggleVoiceReadAloud && (
                <button
                  type="button"
                  className="hud-voice-btn"
                  title={speaking ? "Mute teacher voice" : "Read demonstration aloud"}
                  aria-label={speaking ? "Mute teacher voice" : "Read demonstration aloud"}
                  onClick={onToggleVoiceReadAloud}
                >
                  {speaking ? <Volume2 size={13} className="speaking-wave"/> : <VolumeX size={13}/>}
                  <span>{speaking ? "Speaking" : "Voice"}</span>
                </button>
              )}
            </div>
            {(liveUserSpeech || (listening && pendingQuestion)) && (
              <div className="in-class-student-speech" role="status">
                <Mic size={12} className="pulse-mic"/>
                <span>You: “{liveUserSpeech || pendingQuestion}”</span>
              </div>
            )}
            <div className="tutor-copy" aria-live="polite">
              {busy ? (
                <div className="in-class-busy-row">
                  <span className="in-class-pending">“{pendingQuestion || liveUserSpeech || "..."}”</span>
                  <span className="in-class-pulse"><LoaderCircle size={13} className="spin"/> Solving & demonstrating on the whiteboard…</span>
                </div>
              ) : (
                <RichText text={latestReply}/>
              )}
            </div>
          </div>
        )}

        <div className="canvas-bottom"><div className="page-count"><FileStack size={14}/>{!overridePage && session.data.pages.length > 1 && <button aria-label="Previous board page" disabled={session.data.pageIndex === 0} onClick={() => onPage(session.data.pageIndex - 1)}><ChevronLeft size={13}/></button>}<span>{overridePage ? <>Chapter {overrideIndex + 1} <b>/</b> {overrideTotal}</> : <>Page {session.data.pageIndex + 1} <b>/</b> {session.data.pages.length}</>}</span>{!overridePage && session.data.pages.length > 1 && <button aria-label="Next board page" disabled={session.data.pageIndex >= session.data.pages.length - 1} onClick={() => onPage(session.data.pageIndex + 1)}><ChevronRight size={13}/></button>}</div>
          <div className="drawing-toolbar" role="toolbar" aria-label="Whiteboard drawing tools">
            {toolButton("pointer", "Select and pan (V)", <MousePointer2 size={17}/>)}{toolButton("pen", "Marker pen (P)", <Pencil size={17}/>)}{toolButton("eraser", "Eraser (E)", <Eraser size={18}/>)}
            <div className="shape-tool"><button type="button" aria-label="Shape tools" title="Shape tools" aria-expanded={shapeMenu} className={`tool-button shape-button ${tool === "rect" || tool === "ellipse" ? "active" : ""}`} disabled={locked} onClick={() => setShapeMenu(!shapeMenu)}><Shapes size={17}/><ChevronDown size={9}/></button>{shapeMenu && <div className="shape-popover"><button disabled={locked} onClick={() => { setTool("rect"); setShapeMenu(false); }}><Square size={15}/>Rectangle <kbd>R</kbd></button><button disabled={locked} onClick={() => { setTool("ellipse"); setShapeMenu(false); }}><Circle size={15}/>Ellipse <kbd>C</kbd></button></div>}</div>
            {toolButton("text", "Write text (T)", <Type size={17}/>)}
            <div className="asset-tool">
              <button
                type="button"
                aria-label="Insert diagram asset from /assets (A)"
                title="Insert diagram asset from /assets"
                className={`tool-button ${assetMenu ? "active" : ""}`}
                disabled={locked}
                onClick={() => { setAssetMenu(!assetMenu); setShapeMenu(false); }}
              >
                <ImageIcon size={17}/>
              </button>
              {assetMenu && (
                <div className="asset-popover" role="dialog" aria-label="Diagram assets in /assets">
                  <div className="asset-popover-header">
                    <strong>Whiteboard Assets</strong>
                    <small>from /assets</small>
                  </div>
                  <div className="asset-list">
                    {assetCatalog.map((asset: ImageAssetDefinition) => (
                      <button
                        key={asset.id}
                        type="button"
                        className="asset-item-btn"
                        onClick={() => {
                          const layout = asset.layout || (asset.id === "heart-diagram" ? { x: 580, y: 16, w: 270, h: 298 } : { x: 515, y: 30, w: 430, h: 270 });
                          const newMark: BoardMark = {
                            type: "image",
                            x: layout.x,
                            y: layout.y,
                            w: layout.w,
                            h: layout.h,
                            src: asset.src,
                            alt: asset.alt,
                            color: "#a8c2ae",
                            strokeWidth: 1.2,
                          };
                          onInk(page.id, [...page.ink, newMark]);
                          setAssetMenu(false);
                          notify(`Inserted ${asset.title} onto the whiteboard.`);
                          if (onSendQuery) {
                            onSendQuery(`I placed the ${asset.title} diagram on the whiteboard. Please describe what it shows and highlight its components.`);
                          }
                        }}
                      >
                        <div className="asset-thumb-wrap">
                          <img src={asset.src} alt={asset.alt} className="asset-thumb-img"/>
                        </div>
                        <div className="asset-meta">
                          <span className="asset-title">{asset.title}</span>
                          <span className="asset-subject">{asset.subject}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="toolbar-divider"/>
            <div className="color-options">{colors.map(c => <button type="button" key={c.name} onClick={() => { setColor(c.value); if (tool === "pointer" || tool === "eraser") setTool("pen"); }} style={{ "--swatch": c.value } as React.CSSProperties} className={`color-swatch ${color === c.value ? "selected" : ""}`} disabled={locked} aria-label={`${c.name} marker`} aria-pressed={color === c.value} title={c.name}/>)}</div>
          </div>

          <div className="classroom-voice-bar" role="toolbar" aria-label="In-class teacher voice interaction">
            <button
              type="button"
              className={`classroom-hero-mic-btn ${listening ? "is-listening" : speaking ? "is-speaking" : busy ? "is-busy" : "is-ready"}`}
              onClick={onAskMic}
              disabled={busy}
              title={listening ? "Listening to your voice... click to stop and demonstrate" : speaking ? "Teacher is speaking... click to ask" : "Ask teacher with microphone"}
              aria-label={listening ? "Listening to your voice... tap to send query" : "Ask teacher with microphone"}
            >
              <div className="mic-indicator-icon">
                {busy ? (
                  <LoaderCircle size={15} className="spin"/>
                ) : listening ? (
                  <div className="mic-live-soundwaves" aria-hidden="true">
                    <span className="wave-bar b1"/>
                    <span className="wave-bar b2"/>
                    <span className="wave-bar b3"/>
                    <span className="wave-bar b4"/>
                  </div>
                ) : speaking ? (
                  <Volume2 size={15} className="speaking-wave"/>
                ) : (
                  <Mic size={15}/>
                )}
              </div>
              <span className="mic-status-label">
                {busy
                  ? (language === "hi" ? "हल कर रहे हैं…" : language === "hinglish" ? "Solving on board…" : "Solving on Board…")
                  : listening
                  ? (language === "hi" ? "सुन रहे हैं… (पूछने के लिए टैप करें)" : language === "hinglish" ? "Listening… (Tap to ask)" : "Listening… (Tap to ask)")
                  : speaking
                  ? (language === "hi" ? "शिक्षिका समझा रही हैं…" : language === "hinglish" ? "Teacher samjha rahe hain…" : "Teacher Demonstrating…")
                  : (language === "hi" ? "शिक्षिका से पूछें" : language === "hinglish" ? "Teacher se poochhein" : "Ask Teacher")}
              </span>
            </button>

            {onSwitchLanguage && (
              <div className="classroom-lang-pills" role="group" aria-label="Speech and tutor language">
                {(["en", "hinglish", "hi"] as const).map(l => (
                  <button
                    key={l}
                    type="button"
                    className={`classroom-lang-pill ${(language || "en") === l ? "active" : ""}`}
                    onClick={() => onSwitchLanguage(l)}
                    aria-pressed={(language || "en") === l}
                    title={l === "en" ? "English (en-US)" : l === "hinglish" ? "Hinglish (हिंग्लिश · en-IN)" : "Hindi (हिन्दी · hi-IN)"}
                  >
                    {l === "en" ? "EN" : l === "hinglish" ? "Hinglish" : "हिन्दी"}
                  </button>
                ))}
              </div>
            )}

            <form
              className="sr-only"
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
          </div>

          <div className="zoom-control"><button title="Zoom out" aria-label="Zoom out" disabled={zoom <= .6} onClick={() => setZoom(z => Math.max(.6, Math.round((z - .1) * 10) / 10))}><Minus size={13}/></button><button className="zoom-label" title="Reset zoom and position" aria-label="Reset zoom and position" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>{Math.round(zoom * 100)}%</button><button title="Zoom in" aria-label="Zoom in" disabled={zoom >= 1.8} onClick={() => setZoom(z => Math.min(1.8, Math.round((z + .1) * 10) / 10))}><Plus size={13}/></button></div>
        </div>
      </div>
    </section>
  </>;
}

export default memo(WhiteboardView);
