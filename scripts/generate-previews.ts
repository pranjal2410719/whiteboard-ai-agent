import path from "path";
import fs from "fs";
import { CanvasAssetRegistry } from "../src/lib/canvas-intelligence/registry";
import { PreviewGenerator } from "../src/lib/canvas-intelligence/pipeline/preview-generator";

async function main() {
  console.log("Starting CIE Asset Preview Generation...");
  const assets = CanvasAssetRegistry.listRegisteredAssets().map(s => {
    const a = CanvasAssetRegistry.getAsset(s.assetId);
    if (!a) throw new Error(`Missing asset ${s.assetId}`);
    return a;
  });

  console.log(`Found ${assets.length} registered benchmark assets:`);
  assets.forEach(a => console.log(` - [${a.assetId}] ${a.title} (${a.elements.length} elements)`));

  const publicDir = path.resolve(process.cwd(), "public/previews");
  const docsDir = path.resolve(process.cwd(), "docs/previews");

  const pubFiles = PreviewGenerator.savePreviews(assets, publicDir);
  const docFiles = PreviewGenerator.savePreviews(assets, docsDir);

  console.log("Previews saved to public/previews:", pubFiles);
  console.log("Previews saved to docs/previews:", docFiles);
}

main().catch(err => {
  console.error("Error generating previews:", err);
  process.exit(1);
});
