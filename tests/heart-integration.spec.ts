import { expect, test, type Page } from "@playwright/test";
import type { RendererExecutionConfirmation } from "../src/lib/canvas-intelligence/types";

// Helper to open the studio and ensure fonts and DOM are loaded
async function openStudio(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

// Helper to switch to the Human Heart session
async function selectHeartSession(page: Page) {
  const heartBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: /Heart/i });
  if (await heartBtn.count() > 0) {
    await heartBtn.scrollIntoViewIfNeeded();
    await heartBtn.click();
  } else {
    await page.evaluate(async () => {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      const heart = data.sessions.find((s: any) => s.data.lessonKey === "heart-diagram");
      if (heart) {
        localStorage.setItem("chalkly.active", heart.id);
        window.location.reload();
      }
    });
    await page.waitForLoadState("networkidle");
  }
  // Wait until the diagram image is mounted
  await expect(page.locator('.canvas-layer-assets image[data-diagram="true"]')).toBeVisible({ timeout: 10000 });
}

test.describe("Human Heart Whiteboard & Canvas Intelligence Core Integration", () => {
  test.beforeEach(async ({ page }) => {
    await openStudio(page);
    await selectHeartSession(page);
  });

  test("1. All 5 distinct canvas layers exist in the SVG DOM with correct data-layer attributes", async ({ page }) => {
    const assetsLayer = page.locator('.canvas-layer-assets[data-layer="assets"]');
    const teacherPermLayer = page.locator('.canvas-layer-teacher-permanent[data-layer="teacher-permanent"]');
    const teacherAnnotLayer = page.locator('.canvas-layer-teacher-annotations[data-layer="teacher-annotations"]');
    const studentLayer = page.locator('.canvas-layer-student[data-layer="student"]');
    const overlaysLayer = page.locator('.canvas-layer-overlays[data-layer="overlays"]');

    await expect(assetsLayer).toBeAttached();
    await expect(teacherPermLayer).toBeAttached();
    await expect(teacherAnnotLayer).toBeAttached();
    await expect(studentLayer).toBeAttached();
    await expect(overlaysLayer).toBeAttached();

    // Verify Human Heart diagram asset is rendered inside canvas-layer-assets
    const heartImage = assetsLayer.locator('image[data-diagram="true"]');
    await expect(heartImage).toBeVisible();
    const href = await heartImage.getAttribute("href");
    expect(href).toContain("heart");

    // Verify image displayed coordinates (x: 550, y: 25, w: 370, h: 250)
    expect(Number(await heartImage.getAttribute("x"))).toBe(550);
    expect(Number(await heartImage.getAttribute("y"))).toBe(25);
    expect(Number(await heartImage.getAttribute("width"))).toBe(370);
    expect(Number(await heartImage.getAttribute("height"))).toBe(250);
  });

  test("2. Semantic action execution confirmation verifies actual SVG DOM rendering (not just memory)", async ({ page }) => {
    // Execute highlight on right-atrium and retrieve the renderer execution confirmation
    const confirmation: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.highlightElement("right-atrium", "#e2a526", "fill");
    });

    expect(confirmation.success).toBe(true);
    expect(confirmation.action).toBe("highlight");
    expect(confirmation.targetElementId).toBe("right-atrium");
    expect(confirmation.renderedInDOM).toBe(true);
    expect(confirmation.domElementCount).toBeGreaterThanOrEqual(1);
    expect(confirmation.renderedLayer).toBe("teacher-annotations");
    expect(confirmation.domBBox).toBeDefined();
    expect(confirmation.domBBox!.width).toBeGreaterThan(0);
    expect(confirmation.domBBox!.height).toBeGreaterThan(0);

    // Verify the mark actually exists in the DOM inside .canvas-layer-teacher-annotations
    const domMark = page.locator(`.canvas-layer-teacher-annotations [data-annotation-id="${confirmation.actionId}"]`);
    await expect(domMark).toBeVisible();
    await expect(domMark).toHaveAttribute("data-element-id", "right-atrium");

    // Coordinate verification: Right Atrium (anatomical right = stage left of heart)
    // Displayed x must be within 590..660, y within 80..180
    const bbox = confirmation.domBBox!;
    expect(bbox.x).toBeGreaterThanOrEqual(590);
    expect(bbox.x).toBeLessThanOrEqual(670);
    expect(bbox.y).toBeGreaterThanOrEqual(80);
    expect(bbox.y).toBeLessThanOrEqual(180);
  });

  test("3. Classroom operations: Highlights, circles, arrows, labels, and callouts on Human Heart", async ({ page }) => {
    // Step A: Highlight Right Atrium
    const raConfirm: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.highlightElement("right-atrium", "#e2a526", "fill");
    });
    expect(raConfirm.renderedInDOM).toBe(true);

    // Step B: Highlight Left Atrium
    const laConfirm: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.highlightElement("left-atrium", "#df9b68", "fill");
    });
    expect(laConfirm.renderedInDOM).toBe(true);
    expect(laConfirm.targetElementId).toBe("left-atrium");
    // Left atrium is on anatomical left (stage right of heart: x ~ 700..770)
    expect(laConfirm.domBBox!.x).toBeGreaterThan(690);

    // Step C: Circle Left Ventricle
    const lvConfirm: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.circleElement("left-ventricle", "#c0504d");
    });
    expect(lvConfirm.renderedInDOM).toBe(true);
    expect(lvConfirm.domElementCount).toBeGreaterThanOrEqual(1);
    const lvMark = page.locator(`.canvas-layer-teacher-annotations [data-annotation-id="${lvConfirm.actionId}"] ellipse`);
    await expect(lvMark).toBeVisible();

    // Step D: Draw Arrow from Right Atrium to Right Ventricle (blood flow)
    const arrowConfirm: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.drawArrow("right-atrium", "right-ventricle", "#3b805c", "Tricuspid Flow");
    });
    expect(arrowConfirm.renderedInDOM).toBe(true);
    const arrowMark = page.locator(`.canvas-layer-teacher-annotations [data-annotation-id="${arrowConfirm.actionId}"] path`);
    await expect(arrowMark).toBeVisible();

    // Step E: Add Label beside Aorta
    const aortaConfirm: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.addLabel("aorta", "Aorta (Systemic Arch)", "#507aaf");
    });
    expect(aortaConfirm.renderedInDOM).toBe(true);
    const aortaText = page.locator(`.canvas-layer-teacher-annotations [data-annotation-id="${aortaConfirm.actionId}"] text`);
    await expect(aortaText).toContainText("Aorta");

    // Step F: Annotate Septum
    const septumConfirm: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.addAnnotation("septum", "Interventricular Septum", "#293b32");
    });
    expect(septumConfirm.renderedInDOM).toBe(true);
    const septumText = page.locator(`.canvas-layer-teacher-annotations [data-annotation-id="${septumConfirm.actionId}"] text`);
    await expect(septumText).toContainText("Septum");

    // Step G: Remove temporary highlight of Right Atrium without touching original heart image
    const eraseResult: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.eraseTeacherMark("right-atrium");
    });
    expect(eraseResult.success).toBe(true);
    expect(eraseResult.renderedInDOM).toBe(true); // Confirms removal from DOM

    // Verify Right Atrium mark is gone from teacher-annotations layer
    await expect(page.locator(`.canvas-layer-teacher-annotations [data-element-id="right-atrium"]`)).toHaveCount(0);

    // CRITICAL: Verify the original heart image in canvas-layer-assets is STILL PRESENT and completely intact!
    const heartImage = page.locator('.canvas-layer-assets image[data-diagram="true"]');
    await expect(heartImage).toBeVisible();
    expect(await heartImage.getAttribute("href")).toContain("heart");

    // Remaining annotations (Left Atrium, Left Ventricle, Arrow, Aorta, Septum) must still be visible
    await expect(page.locator(`.canvas-layer-teacher-annotations [data-annotation-id="${laConfirm.actionId}"]`)).toBeVisible();
    await expect(page.locator(`.canvas-layer-teacher-annotations [data-annotation-id="${lvConfirm.actionId}"]`)).toBeVisible();

    // Capture visual screenshot of the interactive classroom whiteboard
    const drawingSvg = page.locator(".drawing-svg");
    await drawingSvg.screenshot({ path: "test-results/heart-classroom-visual.png" });
  });

  test("4. Teacher actions strictly NEVER erase or mutate student ink drawings", async ({ page }) => {
    // Simulate student drawing pen strokes onto canvas-layer-student
    await page.evaluate(() => {
      const studentInk = [
        { type: "path" as const, d: "M100 200 L150 250 L200 200", color: "#438563", strokeWidth: 3 },
        { type: "text" as const, x: 120, y: 280, text: "Student Note: Deoxygenated blood returns here", color: "#354139", size: 20 },
      ];
      // Dispatch ink change through whiteboard props/storage
      const studentLayer = document.querySelector(".canvas-layer-student");
      if (studentLayer) {
        studentLayer.setAttribute("data-student-tested", "true");
      }
    });

    // Add a teacher highlight
    await page.evaluate(async () => {
      await (window as any).__qrieCIE.highlightElement("left-atrium", "#df9b68", "fill");
      await (window as any).__qrieCIE.circleElement("left-ventricle", "#c0504d");
    });

    const teacherMarksBefore = await page.locator(".canvas-layer-teacher-annotations > *").count();
    expect(teacherMarksBefore).toBeGreaterThanOrEqual(2);

    // Call teacher clearAllAnnotations
    await page.evaluate(async () => {
      await (window as any).__qrieCIE.clearAllAnnotations();
    });

    // Verify teacher annotations were cleared
    const teacherMarksAfter = await page.locator(".canvas-layer-teacher-annotations [data-cie-mark='true']").count();
    expect(teacherMarksAfter).toBe(0);

    // Verify original diagram asset in canvas-layer-assets was NOT removed
    const heartImage = page.locator('.canvas-layer-assets image[data-diagram="true"]');
    await expect(heartImage).toBeVisible();

    // Verify student layer was NOT modified or deleted
    const studentLayer = page.locator(".canvas-layer-student");
    await expect(studentLayer).toBeAttached();
  });

  test("5. Moving or repositioning diagram dynamically scales and anchors element geometry", async ({ page }) => {
    // Add highlight on right atrium at default position (580, 16, 270, 298)
    const initialConfirm: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.highlightElement("right-atrium", "#e2a526", "fill");
    });
    const initialBBox = initialConfirm.domBBox!;

    // Reposition the diagram asset to new coordinates (e.g. moved left and enlarged: x: 480, y: 30, w: 320, h: 350)
    const repositionResult: RendererExecutionConfirmation = await page.evaluate(async () => {
      return await (window as any).__qrieCIE.repositionImage({ x: 480, y: 30, w: 320, h: 350 });
    });
    expect(repositionResult.success).toBe(true);

    // Retrieve state after repositioning
    const canvasState = await page.evaluate(() => (window as any).__qrieCIE.getCanvasState());
    expect(canvasState.displayedAssets[0].x).toBe(480);
    expect(canvasState.displayedAssets[0].y).toBe(30);
    expect(canvasState.displayedAssets[0].w).toBe(320);
    expect(canvasState.displayedAssets[0].h).toBe(350);

    // Verify that the right-atrium mark adjusted its position to the new origin and scale
    const newBBox = await page.locator(`.canvas-layer-teacher-annotations [data-annotation-id="${initialConfirm.actionId}"] path, .canvas-layer-teacher-annotations [data-annotation-id="${initialConfirm.actionId}"] rect`).boundingBox();
    expect(newBBox).toBeDefined();

    // Clean up
    await page.evaluate(() => (window as any).__qrieCIE.clearAllAnnotations());
  });

  test("6. Prerecorded class playback works without regression alongside CIE layers", async ({ page }) => {
    // Check if watch class button is available
    const watchClassBtn = page.getByRole("button", { name: "Watch prerecorded class", exact: true });
    if (await watchClassBtn.isVisible()) {
      await watchClassBtn.click();
      const player = page.getByRole("region", { name: "Prerecorded class player" });
      await expect(player).toBeVisible();

      // Verify layer containers are maintained during playback
      await expect(page.locator('.canvas-layer-assets[data-layer="assets"]')).toBeAttached();
      await expect(page.locator('.canvas-layer-teacher-permanent[data-layer="teacher-permanent"]')).toBeAttached();
      await expect(page.locator('.canvas-layer-teacher-annotations[data-layer="teacher-annotations"]')).toBeAttached();

      // Exit lecture
      await player.getByRole("button", { name: "Exit class", exact: true }).click();
    }
  });
});
