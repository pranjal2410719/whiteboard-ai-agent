import { expect, test } from "@playwright/test";
import { describePage, getEffectiveRegions, guidedAnnotation, resolveAnnotations } from "../src/lib/annotate";
import { getAssetById, getAvailableAssets, createAssetPage } from "../src/lib/assets";
import { sanitizeMark } from "../src/lib/tutor";
import type { BoardMark, BoardPage } from "../src/lib/types";

test("assets folder manifest loads all registered visual diagram assets", () => {
  const assets = getAvailableAssets();
  expect(assets.length).toBeGreaterThanOrEqual(4);

  const circuit = getAssetById("electric-circuit");
  expect(circuit).toBeDefined();
  expect(circuit?.filename).toBe("electric-circuit.svg");
  expect(circuit?.regions.some(r => r.id === "resistor")).toBe(true);

  const inclined = getAssetById("inclined-plane");
  expect(inclined).toBeDefined();
  expect(inclined?.regions.some(r => r.id === "normal-force")).toBe(true);
});

test("sanitizeMark validates and preserves image marks from assets", () => {
  const rawImage = {
    type: "image",
    src: "/assets/electric-circuit.svg",
    alt: "DC Circuit diagram",
    x: 515,
    y: 30,
    w: 430,
    h: 270,
  };
  const sanitized = sanitizeMark(rawImage);
  expect(sanitized).not.toBeNull();
  expect(sanitized?.type).toBe("image");
  expect(sanitized?.src).toBe("/assets/electric-circuit.svg");
  expect(sanitized?.alt).toBe("DC Circuit diagram");
  expect(sanitized?.w).toBe(430);
  expect(sanitized?.h).toBe(270);
});

test("describePage instructs the AI tutor on how to describe, wire, and annotate image assets", () => {
  const asset = getAssetById("electric-circuit")!;
  const page: BoardPage = createAssetPage(asset);

  const summary = describePage(page);
  expect(summary).toContain('Current board page "DC Electric Circuit"');
  expect(summary).toContain("diagram asset image");
  expect(summary).toContain("resistor");
  expect(summary).toContain("battery");
  expect(summary).toContain("left-pin");
  expect(summary).toContain("right-pin");
  expect(summary).toContain("Precision annotation tools");
});

test("guidedAnnotation marks and wires components on diagram assets accurately", () => {
  const asset = getAssetById("electric-circuit")!;
  const page = createAssetPage(asset);

  const circled = guidedAnnotation(page, "Circle the resistor");
  expect(circled).not.toBeNull();
  expect(circled?.explanation).toContain("Resistor (R)");

  const ellipseMark = circled?.page.marks.find(m => m.annotation);
  expect(ellipseMark).toBeDefined();
  expect(ellipseMark?.type).toBe("ellipse");

  const wired = guidedAnnotation(page, "Wire a connection line to the battery");
  expect(wired).not.toBeNull();
  expect(wired?.explanation).toContain("connected a wire to");
  const wirePath = wired?.page.marks.find(m => m.annotation && m.type === "path");
  expect(wirePath?.dashed).toBe(true);
});

test("getEffectiveRegions resolves regions even when an asset is dynamically placed into page.ink", () => {
  const blankPage: BoardPage = {
    id: "user-board",
    title: "Blank Board",
    marks: [],
    ink: [
      {
        type: "image",
        src: "/assets/inclined-plane.svg",
        alt: "Inclined plane",
        x: 515,
        y: 30,
        w: 430,
        h: 270,
      },
    ],
    cursor: { x: 0, y: 0 },
  };

  const regions = getEffectiveRegions(blankPage);
  expect(regions.length).toBeGreaterThan(0);
  expect(regions.some(r => r.id === "normal-force")).toBe(true);

  // Verifies the AI tutor can highlight and describe the dynamically placed image
  const highlighted = guidedAnnotation(blankPage, "Highlight normal force");
  expect(highlighted).not.toBeNull();
  expect(highlighted?.explanation).toContain("Normal Force (F_N)");
});
