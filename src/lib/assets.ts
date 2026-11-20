import type { BoardMark, BoardPage, DiagramRegion } from "./types";
import manifest from "../../public/assets/assets-manifest.json";

export type ImageAssetDefinition = {
  id: string;
  title: string;
  subject: string;
  filename: string;
  src: string;
  alt: string;
  description: string;
  prompts: string[];
  regions: DiagramRegion[];
  aliases?: string[];
  layout?: { x: number; y: number; w: number; h: number };
};

export const assetCatalog: ImageAssetDefinition[] = manifest as ImageAssetDefinition[];

export function getAvailableAssets(): ImageAssetDefinition[] {
  return assetCatalog;
}

export function getAssetById(id: string): ImageAssetDefinition | undefined {
  const norm = id.trim().toLowerCase();
  const base = norm.split("/").pop()?.split("?")[0] || norm;
  const bare = base.replace(/\.[a-z0-9]+$/i, "");
  const slug = bare.replace(/[_\s]+/g, "-");
  return assetCatalog.find(
    a => {
      const aSlug = a.id.toLowerCase().replace(/[_\s]+/g, "-");
      const aBare = a.filename.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[_\s]+/g, "-");
      return (
        a.id.toLowerCase() === norm ||
        a.id.toLowerCase() === bare ||
        aSlug === slug ||
        aBare === slug ||
        a.filename.toLowerCase() === norm ||
        a.filename.toLowerCase() === base ||
        a.src.toLowerCase() === norm ||
        a.title.toLowerCase() === norm ||
        a.aliases?.some(al => {
          const alNorm = al.toLowerCase();
          const alBare = alNorm.replace(/\.[a-z0-9]+$/i, "");
          const alSlug = alBare.replace(/[_\s]+/g, "-");
          return alNorm === norm || alNorm === base || alBare === bare || alSlug === slug;
        })
      );
    }
  );
}

export const isAssetKey = (id: string): boolean => Boolean(getAssetById(id));

const DEFAULT_ASSET_LAYOUT = { x: 515, y: 30, w: 430, h: 270 };
const ink = "#293b32", green = "#3b805c", blue = "#507aaf", orange = "#bc7948", purple = "#8a6a9e";

export function createAssetBoardMark(
  asset: ImageAssetDefinition,
  layout = asset.layout || DEFAULT_ASSET_LAYOUT
): BoardMark {
  return {
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
}

export function createAssetPage(
  asset: ImageAssetDefinition,
  layout = asset.layout || DEFAULT_ASSET_LAYOUT
): BoardPage {
  const { x, y, w, h } = layout;
  // Shift local regions into global board coordinates
  const regions: DiagramRegion[] = asset.regions.map(r => ({
    ...r,
    x: r.x + x,
    y: r.y + y,
  }));

  const marks: BoardMark[] = [
    { type: "text", x: 53, y: 57, text: asset.title, size: 42, color: ink, weight: 650 },
    { type: "path", d: "M55 69 Q255 65 470 68", color: "#84b998", strokeWidth: 3.6, fill: "none" },
    { type: "text", x: 55, y: 112, text: asset.description.slice(0, 70), size: 24, color: ink, weight: 500 },
    { type: "text", x: 55, y: 160, text: "Ask your tutor to explain or mark parts:", size: 21, color: purple, weight: 600 },
    ...asset.prompts.slice(0, 3).map((prompt, i) => ({
      type: "text" as const,
      x: 55,
      y: 195 + i * 29,
      text: prompt,
      size: 22,
      color: [green, blue, orange][i % 3],
      weight: 500,
    })),
    createAssetBoardMark(asset, layout),
    { type: "text", x: 55, y: 300, text: "The tutor points, circles, and highlights components live.", size: 19, color: ink, weight: 500 },
  ];

  return {
    id: `asset-${asset.id}`,
    title: asset.title,
    marks,
    ink: [],
    cursor: { x: 905, y: 272 },
    regions,
  };
}
