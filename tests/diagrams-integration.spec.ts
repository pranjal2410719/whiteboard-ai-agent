import { expect, test, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import type { RendererExecutionConfirmation } from "../src/lib/canvas-intelligence/types";

async function openStudio(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Multi-Asset CIE Whiteboard Integration & Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await openStudio(page);
  });

  test("1. Human Cell: executes highlight, circle, and flow arrows in SVG DOM", async ({ page }) => {
    // Switch CIE to Human Cell
    const switched = await page.evaluate(() => {
      return (window as any).__qrieCIE.switchAsset("human-cell");
    });
    expect(switched).toBe(true);

    // 1. Highlight mitochondria
    const hRes: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.highlightElement("mitochondria", "#e2a526", "fill");
    });
    expect(hRes.success).toBe(true);
    expect(hRes.renderedInDOM).toBe(true);
    expect(hRes.renderedLayer).toBe("teacher-annotations");

    // 2. Circle the nucleus
    const cRes: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.circleElement("nucleus", "#8a6a9e");
    });
    expect(cRes.success).toBe(true);
    expect(cRes.renderedInDOM).toBe(true);

    // 3. Draw vesicle transfer arrow from rough-er to golgi-body
    const aRes: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.drawArrow("rough-er", "golgi-body", "#3b805c", "Vesicle Transfer");
    });
    expect(aRes.success).toBe(true);
    expect(aRes.renderedInDOM).toBe(true);

    // Check SVG DOM has marks for all 3 operations
    const annotLayer = page.locator('.canvas-layer-teacher-annotations[data-layer="teacher-annotations"]');
    const marks = annotLayer.locator('[data-cie-mark="true"]');
    expect(await marks.count()).toBeGreaterThanOrEqual(4); // rect + ellipse + path arrow + text

    // Capture visual preview screenshot
    const previewDir = path.resolve(process.cwd(), "docs/previews");
    if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });
    await page.screenshot({ path: path.join(previewDir, "browser-cell-live.png") });
  });

  test("2. Water Cycle: executes hydrologic cycle flow arrows and thermal highlight in SVG DOM", async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__qrieCIE.switchAsset("water-cycle");
    });

    // Thermal highlight on sun
    const hSun: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.circleElement("sun", "#f59e0b");
    });
    expect(hSun.success).toBe(true);
    expect(hSun.renderedInDOM).toBe(true);

    // Flow arrow from evaporation to condensation
    const aEvap: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.drawArrow("evaporation", "condensation", "#507aaf", "Ascending Vapour");
    });
    expect(aEvap.success).toBe(true);
    expect(aEvap.renderedInDOM).toBe(true);

    // Label on condensation
    const lCloud: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.addLabel("condensation", "Nucleated Cloud Droplets");
    });
    expect(lCloud.success).toBe(true);
    expect(lCloud.renderedInDOM).toBe(true);

    const previewDir = path.resolve(process.cwd(), "docs/previews");
    await page.screenshot({ path: path.join(previewDir, "browser-water-live.png") });
  });

  test("3. DC Electric Circuit: highlights resistor and battery, connects with conventional current arrow", async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__qrieCIE.switchAsset("electric-circuit");
    });

    // Highlight battery source
    const hBat = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.highlightElement("battery", "#bc7948");
    });
    expect(hBat.success).toBe(true);
    expect(hBat.renderedInDOM).toBe(true);

    // Circle resistor
    const cRes = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.circleElement("resistor", "#507aaf");
    });
    expect(cRes.success).toBe(true);
    expect(cRes.renderedInDOM).toBe(true);

    // Current arrow from battery to switch
    const aCurrent = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.drawArrow("battery", "switch", "#3b805c", "I →");
    });
    expect(aCurrent.success).toBe(true);
    expect(aCurrent.renderedInDOM).toBe(true);

    const previewDir = path.resolve(process.cwd(), "docs/previews");
    await page.screenshot({ path: path.join(previewDir, "browser-circuit-live.png") });
  });

  test("4. Inclined Plane Mechanics: highlights normal force, friction, and draws opposing vectors", async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__qrieCIE.switchAsset("inclined-plane");
    });

    // Box block
    const hBlock = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.highlightElement("block", "#8a6a9e", "box");
    });
    expect(hBlock.success).toBe(true);
    expect(hBlock.renderedInDOM).toBe(true);

    // Underline equation
    const uEq = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.underlineElement("mechanics-equations", "#293b32");
    });
    expect(uEq.success).toBe(true);
    expect(uEq.renderedInDOM).toBe(true);

    // Callout on normal force
    const aFn = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.addAnnotation("normal-force", "F_N = mg cos θ");
    });
    expect(aFn.success).toBe(true);
    expect(aFn.renderedInDOM).toBe(true);

    const previewDir = path.resolve(process.cwd(), "docs/previews");
    await page.screenshot({ path: path.join(previewDir, "browser-plane-live.png") });
  });

  test("5. Human Heart: executes live chambers and captures screenshot", async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__qrieCIE.switchAsset("heart-diagram");
    });

    const hAtrium = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.highlightElement("right-atrium", "#e2a526", "fill");
    });
    expect(hAtrium.success).toBe(true);

    const cVentricle = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.circleElement("left-ventricle", "#c0504d");
    });
    expect(cVentricle.success).toBe(true);

    const aTricuspid = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.drawArrow("right-atrium", "right-ventricle", "#3b805c", "Tricuspid Flow");
    });
    expect(aTricuspid.success).toBe(true);

    const previewDir = path.resolve(process.cwd(), "docs/previews");
    await page.screenshot({ path: path.join(previewDir, "browser-heart-live.png") });
  });
});
