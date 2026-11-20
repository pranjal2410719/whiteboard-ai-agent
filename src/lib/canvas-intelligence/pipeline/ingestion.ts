import fs from "fs";
import path from "path";

export type AssetFormat = "svg" | "png" | "jpeg" | "webp" | "unknown";

export interface IngestedAssetPackage {
  assetId: string;
  title: string;
  subject: string;
  source: string;
  filePath?: string;
  format: AssetFormat;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  rawSvg?: string;
  fileSizeBytes: number;
  metadata: Record<string, unknown>;
}

export interface IngestionOptions {
  assetId?: string;
  title?: string;
  subject?: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Extracts width and height from SVG markup.
 */
export function parseSvgDimensions(svgText: string): { width: number; height: number } | null {
  // Try viewBox first: viewBox="min-x min-y width height"
  const vbMatch = svgText.match(/viewBox=["']\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*["']/i);
  if (vbMatch) {
    const w = parseFloat(vbMatch[3]);
    const h = parseFloat(vbMatch[4]);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      return { width: Math.round(w), height: Math.round(h) };
    }
  }

  // Try width and height attributes
  const wMatch = svgText.match(/\bwidth=["']([0-9.]+)(?:px)?["']/i);
  const hMatch = svgText.match(/\bheight=["']([0-9.]+)(?:px)?["']/i);
  if (wMatch && hMatch) {
    const w = parseFloat(wMatch[1]);
    const h = parseFloat(hMatch[1]);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      return { width: Math.round(w), height: Math.round(h) };
    }
  }

  return null;
}

/**
 * Extracts width and height from a PNG buffer by inspecting the IHDR chunk.
 */
export function parsePngDimensions(buf: Buffer): { width: number; height: number } | null {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buf.length < 24) return null;
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;
  if (!isPng) return null;

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width > 0 && height > 0) {
    return { width, height };
  }
  return null;
}

/**
 * Extracts width and height from a JPEG buffer.
 */
export function parseJpegDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    // Baseline SOF0 or Progressive SOF2
    if (marker === 0xc0 || marker === 0xc2) {
      if (offset + 9 < buf.length) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
    }
    if (offset + 3 >= buf.length) break;
    const length = buf.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  return null;
}

/**
 * Reusable Asset Ingestion Service.
 */
export class AssetIngestion {
  /**
   * Ingests an asset from a file path on disk.
   */
  static ingestFromFile(filePath: string, options: IngestionOptions = {}): IngestedAssetPackage {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Asset file does not exist at path: ${resolvedPath}`);
    }

    const stat = fs.statSync(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    const baseName = path.basename(resolvedPath, ext);

    const assetId = options.assetId || baseName.replace(/[_\s]+/g, "-").toLowerCase();
    const title = options.title || baseName.replace(/[-_]+/g, " ");
    const subject = options.subject || "General Science";
    const sourceUrl = options.sourceUrl || `/assets/${path.basename(resolvedPath)}`;

    let format: AssetFormat = "unknown";
    let naturalWidth = 0;
    let naturalHeight = 0;
    let rawSvg: string | undefined;

    if (ext === ".svg") {
      format = "svg";
      rawSvg = fs.readFileSync(resolvedPath, "utf-8");
      const dims = parseSvgDimensions(rawSvg);
      if (dims) {
        naturalWidth = dims.width;
        naturalHeight = dims.height;
      }
    } else if (ext === ".png") {
      format = "png";
      const buf = fs.readFileSync(resolvedPath);
      const dims = parsePngDimensions(buf);
      if (dims) {
        naturalWidth = dims.width;
        naturalHeight = dims.height;
      }
    } else if (ext === ".jpg" || ext === ".jpeg") {
      format = "jpeg";
      const buf = fs.readFileSync(resolvedPath);
      const dims = parseJpegDimensions(buf);
      if (dims) {
        naturalWidth = dims.width;
        naturalHeight = dims.height;
      }
    } else if (ext === ".webp") {
      format = "webp";
    }

    if (naturalWidth <= 0 || naturalHeight <= 0) {
      throw new Error(
        `Unable to determine natural dimensions for asset file: ${resolvedPath}. Dimensions must be positive.`
      );
    }

    return {
      assetId,
      title,
      subject,
      source: sourceUrl,
      filePath: resolvedPath,
      format,
      naturalWidth,
      naturalHeight,
      aspectRatio: Number((naturalWidth / naturalHeight).toFixed(4)),
      rawSvg,
      fileSizeBytes: stat.size,
      metadata: options.metadata || {},
    };
  }

  /**
   * Ingests an SVG asset from a raw SVG string.
   */
  static ingestFromSvgString(
    svgContent: string,
    assetId: string,
    options: IngestionOptions = {}
  ): IngestedAssetPackage {
    const dims = parseSvgDimensions(svgContent);
    if (!dims) {
      throw new Error(`Failed to parse natural dimensions from SVG content for asset: ${assetId}`);
    }

    return {
      assetId,
      title: options.title || assetId.replace(/[-_]+/g, " "),
      subject: options.subject || "General Science",
      source: options.sourceUrl || `/assets/${assetId}.svg`,
      format: "svg",
      naturalWidth: dims.width,
      naturalHeight: dims.height,
      aspectRatio: Number((dims.width / dims.height).toFixed(4)),
      rawSvg: svgContent,
      fileSizeBytes: Buffer.byteLength(svgContent, "utf-8"),
      metadata: options.metadata || {},
    };
  }
}
