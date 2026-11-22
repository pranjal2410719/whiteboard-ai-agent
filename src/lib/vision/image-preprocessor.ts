import type {
  ImageIngestionResult,
  NormalizedBoundingBox,
  PreprocessedImage,
} from "./types";

/**
 * Preprocesses an ingested image, normalizing dimensions and preparing data URLs.
 */
export function preprocessImage(ingestion: ImageIngestionResult): PreprocessedImage {
  const naturalWidth = Math.max(1, ingestion.naturalWidth);
  const naturalHeight = Math.max(1, ingestion.naturalHeight);
  const aspectRatio = naturalWidth / naturalHeight;
  const base64 = ingestion.buffer.toString("base64");
  const dataUrl = `data:${ingestion.mimeType};base64,${base64}`;

  return {
    hash: ingestion.fileHash,
    naturalWidth,
    naturalHeight,
    aspectRatio,
    dataUrl,
  };
}

/**
 * Clamps a normalized bounding box to [0, 1].
 */
export function clampNormalizedBox(box: NormalizedBoundingBox): NormalizedBoundingBox {
  const ymin = Math.max(0, Math.min(1, Math.min(box.ymin, box.ymax)));
  const ymax = Math.max(0, Math.min(1, Math.max(box.ymin, box.ymax)));
  const xmin = Math.max(0, Math.min(1, Math.min(box.xmin, box.xmax)));
  const xmax = Math.max(0, Math.min(1, Math.max(box.xmin, box.xmax)));
  return { ymin, xmin, ymax, xmax };
}

/**
 * Calculates sub-region cropping bounds in normalized coordinates.
 */
export function calculateCropBounds(
  parent: NormalizedBoundingBox,
  roi: NormalizedBoundingBox
): NormalizedBoundingBox {
  const pW = parent.xmax - parent.xmin;
  const pH = parent.ymax - parent.ymin;

  return clampNormalizedBox({
    xmin: parent.xmin + roi.xmin * pW,
    ymin: parent.ymin + roi.ymin * pH,
    xmax: parent.xmin + roi.xmax * pW,
    ymax: parent.ymin + roi.ymax * pH,
  });
}
