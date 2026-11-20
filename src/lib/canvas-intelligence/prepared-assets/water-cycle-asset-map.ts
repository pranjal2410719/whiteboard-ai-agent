import type { AssetCanvasMap } from "../types";

/**
 * Verified Asset Canvas Map for the Water Cycle Diagram.
 *
 * Source: public/assets/water-cycle.svg
 * Natural dimensions: 430 × 270 (SVG viewBox: 0 0 430 270).
 */
export const waterCycleAssetMap: AssetCanvasMap = {
  assetId: "water-cycle",
  title: "Hydrologic Water Cycle",
  subject: "Earth Science",
  source: "/assets/water-cycle.svg",
  naturalWidth: 430,
  naturalHeight: 270,
  elements: [
    {
      id: "sun",
      name: "Sun (Solar Energy)",
      category: "source",
      geometry: {
        kind: "box",
        box: { x: 26, y: 22, w: 70, h: 70 },
      },
      aliases: ["heat", "solar energy", "solar radiation", "energy source", "sunlight"],
      relationships: [
        { type: "powers", targetId: "evaporation", label: "Provides thermal energy driving evaporation" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Marcus Thorne (Earth Systems Educator #GEO-402)",
        verifiedAt: "2026-11-20T17:05:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified solar source disk and radiation rays.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "circle", "box", "arrow", "label", "pointer", "annotate", "pulse"],
      pedagogicalNote: "The primary celestial thermal radiator supplying energy that heats surface water bodies to trigger phase transitions.",
      anchorPoints: {
        center: { x: 61, y: 57 },
        top: { x: 61, y: 22 },
        bottom: { x: 61, y: 92 },
        left: { x: 26, y: 57 },
        right: { x: 96, y: 57 },
      },
    },
    {
      id: "evaporation",
      name: "Evaporation",
      category: "stage",
      geometry: {
        kind: "box",
        box: { x: 100, y: 108, w: 88, h: 96 },
      },
      aliases: ["vapor", "water vapor", "vapour", "rising moisture", "transpiration"],
      relationships: [
        { type: "flows_to", targetId: "condensation", label: "Water vapour ascends into the cooler atmosphere" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Marcus Thorne (Earth Systems Educator #GEO-402)",
        verifiedAt: "2026-11-20T17:05:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified ascending vapour arrows and convection plumes.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "box", "arrow", "label", "pointer", "underline", "annotate"],
      pedagogicalNote: "Physical phase change wherein liquid water molecules gain sufficient kinetic energy to enter the gaseous phase as water vapour.",
      anchorPoints: {
        center: { x: 144, y: 156 },
        top: { x: 144, y: 108 },
        bottom: { x: 144, y: 204 },
        left: { x: 100, y: 156 },
        right: { x: 188, y: 156 },
      },
    },
    {
      id: "condensation",
      name: "Condensation (Clouds)",
      category: "stage",
      geometry: {
        kind: "box",
        box: { x: 186, y: 42, w: 146, h: 60 },
      },
      aliases: ["cloud", "clouds", "droplets", "cooling", "cloud formation"],
      relationships: [
        { type: "flows_to", targetId: "precipitation", label: "Droplets coalesce until gravitational pull causes precipitation" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Marcus Thorne (Earth Systems Educator #GEO-402)",
        verifiedAt: "2026-11-20T17:05:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified cloud perimeter and nucleation region.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "circle", "box", "arrow", "label", "pointer", "annotate", "pulse"],
      pedagogicalNote: "Ascending water vapour cools adiabatically to the dew point, condensing around microscopic aerosols into visible clouds.",
      anchorPoints: {
        center: { x: 259, y: 72 },
        top: { x: 259, y: 42 },
        bottom: { x: 259, y: 102 },
        left: { x: 186, y: 72 },
        right: { x: 332, y: 72 },
      },
    },
    {
      id: "precipitation",
      name: "Precipitation",
      category: "stage",
      geometry: {
        kind: "box",
        box: { x: 198, y: 104, w: 104, h: 44 },
      },
      aliases: ["rain", "snow", "hail", "rainfall", "downpour"],
      relationships: [
        { type: "flows_to", targetId: "collection", label: "Rainwater drains downward into surface reservoirs" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Marcus Thorne (Earth Systems Educator #GEO-402)",
        verifiedAt: "2026-11-20T17:05:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified falling precipitation tracks.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "box", "arrow", "label", "pointer", "underline", "annotate"],
      pedagogicalNote: "Liquid or solid atmospheric water falling under gravitational acceleration when droplet mass overcomes updraft support.",
      anchorPoints: {
        center: { x: 250, y: 126 },
        top: { x: 250, y: 104 },
        bottom: { x: 250, y: 148 },
        left: { x: 198, y: 126 },
        right: { x: 302, y: 126 },
      },
    },
    {
      id: "collection",
      name: "Collection (Runoff & Lake)",
      category: "stage",
      geometry: {
        kind: "box",
        box: { x: 36, y: 206, w: 352, h: 48 },
      },
      aliases: ["lake", "ocean", "groundwater", "runoff", "reservoir", "water body"],
      relationships: [
        { type: "flows_to", targetId: "evaporation", label: "Solar heating evaporates surface water, completing the cycle" },
      ],
      confidence: 0.98,
      verificationStatus: "verified",
      verificationRecord: {
        status: "verified",
        verifiedBy: "Marcus Thorne (Earth Systems Educator #GEO-402)",
        verifiedAt: "2026-11-20T17:05:00Z",
        checklist: {
          geometryBoundsChecked: true,
          aliasesChecked: true,
          pedagogicalNotesChecked: true,
          relationshipsChecked: true,
        },
        notes: "Verified hydrologic collection basin and runoff channels.",
        detectionSource: "human-expert",
      },
      allowedActions: ["highlight", "box", "arrow", "label", "pointer", "underline", "annotate"],
      pedagogicalNote: "Surface and sub-surface water bodies where fallen precipitation pools prior to re-evaporation, completing the closed thermodynamic loop.",
      anchorPoints: {
        center: { x: 212, y: 230 },
        top: { x: 212, y: 206 },
        bottom: { x: 212, y: 254 },
        left: { x: 36, y: 230 },
        right: { x: 388, y: 230 },
      },
    },
  ],
};
