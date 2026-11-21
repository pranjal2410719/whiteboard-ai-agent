import type { BoardMark, BoardPage, DiagramRegion, SupportedLanguage } from "./types";
import { getAssetById } from "./assets";

/**
 * Diagram annotation layer.
 *
 * The model answers with semantic requests ("circle the nucleus", "underline the
 * membrane", "wire the circuit"). This module resolves each request against the named
 * regions already declared on the page or embedded in diagram assets, so annotation
 * geometry is always accurate and can never be pointed at empty canvas or invented coordinates.
 */

export const ANNOTATION_STYLES = ["highlight", "underline", "circle", "box", "arrow", "label", "wire"] as const;
export type AnnotationStyle = (typeof ANNOTATION_STYLES)[number];

export type DiagramAnnotation = { region: string; style: AnnotationStyle; label?: string };

const styleColor: Record<AnnotationStyle, string> = {
  highlight: "#e2a526",
  underline: "#bc7948",
  circle: "#c0504d",
  box: "#507aaf",
  arrow: "#3b805c",
  label: "#293b32",
  wire: "#507aaf",
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const singular = (word: string) => word.endsWith("s") && word.length > 3 ? word.slice(0, -1) : word;

/**
 * Resolves all annotatable regions on the page, merging regions explicitly declared on the
 * BoardPage with any known visual diagram assets found in page.marks or page.ink.
 */
export function getEffectiveRegions(page: BoardPage | null): DiagramRegion[] {
  if (!page) return [];
  const map = new Map<string, DiagramRegion>();
  if (page.regions) {
    for (const r of page.regions) map.set(r.id, r);
  }
  const images = [...page.marks, ...page.ink].filter(m => m.type === "image");
  for (const img of images) {
    if (!img.src) continue;
    const asset = getAssetById(img.src);
    if (asset?.regions?.length) {
      const ix = img.x ?? (asset.layout?.x ?? 515);
      const iy = img.y ?? (asset.layout?.y ?? 30);
      const refW = asset.layout?.w ?? 430;
      const refH = asset.layout?.h ?? 270;
      const scaleX = (img.w && refW && Math.abs(img.w - refW) > 2) ? (img.w / refW) : 1;
      const scaleY = (img.h && refH && Math.abs(img.h - refH) > 2) ? (img.h / refH) : 1;
      for (const r of asset.regions) {
        if (!map.has(r.id)) {
          map.set(r.id, {
            ...r,
            x: Math.round(r.x * scaleX + ix),
            y: Math.round(r.y * scaleY + iy),
            w: Math.round(r.w * scaleX),
            h: Math.round(r.h * scaleY),
          });
        }
      }
    }
  }
  return Array.from(map.values());
}

/**
 * Find the region a learner or the model is talking about. Keys match on whole words
 * (so "there" never matches the "er" alias) and the longest key wins.
 */
export function matchRegion(page: BoardPage | null, query: string): DiagramRegion | null {
  const regions = getEffectiveRegions(page);
  if (!regions.length) return null;
  const words = new Set(normalize(query).split(" ").filter(Boolean).map(singular));
  if (!words.size) return null;
  let best: { region: DiagramRegion; score: number } | null = null;
  for (const region of regions) {
    const keys = [region.id, region.label, ...(region.aliases || [])].map(normalize).filter(Boolean);
    for (const key of keys) {
      const keyWords = key.split(" ").filter(Boolean);
      if (!keyWords.length || !keyWords.every(word => words.has(singular(word)))) continue;
      const score = key.length;
      if (!best || score > best.score) best = { region, score };
    }
  }
  return best?.region ?? null;
}

function marksFor(region: DiagramRegion, style: AnnotationStyle, label = ""): BoardMark[] {
  const color = styleColor[style];
  const cx = Math.round(region.x + region.w / 2), cy = Math.round(region.y + region.h / 2);
  const textLabel = (label || region.label).slice(0, 60);

  if (style === "highlight") {
    // Translucent pen highlighter stroke across the region (never blocks underlying diagram)
    const strokeY = cy;
    const penW = Math.max(18, Math.min(region.h + 8, 36));
    const labelX = region.x > 700 ? region.x + region.w + 12 : Math.max(50, region.x - 12);
    const anchor = region.x > 700 ? "start" : "end";
    return [
      {
        type: "path",
        d: `M${region.x + 4} ${strokeY} L${region.x + region.w - 4} ${strokeY}`,
        color: "#f5d76e",
        strokeWidth: penW,
        fill: "none",
        opacity: 0.36,
        annotation: true,
      },
      {
        type: "text",
        x: labelX,
        y: cy + 6,
        text: textLabel,
        size: 18,
        color: "#293b32",
        weight: 600,
        textAnchor: anchor,
        annotation: true,
      },
    ];
  }
  if (style === "circle") {
    // Circle without any filled color: diagram underneath is 100% visible
    const labelX = region.x > 700 ? region.x + region.w + 12 : Math.max(50, region.x - 12);
    const anchor = region.x > 700 ? "start" : "end";
    return [
      {
        type: "ellipse",
        x: cx,
        y: cy,
        w: Math.round(region.w / 2 + 8),
        h: Math.round(region.h / 2 + 8),
        color,
        fill: "none",
        strokeWidth: 2.9,
        rotate: -3,
        annotation: true,
      },
      {
        type: "text",
        x: labelX,
        y: cy + 6,
        text: textLabel,
        size: 18,
        color,
        weight: 600,
        textAnchor: anchor,
        annotation: true,
      },
    ];
  }
  if (style === "box") {
    return [{ type: "rect", x: region.x - 6, y: region.y - 6, w: region.w + 12, h: region.h + 12, color, fill: "none", strokeWidth: 2.4, annotation: true }];
  }
  if (style === "underline") {
    const y = region.y + region.h + 7;
    return [{ type: "path", d: `M${region.x} ${y} Q${cx} ${y + 5} ${region.x + region.w} ${y - 1}`, color, strokeWidth: 3.4, fill: "none", annotation: true }];
  }
  if (style === "arrow") {
    const startX = Math.max(60, region.x - 120), endX = region.x - 10;
    return [{ type: "path", d: `M${startX} ${cy} L${endX} ${cy} M${endX - 11} ${cy - 7} L${endX} ${cy} L${endX - 11} ${cy + 7}`, color, strokeWidth: 2.6, fill: "none", annotation: true }];
  }
  if (style === "wire") {
    const startX = Math.max(60, region.x - 85);
    return [
      { type: "path", d: `M${startX} ${cy} L${region.x - 6} ${cy}`, color: "#507aaf", strokeWidth: 2.8, fill: "none", dashed: true, annotation: true },
      { type: "ellipse", x: startX, y: cy, w: 4, h: 4, fill: "#507aaf", color: "#507aaf", strokeWidth: 1.2, annotation: true },
      { type: "ellipse", x: region.x - 6, y: cy, w: 4, h: 4, fill: "#507aaf", color: "#507aaf", strokeWidth: 1.2, annotation: true },
    ];
  }
  const text = (label || region.label).slice(0, 60);
  return [{ type: "text", x: Math.min(region.x + region.w + 10, 941 - text.length * 8), y: cy + 8, text, size: 20, color, weight: 600, annotation: true }];
}

/** Resolve model-supplied annotation requests into drawable marks. Unknown regions are dropped. */
export function resolveAnnotations(page: BoardPage | null, requests: unknown, limit = 8): BoardMark[] {
  const regions = getEffectiveRegions(page);
  if (!regions.length || !Array.isArray(requests)) return [];
  const out: BoardMark[] = [];
  const seen = new Set<string>();
  for (const request of requests.slice(0, limit)) {
    if (!request || typeof request !== "object") continue;
    const item = request as Record<string, unknown>;
    const region = matchRegion(page, typeof item.region === "string" ? item.region : "");
    if (!region) continue;
    const style = (ANNOTATION_STYLES as readonly string[]).includes(String(item.style)) ? (item.style as AnnotationStyle) : "circle";
    const key = `${region.id}:${style}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(...marksFor(region, style, typeof item.label === "string" ? item.label : ""));
  }
  return out;
}

/** Keep the diagram and the tutor's recent annotations while dropping annotations that aged out. */
export function withAnnotations(page: BoardPage, marks: BoardMark[], keep = 40): BoardPage {
  const base = page.marks.filter(mark => !mark.annotation);
  const previous = page.marks.filter(mark => mark.annotation);
  return { ...page, marks: [...base, ...[...previous, ...marks].slice(-keep)] };
}

/** A compact, spatial description of the board for the model's system context. */
export function describePage(page: BoardPage): string {
  const lines: string[] = [
    `Current board page "${page.title}". Surface is 1000 × 330 units, origin top-left, text y is the baseline.`,
  ];
  const images = [...page.marks, ...page.ink].filter(mark => mark.type === "image");
  for (const image of images) {
    lines.push(`A diagram asset image (${image.alt || image.src || "diagram"}) occupies x=${Math.round(image.x || 0)} y=${Math.round(image.y || 0)} at ${Math.round(image.w || 0)}×${Math.round(image.h || 0)}. Never redraw or duplicate this image.`);
  }

  const regions = getEffectiveRegions(page);
  if (regions.length) {
    lines.push("Annotatable diagram visual components with exact spatial coordinates:");
    for (const region of regions) {
      const cx = region.x + Math.round(region.w / 2), cy = region.y + Math.round(region.h / 2);
      lines.push(
        `- id="${region.id}" | ${region.label} | box [x=${region.x}, y=${region.y}, w=${region.w}, h=${region.h}] | center (${cx}, ${cy}) | left-pin (${region.x}, ${cy}) | right-pin (${region.x + region.w}, ${cy}) | top-pin (${cx}, ${region.y}) | bottom-pin (${cx}, ${region.y + region.h})${region.note ? ` | Note: ${region.note}` : ""}`
      );
    }
    lines.push(
      "Precision annotation tools:\n" +
      "- 'highlight': Semi-transparent backdrop over exact box.\n" +
      "- 'underline': Curved underline stroke right below bottom-pin.\n" +
      "- 'circle': Precision boundary ellipse centered on center (cx, cy).\n" +
      "- 'box': Precision rectangle over exact box.\n" +
      "- 'arrow': Pointing arrow leading directly to left-pin.\n" +
      "- 'wire': Dashed electrical/connection lead wired into left-pin.\n" +
      "- 'label': Callout label text placed next to right-pin."
    );
    lines.push("To annotate or point at a part, return annotations with the exact region id and style. You can also output vector 'elements' (arrows, rectangles, ellipses, text) with exact coordinates connecting to the pins listed above.");
  } else if (images.length) {
    lines.push("You can describe this visual diagram and annotate its components using vector elements: draw highlight rectangles, callout circles, pointing arrows, and text labels directly around or over the diagram (within x=515..945, y=30..300).");
  }

  const written = page.marks.filter(mark => mark.type === "text").slice(0, 24).map(mark => `"${mark.text}"`);
  if (written.length) lines.push(`Text already on the board: ${written.join("; ")}`);
  const inkText = page.ink.filter(mark => mark.type === "text").slice(0, 8).map(mark => `"${mark.text}"`);
  if (inkText.length) lines.push(`The learner's own notes: ${inkText.join("; ")}`);
  if (page.ink.length) lines.push(`The learner has drawn ${page.ink.length} ink mark(s) on this page.`);
  return lines.join("\n");
}

/**
 * Deterministic annotation path for guided lessons: no model, no API key.
 * Returns null when the prompt does not name a part of the current diagram.
 */
export function guidedAnnotation(page: BoardPage | null, prompt: string, lang: SupportedLanguage = "en"): { page: BoardPage; explanation: string } | null {
  const regions = getEffectiveRegions(page);
  if (!regions.length) return null;
  const region = matchRegion(page, prompt);
  const isHi = lang === "hi" || /[\u0900-\u097F]/.test(prompt);
  const isHinglish = lang === "hinglish";
  if (!region) {
    if (/blood.*flow|circulat|cardiac.*cycle|trace.*blood|how.*blood|खून|रक्त|circulation/i.test(prompt)) {
      const ra = regions.find(r => r.id === "right-atrium");
      const rv = regions.find(r => r.id === "right-ventricle");
      const lv = regions.find(r => r.id === "left-ventricle");
      const aorta = regions.find(r => r.id === "aorta");
      if (ra && rv && aorta) {
        const marks: BoardMark[] = [
          ...marksFor(ra, "circle"),
          ...marksFor(rv, "circle"),
          ...(lv ? marksFor(lv, "circle") : []),
          ...marksFor(aorta, "arrow", "Aorta (to body)"),
        ];
        const explanation = isHi
          ? "रक्त परिसंचरण (Blood circulation) दो चक्रों में होता है: अशुद्ध रक्त वेना कावा से दाएँ अलिंद (Right Atrium) में आता है, ट्राइकस्पिड वाल्व से दाएँ निलय (Right Ventricle) में जाता है, और फुफ्फुसीय धमनी से फेफड़ों में भेजा जाता है। ऑक्सीजन युक्त रक्त फुफ्फुसीय शिराओं से बाएँ अलिंद (Left Atrium) में आता है, बाइकस्पिड वाल्व से बाएँ निलय (Left Ventricle) में पहुँचता है, और महाधमनी (Aorta) से पूरे शरीर में उच्च दबाव से पंप होता है!"
          : isHinglish
          ? "Blood circulation do loops me flow karta hai: Deoxygenated blood Vena Cava se Right Atrium me aata hai, Tricuspid Valve ke through Right Ventricle me jaata hai, aur Pulmonary Artery se lungs bheja jaata hai. Oxygenated blood Pulmonary Veins se Left Atrium me aata hai, Bicuspid Valve se Left Ventricle me pahunchta hai, aur Aorta ke through high pressure se poori body me pump hota hai!"
          : "Blood circulation flows in two loops: deoxygenated blood enters the Right Atrium from the Vena Cava, passes through the Tricuspid Valve into the Right Ventricle, and is pumped via the Pulmonary Artery to the lungs. Oxygen-rich blood returns via Pulmonary Veins into the Left Atrium, flows into the Left Ventricle through the Bicuspid Valve, and is propelled with high pressure through the Aorta to the rest of the body!";
        return {
          page: withAnnotations(page || { id: "p", title: "", marks: [], ink: [], cursor: { x: 0, y: 0 } }, marks),
          explanation,
        };
      }
    }
    return null;
  }
  const q = prompt.toLowerCase();
  const style: AnnotationStyle = /highlight/.test(q) ? "highlight"
    : /underline/.test(q) ? "underline"
    : /wire|connect|lead/.test(q) ? "wire"
    : /label|name it|write/.test(q) ? "label"
    : /box|square|rectangle/.test(q) ? "box"
    : /point|where|arrow|show me|locate|circle|find/.test(q) ? "circle"
    : "circle";
  const verb: Record<AnnotationStyle, string> = {
    highlight: "highlighted", underline: "underlined", circle: "circled",
    box: "boxed", arrow: "pointed to", label: "labelled", wire: "connected a wire to",
  };
  const note = region.note || `${region.label} is one of the parts of this diagram.`;
  const explanation = isHi
    ? `मैंने चित्र पर ${region.label} को चिह्नित किया है। ${note}`
    : isHinglish
    ? `Maine diagram par ${region.label} ko mark kar diya hai. ${note}`
    : `I’ve ${verb[style]} the ${region.label} on the diagram. ${note}`;
  return {
    page: withAnnotations(page || { id: "p", title: "", marks: [], ink: [], cursor: { x: 0, y: 0 } }, marksFor(region, style)),
    explanation,
  };
}
