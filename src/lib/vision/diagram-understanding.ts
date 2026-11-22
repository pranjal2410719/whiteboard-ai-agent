import type { VisualObject, VisualScene } from "./types";

export type DiagramDomain =
  | "biology_cardiovascular"
  | "biology_cellular"
  | "physics_circuit"
  | "mathematics_geometry"
  | "flowchart_process"
  | "general_diagram";

const DOMAIN_KEYWORDS: Record<DiagramDomain, string[]> = {
  biology_cardiovascular: ["aorta", "atrium", "ventricle", "valve", "pulmonary", "vena cava", "heart", "artery", "vein"],
  biology_cellular: ["nucleus", "mitochondria", "membrane", "cytoplasm", "ribosome", "golgi", "endoplasmic", "cell"],
  physics_circuit: ["resistor", "battery", "switch", "current", "voltage", "ammeter", "voltmeter", "circuit", "bulb"],
  mathematics_geometry: ["hypotenuse", "triangle", "angle", "pythagoras", "perimeter", "radius", "diameter", "polygon"],
  flowchart_process: ["start", "end", "decision", "step", "process", "input", "output"],
  general_diagram: [],
};

/**
 * Classifies the educational domain of a visual scene based on detected objects and OCR labels.
 */
export function classifyDiagramDomain(scene: VisualScene): DiagramDomain {
  const allLabels = [
    ...scene.objects.map((o) => o.label.toLowerCase()),
    ...scene.objects.flatMap((o) => o.aliases || []).map((a) => a.toLowerCase()),
    ...scene.textRegions.map((t) => t.text.toLowerCase()),
  ];

  let bestDomain: DiagramDomain = "general_diagram";
  let maxMatches = 0;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [DiagramDomain, string[]][]) {
    let matches = 0;
    for (const kw of keywords) {
      if (allLabels.some((l) => l.includes(kw))) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestDomain = domain;
    }
  }

  return bestDomain;
}

/**
 * Derives teaching flow hints based on domain and visual object relationships.
 */
export function getDomainTeachingHints(
  domain: DiagramDomain,
  scene: VisualScene
): { recommendedStartComponent?: string; flowDescription?: string } {
  switch (domain) {
    case "biology_cardiovascular": {
      const hasAorta = scene.objects.some((o) => o.label.toLowerCase().includes("aorta"));
      return {
        recommendedStartComponent: hasAorta ? "aorta" : "right_atrium",
        flowDescription: "Deoxygenated blood enters right atrium -> right ventricle -> lungs -> left atrium -> left ventricle -> aorta to systemic circulation.",
      };
    }
    case "biology_cellular": {
      return {
        recommendedStartComponent: "nucleus",
        flowDescription: "The nucleus houses genetic information; mitochondria generate ATP power.",
      };
    }
    case "physics_circuit": {
      return {
        recommendedStartComponent: "battery",
        flowDescription: "Conventional current leaves the positive terminal, flows through the switch and resistors, and returns to the negative terminal.",
      };
    }
    case "mathematics_geometry": {
      return {
        recommendedStartComponent: "hypotenuse",
        flowDescription: "In a right triangle: a² + b² = c².",
      };
    }
    default:
      return {};
  }
}
