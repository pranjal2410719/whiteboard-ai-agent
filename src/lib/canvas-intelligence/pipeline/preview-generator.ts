import fs from "fs";
import path from "path";
import type { AssetCanvasMap, SemanticElement } from "../types";
import { polygonToSvgPath } from "../geometry";

export class PreviewGenerator {
  /**
   * Generates a standalone SVG string displaying the asset and its semantic wireframes.
   */
  static generateSvgPreview(assetMap: AssetCanvasMap): string {
    const { naturalWidth, naturalHeight } = assetMap;
    const padding = 20;
    const totalW = naturalWidth + padding * 2;
    const totalH = naturalHeight + padding * 2;

    const elementsMarkup: string[] = [];

    // Helper for status color
    const getStatusColor = (el: SemanticElement) => {
      if (el.verificationStatus === "verified") return "#10b981"; // green
      if (el.verificationStatus === "tentative") return "#f59e0b"; // amber
      return "#ef4444"; // red
    };

    // Render semantic geometry overlays
    for (const el of assetMap.elements) {
      const color = getStatusColor(el);
      const geom = el.geometry;

      if (geom.kind === "box") {
        elementsMarkup.push(`
          <g class="preview-element" data-element-id="${el.id}">
            <rect x="${geom.box.x + padding}" y="${geom.box.y + padding}" width="${geom.box.w}" height="${geom.box.h}"
              fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="2" stroke-dasharray="${el.verificationStatus === 'unverified' ? '4,4' : 'none'}"/>
            <text x="${geom.box.x + padding + 4}" y="${geom.box.y + padding + 14}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="${color}">
              ${el.name} [${el.verificationStatus}]
            </text>
          </g>
        `);
      } else if (geom.kind === "polygon") {
        const shiftedPoints: [number, number][] = geom.points.map(([px, py]) => [px + padding, py + padding]);
        elementsMarkup.push(`
          <g class="preview-element" data-element-id="${el.id}">
            <path d="${polygonToSvgPath(shiftedPoints)}" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-width="2.2" stroke-dasharray="${el.verificationStatus === 'unverified' ? '4,4' : 'none'}"/>
            <text x="${geom.bounds.x + padding + 4}" y="${geom.bounds.y + padding + 14}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="${color}">
              ${el.name} [${el.verificationStatus}]
            </text>
          </g>
        `);
      } else if (geom.kind === "path") {
        elementsMarkup.push(`
          <g class="preview-element" data-element-id="${el.id}">
            <rect x="${geom.bounds.x + padding}" y="${geom.bounds.y + padding}" width="${geom.bounds.w}" height="${geom.bounds.h}"
              fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.5" stroke-dasharray="3,3"/>
            <text x="${geom.bounds.x + padding + 4}" y="${geom.bounds.y + padding + 14}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="${color}">
              ${el.name} [${el.verificationStatus}]
            </text>
          </g>
        `);
      }

      // Render anchor pins if available
      if (el.anchorPoints) {
        const { center } = el.anchorPoints;
        elementsMarkup.push(`
          <circle cx="${center.x + padding}" cy="${center.y + padding}" r="3" fill="${color}"/>
        `);
      }
    }

    // Render relationship arrows
    for (const el of assetMap.elements) {
      if (!el.anchorPoints) continue;
      for (const rel of el.relationships) {
        const target = assetMap.elements.find(t => t.id === rel.targetId);
        if (target && target.anchorPoints) {
          const x1 = el.anchorPoints.center.x + padding;
          const y1 = el.anchorPoints.center.y + padding;
          const x2 = target.anchorPoints.center.x + padding;
          const y2 = target.anchorPoints.center.y + padding;

          elementsMarkup.push(`
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3b82f6" stroke-width="1.8" stroke-dasharray="3,3" marker-end="url(#arrow-head)"/>
          `);
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
        <defs>
          <marker id="arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6"/>
          </marker>
        </defs>
        <!-- Background -->
        <rect width="${totalW}" height="${totalH}" fill="#0f172a"/>
        <!-- Asset Backdrop -->
        <rect x="${padding}" y="${padding}" width="${naturalWidth}" height="${naturalHeight}" fill="#1e293b" stroke="#334155" rx="6"/>
        <!-- Diagram Image -->
        <image href="${assetMap.source}" x="${padding}" y="${padding}" width="${naturalWidth}" height="${naturalHeight}" opacity="0.65"/>
        <!-- Semantic Landmarks -->
        ${elementsMarkup.join("\n")}
        <!-- Legend Overlay -->
        <g transform="translate(${padding}, ${totalH - 14})">
          <circle cx="6" cy="-4" r="5" fill="#10b981"/>
          <text x="16" y="0" font-family="system-ui, sans-serif" font-size="10" fill="#e2e8f0">Verified</text>
          <circle cx="80" cy="-4" r="5" fill="#f59e0b"/>
          <text x="90" y="0" font-family="system-ui, sans-serif" font-size="10" fill="#e2e8f0">Tentative</text>
          <circle cx="156" cy="-4" r="5" fill="#ef4444"/>
          <text x="166" y="0" font-family="system-ui, sans-serif" font-size="10" fill="#e2e8f0">Unverified</text>
          <line x1="240" y1="-4" x2="260" y2="-4" stroke="#3b82f6" stroke-width="2"/>
          <text x="268" y="0" font-family="system-ui, sans-serif" font-size="10" fill="#e2e8f0">Relationship Flow</text>
        </g>
      </svg>
    `;
  }

  /**
   * Generates a full HTML preview document with visual gallery and inspector.
   */
  static generateGalleryHtml(assetMaps: AssetCanvasMap[]): string {
    const cards = assetMaps.map(asset => {
      const svgPreview = this.generateSvgPreview(asset);
      const verified = asset.elements.filter(e => e.verificationStatus === "verified").length;
      const tentative = asset.elements.filter(e => e.verificationStatus === "tentative").length;
      const unverified = asset.elements.filter(e => e.verificationStatus === "unverified").length;

      const elementRows = asset.elements.map(e => `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 6px 10px; font-weight: 600; color: #f8fafc;">${e.name}</td>
          <td style="padding: 6px 10px; font-family: monospace; color: #94a3b8;">${e.id}</td>
          <td style="padding: 6px 10px; color: #cbd5e1;">${e.category}</td>
          <td style="padding: 6px 10px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: ${
              e.verificationStatus === 'verified' ? '#065f46; color: #34d399' :
              e.verificationStatus === 'tentative' ? '#78350f; color: #fbbf24' : '#7f1d1d; color: #f87171'
            };">
              ${e.verificationStatus}
            </span>
          </td>
          <td style="padding: 6px 10px; color: #a5b4fc;">${e.confidence.toFixed(2)}</td>
          <td style="padding: 6px 10px; color: #94a3b8; font-size: 11px;">${e.allowedActions.join(", ")}</td>
        </tr>
      `).join("");

      return `
        <div style="background: #1e293b; border-radius: 12px; border: 1px solid #334155; margin-bottom: 40px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
          <div style="padding: 20px 24px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="margin: 0; color: #f8fafc; font-size: 20px;">${asset.title}</h2>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">ID: <code>${asset.assetId}</code> · Subject: <strong>${asset.subject}</strong> · Natural Dimensions: <strong>${asset.naturalWidth} × ${asset.naturalHeight}</strong></p>
            </div>
            <div style="display: flex; gap: 8px;">
              <span style="padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #065f46; color: #34d399;">${verified} Verified</span>
              ${tentative > 0 ? `<span style="padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #78350f; color: #fbbf24;">${tentative} Tentative</span>` : ''}
              ${unverified > 0 ? `<span style="padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #7f1d1d; color: #f87171;">${unverified} Unverified</span>` : ''}
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px;">
            <div style="background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 12px; display: flex; justify-content: center; align-items: center;">
              ${svgPreview}
            </div>
            <div style="overflow-x: auto; max-height: 400px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <thead>
                  <tr style="border-bottom: 2px solid #475569; color: #94a3b8;">
                    <th style="padding: 8px 10px;">Name</th>
                    <th style="padding: 8px 10px;">ID</th>
                    <th style="padding: 8px 10px;">Category</th>
                    <th style="padding: 8px 10px;">Status</th>
                    <th style="padding: 8px 10px;">Conf</th>
                    <th style="padding: 8px 10px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${elementRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join("");

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Qrie CIE Asset Preparation Pipeline — Visual Gallery</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 32px; }
          header { margin-bottom: 32px; border-bottom: 1px solid #334155; padding-bottom: 20px; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          p { margin: 0; color: #94a3b8; }
        </style>
      </head>
      <body>
        <header>
          <h1>Qrie Canvas Intelligence Engine · Asset Preparation Pipeline</h1>
          <p>Phase 2 Benchmark Assets: Human Heart, Human Cell, Water Cycle, DC Electric Circuit, Inclined Plane Mechanics.</p>
        </header>
        <main>
          ${cards}
        </main>
      </body>
      </html>
    `;
  }

  /**
   * Saves previews for asset maps to disk.
   */
  static savePreviews(assetMaps: AssetCanvasMap[], targetDir: string): string[] {
    const resolvedDir = path.resolve(targetDir);
    if (!fs.existsSync(resolvedDir)) {
      fs.mkdirSync(resolvedDir, { recursive: true });
    }

    const savedFiles: string[] = [];

    for (const asset of assetMaps) {
      const svgPath = path.join(resolvedDir, `${asset.assetId}-preview.svg`);
      fs.writeFileSync(svgPath, this.generateSvgPreview(asset), "utf-8");
      savedFiles.push(svgPath);
    }

    const htmlPath = path.join(resolvedDir, "index.html");
    fs.writeFileSync(htmlPath, this.generateGalleryHtml(assetMaps), "utf-8");
    savedFiles.push(htmlPath);

    return savedFiles;
  }
}
