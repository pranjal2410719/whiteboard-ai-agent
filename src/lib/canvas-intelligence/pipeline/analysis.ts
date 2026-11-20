import fs from "fs";
import path from "path";
import type { BoundingBox } from "../types";
import type { IngestedAssetPackage } from "./ingestion";

export interface SvgTextNode {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
}

export interface SvgNumberBadge {
  number: number;
  cx: number;
  cy: number;
  r: number;
  color?: string;
}

export interface RawDetectedFeature {
  id: string;
  rawName: string;
  suggestedCategory?: string;
  box: BoundingBox;
  polygonPoints?: [number, number][];
  pathD?: string;
  textSnippet?: string;
  detectedColor?: string;
  detectionConfidence: number; // 0.00 - 1.00
  detectionMethod: "svg-legend-cluster" | "svg-shape" | "manifest-hint" | "raster-heuristic";
  uncertaintyFlags: string[];
}

/**
 * Loads default curriculum hint regions from assets-manifest.json if present.
 */
export function loadManifestHintsForAsset(pkg: IngestedAssetPackage): Array<{
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category?: string;
  note?: string;
}> | null {
  try {
    const manifestPath = path.resolve(process.cwd(), "public/assets/assets-manifest.json");
    if (!fs.existsSync(manifestPath)) return null;
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    if (!Array.isArray(manifest)) return null;

    const baseName = pkg.filePath ? path.basename(pkg.filePath).toLowerCase() : "";
    const sourceBase = pkg.source ? path.basename(pkg.source).toLowerCase() : "";
    const assetId = pkg.assetId.toLowerCase();

    const entry = manifest.find((m: any) => {
      const mId = (m.id || "").toLowerCase();
      const mFile = (m.filename || "").toLowerCase();
      const mSrc = (m.src || "").toLowerCase();
      return (
        mId === assetId ||
        mId.replace(/[_\s]+/g, "-") === assetId.replace(/[_\s]+/g, "-") ||
        (baseName && mFile === baseName) ||
        (sourceBase && mFile === sourceBase) ||
        (sourceBase && mSrc.includes(sourceBase))
      );
    });

    if (entry && Array.isArray(entry.regions)) {
      return entry.regions.map((r: any) => ({
        id: r.id,
        label: r.label,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        category: r.category,
        note: r.note,
      }));
    }
  } catch {
    // Proceed without manifest hints if reading fails
  }
  return null;
}

/**
 * Parses raw SVG markup into structured text, badges, and shapes.
 */
