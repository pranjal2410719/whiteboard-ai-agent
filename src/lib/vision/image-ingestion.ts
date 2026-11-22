import crypto from "crypto";
import type { ImageIngestionResult } from "./types";

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

/**
 * Parses image dimensions from PNG buffer (IHDR chunk).
 */
function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
  }
  return null;
}

/**
 * Parses image dimensions from JPEG buffer.
 */
function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length - 8) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    // Baseline SOF0 (0xC0) or Progressive SOF2 (0xC2)
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) return { width, height };
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  return null;
}

/**
 * Parses SVG dimensions or viewBox.
 */
function parseSvgDimensions(content: string): { width: number; height: number } | null {
  const vbMatch = content.match(/viewBox=["']\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*["']/i);
  if (vbMatch) {
    const w = parseFloat(vbMatch[3]);
    const h = parseFloat(vbMatch[4]);
    if (w > 0 && h > 0) return { width: Math.round(w), height: Math.round(h) };
  }
  const wMatch = content.match(/width=["']([0-9.]+)(?:px)?["']/i);
  const hMatch = content.match(/height=["']([0-9.]+)(?:px)?["']/i);
  if (wMatch && hMatch) {
    const w = parseFloat(wMatch[1]);
    const h = parseFloat(hMatch[1]);
    if (w > 0 && h > 0) return { width: Math.round(w), height: Math.round(h) };
  }
  return null;
}

/**
 * Detects MIME type from magic bytes.
 */
export function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  const textSample = buffer.slice(0, 512).toString("utf-8").trim().toLowerCase();
  if (textSample.includes("<svg") || (textSample.startsWith("<?xml") && textSample.includes("<svg"))) {
    return "image/svg+xml";
  }
  return null;
}

/**
 * Ingests and validates an incoming raw image, base64 payload, or data URL.
 */
export function ingestImage(payload: string | Buffer): ImageIngestionResult {
  let buffer: Buffer;
  let declaredMime: string | undefined;

  if (Buffer.isBuffer(payload)) {
    buffer = payload;
  } else if (typeof payload === "string") {
    const dataUrlMatch = payload.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (dataUrlMatch) {
      declaredMime = dataUrlMatch[1];
      buffer = Buffer.from(dataUrlMatch[2], "base64");
    } else {
      // Direct base64 string
      buffer = Buffer.from(payload, "base64");
    }
  } else {
    return {
      valid: false,
      fileHash: "",
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(0),
      naturalWidth: 0,
      naturalHeight: 0,
      error: "Invalid image input payload. Must be a Buffer or Base64 string.",
    };
  }

  if (buffer.length === 0) {
    return {
      valid: false,
      fileHash: "",
      mimeType: "application/octet-stream",
      buffer,
      naturalWidth: 0,
      naturalHeight: 0,
      error: "Empty image payload.",
    };
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      fileHash: "",
      mimeType: declaredMime || "application/octet-stream",
      buffer,
      naturalWidth: 0,
      naturalHeight: 0,
      error: `Image exceeds maximum allowed size of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`,
    };
  }

  const detectedMime = detectMimeType(buffer) || declaredMime;
  if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
    return {
      valid: false,
      fileHash: "",
      mimeType: detectedMime || "application/octet-stream",
      buffer,
      naturalWidth: 0,
      naturalHeight: 0,
      error: `Unsupported image MIME type: ${detectedMime || "unknown"}. Supported types: PNG, JPEG, WEBP, SVG.`,
    };
  }

  // Dimension extraction
  let dimensions: { width: number; height: number } | null = null;
  if (detectedMime === "image/png") {
    dimensions = parsePngDimensions(buffer);
  } else if (detectedMime === "image/jpeg") {
    dimensions = parseJpegDimensions(buffer);
  } else if (detectedMime === "image/svg+xml") {
    dimensions = parseSvgDimensions(buffer.toString("utf-8"));
  }

  // Fallback default dimensions if not directly parseable
  const naturalWidth = dimensions?.width || 800;
  const naturalHeight = dimensions?.height || 600;

  // SHA-256 Hash
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  return {
    valid: true,
    fileHash: hash,
    mimeType: detectedMime,
    buffer,
    naturalWidth,
    naturalHeight,
  };
}
