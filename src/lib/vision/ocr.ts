import type { TextRegion } from "./types";

const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Searches detected OCR text regions for a query phrase or formula substring.
 */
export function findMatchingTextRegion(
  regions: TextRegion[],
  query: string
): TextRegion | null {
  if (!query || !regions.length) return null;
  const target = normalize(query);

  // Exact match
  for (const reg of regions) {
    if (normalize(reg.text) === target) return reg;
  }

  // Substring match
  for (const reg of regions) {
    const norm = normalize(reg.text);
    if (norm.includes(target) || target.includes(norm)) {
      return reg;
    }
  }

  return null;
}

/**
 * Parses raw provider OCR output into structured TextRegion array.
 */
export function parseRawOcrOutput(
  rawBlocks: Array<{ text: string; box?: [number, number, number, number]; confidence?: number }>
): TextRegion[] {
  return rawBlocks.map((b) => ({
    text: b.text,
    boundingBox: {
      ymin: b.box ? Math.max(0, Math.min(1, b.box[0])) : 0,
      xmin: b.box ? Math.max(0, Math.min(1, b.box[1])) : 0,
      ymax: b.box ? Math.max(0, Math.min(1, b.box[2])) : 1,
      xmax: b.box ? Math.max(0, Math.min(1, b.box[3])) : 1,
    },
    confidence: b.confidence ?? 0.9,
  }));
}