export function extractSvgElements(svg: string): {
  texts: SvgTextNode[];
  badges: SvgNumberBadge[];
} {
  const texts: SvgTextNode[] = [];
  const badges: SvgNumberBadge[] = [];

  // 1. Extract all <text ...>content</text>
  const textRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = textRegex.exec(svg)) !== null) {
    const attrs = tMatch[1];
    const content = tMatch[2].replace(/<[^>]+>/g, "").trim();
    if (!content) continue;

    const xMatch = attrs.match(/\bx=["']([0-9.-]+)["']/i);
    const yMatch = attrs.match(/\by=["']([0-9.-]+)["']/i);
    const fsMatch = attrs.match(/\bfont-size=["']([0-9.-]+)["']/i);

    const x = xMatch ? parseFloat(xMatch[1]) : 0;
    const y = yMatch ? parseFloat(yMatch[1]) : 0;
    const fontSize = fsMatch ? parseFloat(fsMatch[1]) : 12;

    texts.push({ text: content, x, y, fontSize });
  }

  // 2. Extract numbered badges (circle with number text)
  // Support any attribute ordering on circle tag
  const circleWithTextRegex = /<circle\b([^>]*)\/>\s*<text\b[^>]*>([0-9]+)<\/text>/gi;
  let bMatch: RegExpExecArray | null;
  while ((bMatch = circleWithTextRegex.exec(svg)) !== null) {
    const cAttrs = bMatch[1];
    const num = parseInt(bMatch[2], 10);
    const cxMatch = cAttrs.match(/\bcx=["']([0-9.-]+)["']/i);
    const cyMatch = cAttrs.match(/\bcy=["']([0-9.-]+)["']/i);
    const rMatch = cAttrs.match(/\br=["']([0-9.-]+)["']/i);
    const fillMatch = cAttrs.match(/\bfill=["']([^"']+)["']/i);

    if (cxMatch && cyMatch && rMatch) {
      badges.push({
        cx: parseFloat(cxMatch[1]),
        cy: parseFloat(cyMatch[2]),
        r: parseFloat(rMatch[1]),
        color: fillMatch ? fillMatch[1] : undefined,
        number: num,
      });
    }
  }

  return { texts, badges };
}

/**
 * Image and Diagram Analyzer.
 */
export class ImageAnalyzer {
  /**
   * Analyzes an ingested asset package and extracts detected visual and semantic components.
   */
  static analyze(
    pkg: IngestedAssetPackage,
    hints?: Array<{
      id: string;
      label: string;
      x: number;
      y: number;
      w: number;
      h: number;
      category?: string;
      note?: string;
    }>
  ): RawDetectedFeature[] {
    const features: RawDetectedFeature[] = [];

    // Path A: SVG diagram analysis
    if (pkg.format === "svg" && pkg.rawSvg) {
      const { texts, badges } = extractSvgElements(pkg.rawSvg);

      // Find numbered legend items: "1 Cell membrane", "2 Nucleus", etc.
      const legendItems = new Map<number, string>();
      for (const t of texts) {
        const m = t.text.match(/^([0-9]+)\s+(.+)$/);
        if (m) {
          legendItems.set(parseInt(m[1], 10), m[2].trim());
        }
      }

      // If we have badges and legend items, correlate them to create detected features
      for (const badge of badges) {
        const legendLabel = legendItems.get(badge.number);
        if (legendLabel) {
          const w = Math.max(badge.r * 5, 50);
          const h = Math.max(badge.r * 5, 40);
          const x = Math.max(0, Math.round(badge.cx - w / 2));
          const y = Math.max(0, Math.round(badge.cy - h / 2));

          const normId = legendLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          features.push({
            id: normId,
            rawName: legendLabel,
            box: { x, y, w, h },
            textSnippet: `${badge.number} ${legendLabel}`,
            detectedColor: badge.color,
            detectionConfidence: 0.92,
            detectionMethod: "svg-legend-cluster",
            uncertaintyFlags: [],
          });
        }
      }

      // If no numbered badges were found, inspect direct educational text labels
      if (features.length === 0 && texts.length > 0) {
        for (const t of texts) {
          // Filter out trivial numbers, symbols, and mathematical operators
          const clean = t.text.trim();
          if (clean.length < 2 || /^[+\-−=0-9]$/.test(clean)) continue;

          const normId = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          if (!normId) continue;

          // Estimate candidate bounding box around the text label
          const approxW = Math.max(45, Math.round(clean.length * (t.fontSize || 11) * 0.65));
          const approxH = Math.max(25, Math.round((t.fontSize || 11) * 2));
          const x = Math.max(0, Math.min(pkg.naturalWidth - approxW, Math.round(t.x - 5)));
          const y = Math.max(0, Math.min(pkg.naturalHeight - approxH, Math.round(t.y - approxH + 5)));

          let uniqueId = normId;
          let counter = 2;
          while (features.some(f => f.id === uniqueId)) {
            uniqueId = `${normId}-${counter++}`;
          }

          features.push({
            id: uniqueId,
            rawName: clean,
            box: { x, y, w: approxW, h: approxH },
            textSnippet: clean,
            detectionConfidence: 0.85,
            detectionMethod: "svg-shape",
            uncertaintyFlags: [],
          });
        }
      }
    }

    // Path B: Ingest from curriculum hints (provided or from assets-manifest.json)
    const effectiveHints = (hints && hints.length > 0) ? hints : loadManifestHintsForAsset(pkg);
    if (effectiveHints && effectiveHints.length > 0) {
      for (const hint of effectiveHints) {
        const normHintId = hint.id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const existingIdx = features.findIndex(
          f => f.id === hint.id || f.id === normHintId || f.rawName.toLowerCase() === hint.label.toLowerCase()
        );

        if (existingIdx >= 0) {
          // Refine existing feature bounds with precise curriculum coordinates
          features[existingIdx].id = hint.id;
          features[existingIdx].box = {
            x: hint.x,
            y: hint.y,
            w: hint.w,
            h: hint.h,
          };
          features[existingIdx].rawName = hint.label;
          features[existingIdx].suggestedCategory = hint.category;
          features[existingIdx].detectionConfidence = Math.max(features[existingIdx].detectionConfidence, 0.95);
        } else {
          features.push({
            id: hint.id,
            rawName: hint.label,
            suggestedCategory: hint.category,
            box: {
              x: hint.x,
              y: hint.y,
              w: hint.w,
              h: hint.h,
            },
            detectionConfidence: 0.90,
            detectionMethod: "manifest-hint",
            uncertaintyFlags: [],
          });
        }
      }
    }

    // Fallback: If no components could be detected, generate candidate main diagram region flagged for verification
    if (features.length === 0) {
      const w = Math.round(pkg.naturalWidth * 0.7);
      const h = Math.round(pkg.naturalHeight * 0.7);
      const x = Math.round((pkg.naturalWidth - w) / 2);
      const y = Math.round((pkg.naturalHeight - h) / 2);

      features.push({
        id: `${pkg.assetId}-main`,
        rawName: `${pkg.title} (Main Region)`,
        box: { x, y, w, h },
        detectionConfidence: 0.50,
        detectionMethod: "raster-heuristic",
        uncertaintyFlags: ["unverified_raster_detection", "human_curriculum_annotation_required"],
      });
    }

    // Flag any features with coordinates near or exceeding image bounds
    for (const f of features) {
      if (
        f.box.x < 0 ||
        f.box.y < 0 ||
        f.box.x + f.box.w > pkg.naturalWidth ||
        f.box.y + f.box.h > pkg.naturalHeight
      ) {
        f.uncertaintyFlags.push("out_of_bounds_detected");
        f.detectionConfidence = Math.min(f.detectionConfidence, 0.6);
      }
      if (f.box.w < 10 || f.box.h < 10) {
        f.uncertaintyFlags.push("suspiciously_small_region");
        f.detectionConfidence = Math.min(f.detectionConfidence, 0.7);
      }
    }

    return features;
  }
}
