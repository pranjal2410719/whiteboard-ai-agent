import type { CurriculumChapter, CurriculumSubject, CurriculumTopic, ClassroomContext, StudentLevel } from "./types";

export const curriculumSubjects: CurriculumSubject[] = [
  {
    id: "biology",
    name: "Biology & Life Sciences",
    icon: "HeartPulse",
    description: "Anatomical systems, cellular biology, and physiological mechanics.",
    color: "purple",
    chapters: [
      {
        id: "cardiovascular-system",
        title: "The Cardiovascular System",
        description: "Cardiac chambers, pulmonary and systemic circulation loops, and valve mechanics.",
        topics: [
          {
            id: "heart-blood-flow",
            title: "Human Heart & Blood Flow",
            description: "Trace deoxygenated and oxygenated blood through all four chambers, valves, and great vessels.",
            assetKey: "heart-diagram",
            learningObjectives: [
              "Understand the dual circulatory loops: pulmonary and systemic circuits.",
              "Trace blood pathway from vena cava through right atrium and ventricle to lungs.",
              "Trace oxygenated blood from pulmonary veins through left atrium and ventricle to the aorta.",
              "Identify the 4 cardiac valves and understand one-way pressure-gated flow.",
              "Explain the role of the interventricular septum in preventing blood mixing."
            ],
            mandatoryConcepts: [
              "Right Atrium",
              "Right Ventricle",
              "Pulmonary Artery",
              "Pulmonary Veins",
              "Left Atrium",
              "Left Ventricle",
              "Aorta",
              "Interventricular Septum",
              "Tricuspid & Bicuspid Valves",
              "Semilunar Valves"
            ],
            defaultLevel: "intermediate",
            keyLandmarks: [
              "superior-vena-cava",
              "inferior-vena-cava",
              "right-atrium",
              "tricuspid-valve",
              "right-ventricle",
              "pulmonary-valve",
              "pulmonary-artery",
              "pulmonary-veins",
              "left-atrium",
              "bicuspid-valve",
              "aortic-valve",
              "left-ventricle",
              "septum",
              "aorta"
            ],
            formulas: [
              "Cardiac Output (CO) = Heart Rate (HR) × Stroke Volume (SV)",
              "Blood Pressure = Systolic / Diastolic (mmHg)"
            ],
            misconceptions: [
              "Misconception: Deoxygenated blood is blue in the human body (it is actually dark red).",
              "Misconception: Heart valves open actively using muscles; they open and close passively due to blood pressure differentials."
            ],
            suggestedPrompts: [
              "Where does deoxygenated blood first enter the heart?",
              "Why is the wall of the left ventricle thicker than the right ventricle?",
              "What happens if the bicuspid valve fails to close properly?"
            ]
          }
        ]
      },
      {
        id: "cellular-biology",
        title: "Cellular Biology & Organelles",
        description: "Eukaryotic animal cell architecture, energy production, and the protein synthesis pipeline.",
        topics: [
          {
            id: "animal-cell-organelles",
            title: "The Animal Cell & Organelles",
            description: "Explore the internal architecture of animal cells: membrane, nucleus, mitochondria, ER, and Golgi.",
            assetKey: "cell-diagram",
            learningObjectives: [
              "Identify the boundary role of the selectively permeable lipid bilayer cell membrane.",
              "Understand the nucleus as the genomic repository housing DNA and commanding cellular synthesis.",
              "Explain oxidative phosphorylation and cellular respiration producing ATP in mitochondria.",
              "Follow the protein synthesis pipeline from ribosome-studded Rough ER to Golgi packaging.",
              "Describe the cytoplasmic fluid suspension and intracellular transport."
            ],
            mandatoryConcepts: [
              "Cell Membrane (Lipid Bilayer)",
              "Nucleus & Genetic Material",
              "Mitochondria (ATP Powerhouse)",
              "Rough Endoplasmic Reticulum",
              "Golgi Body / Apparatus",
              "Cytoplasm / Cytosol"
            ],
            defaultLevel: "intermediate",
            keyLandmarks: [
              "membrane",
              "nucleus",
              "mitochondria",
              "rough-er",
              "golgi",
              "cytoplasm"
            ],
            formulas: [
              "Cellular Respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 36-38 ATP"
            ],
            misconceptions: [
              "Misconception: Mitochondria produce energy from nothing; they convert chemical bonds of glucose and oxygen into ATP.",
              "Misconception: Animal cells possess rigid cell walls (only plant and fungal cells have cell walls)."
            ],
            suggestedPrompts: [
              "What is the function of the rough endoplasmic reticulum?",
              "How does the Golgi body package and address synthesized proteins?",
              "What controls which substances pass through the cell membrane?"
            ]
          },
          {
            id: "mitochondria-cellular-respiration",
            title: "Mitochondria & Cellular Respiration",
            description: "Explore the double membrane architecture, folded cristae, matrix, and ATP synthase machinery.",
            assetKey: "mitochondria",
            learningObjectives: [
              "Understand the double membrane envelope: outer smooth membrane and inner selective membrane.",
              "Explain how deep cristae folds dramatically expand the surface area for ATP synthase.",
              "Describe the citric acid (Krebs) cycle occurring within the mitochondrial matrix.",
              "Detail rotary F0F1-ATPase mechanics driven by the chemiosmotic proton gradient.",
              "Recognize maternal inheritance of circular mitochondrial DNA (mtDNA)."
            ],
            mandatoryConcepts: [
              "Outer Membrane (Porin Channels)",
              "Inner Membrane & Cardiolipin",
              "Folded Cristae (Surface Area)",
              "Mitochondrial Matrix & Enzymes",
              "F0F1-ATPase (ATP Synthase)",
              "Circular Mitochondrial DNA"
            ],
            defaultLevel: "intermediate",
            keyLandmarks: [
              "outer-membrane",
              "inner-membrane",
              "cristae",
              "matrix",
              "intermembrane-space",
              "dna",
              "ribosomes",
              "atp-synthase"
            ],
            formulas: [
              "Cellular Respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP",
              "ATP Synthesis: ADP + Pᵢ + H⁺_gradient → ATP"
            ],
            misconceptions: [
              "Misconception: Mitochondria create energy from nowhere; they convert biochemical glucose bond energy into ATP.",
              "Misconception: Cristae are random wrinkles; they are precisely organized folds maximizing ATP output."
            ],
            suggestedPrompts: [
              "Why are mitochondria called the powerhouse of the cell?",
              "How do folded cristae increase ATP production?",
              "What is the role of the F0F1-ATPase rotary motor?"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "physics",
    name: "Physics & Mechanics",
    icon: "Atom",
    description: "Forces, vector mechanics, thermodynamics, and electrical circuits.",
    color: "blue",
    chapters: [
      {
        id: "dc-electricity",
        title: "Direct Current (DC) Circuits",
        description: "Potential difference, electromotive force, Ohm's law, and current resistance loops.",
        topics: [
          {
            id: "dc-circuits-ohms-law",
            title: "DC Electric Circuit & Ohm's Law",
            description: "Trace closed-loop conventional current from battery source through switches and resistive loads.",
            assetKey: "circuit-diagram",
            learningObjectives: [
              "Understand electromotive force (EMF) creating potential difference across terminals.",
              "Trace continuous closed-loop current flow from high potential to low potential.",
              "Apply Ohm's law (V = I · R) to calculate potential drops across resistors.",
              "Explain how a switch controls circuit continuity and open-circuit states.",
              "Understand energy conversion from electrical energy into heat and light in loads."
            ],
            mandatoryConcepts: [
              "Battery (DC Voltage Source)",
              "Ohmic Resistor",
              "Control Switch",
              "Lamp / Resistive Load",
              "Conventional Current Flow"
            ],
            defaultLevel: "intermediate",
            keyLandmarks: [
              "battery",
              "resistor",
              "switch",
              "lamp",
              "current"
            ],
            formulas: [
              "Ohm's Law: V = I · R",
              "Electrical Power: P = V · I = I² · R = V² / R",
              "Resistance in Series: R_total = R₁ + R₂ + ..."
            ],
            misconceptions: [
              "Misconception: Current is consumed or 'used up' by resistors; current is conserved, but electrical potential is dissipated.",
              "Misconception: Electrons flow at the speed of light; electron drift velocity is very slow (~mm/s), though the electric field propagates near light speed."
            ],
            suggestedPrompts: [
              "What happens to the current in the circuit when the switch is opened?",
              "If the battery voltage is doubled while resistance stays constant, what happens to the current?",
              "Where is electrical energy converted into thermal or radiant energy?"
            ]
          }
        ]
      },
      {
        id: "classical-mechanics",
        title: "Classical Mechanics & Vectors",
        description: "Newton's laws of motion, normal forces, gravitational vectors, and inclined planes.",
        topics: [
          {
            id: "inclined-plane-mechanics",
            title: "Inclined Plane Mechanics & Friction",
            description: "Decompose gravitational weight into perpendicular and parallel vectors on an inclined ramp.",
            assetKey: "inclined-diagram",
            learningObjectives: [
              "Resolve vertical gravitational weight (mg) into perpendicular (mg cos θ) and parallel (mg sin θ) components.",
              "Understand the contact normal force (F_N) balancing the perpendicular force component.",
              "Calculate static and kinetic friction forces opposing motion along the ramp.",
              "Determine the critical angle of repose and the required pulling force for constant velocity."
            ],
            mandatoryConcepts: [
              "Mass Block (m)",
              "Gravitational Weight Vector (mg)",
              "Normal Force (F_N)",
              "Kinetic / Static Friction (f_k, f_s)",
              "Applied Pull Force (F_pull)",
              "Incline Angle (θ)"
            ],
            defaultLevel: "intermediate",
            keyLandmarks: [
              "block",
              "gravity",
              "normal-force",
              "friction",
              "pull-force",
              "incline-angle"
            ],
            formulas: [
              "Gravitational Weight: F_g = m · g",
              "Perpendicular Force: F_perp = m · g · cos(θ)",
              "Parallel Force: F_parallel = m · g · sin(θ)",
              "Normal Force: F_N = m · g · cos(θ)",
              "Friction Force: f_k = μ_k · F_N = μ_k · m · g · cos(θ)",
              "Net Force along Incline: F_net = F_pull - m · g · sin(θ) - f_k"
            ],
            misconceptions: [
              "Misconception: Normal force always equals m·g; on an incline, normal force equals m·g·cos(θ).",
              "Misconception: Friction always opposes motion direction; friction opposes the direction of relative surface slipping."
            ],
            suggestedPrompts: [
              "Why is the normal force smaller on a steeper incline?",
              "What is the minimum force required to keep the mass block from sliding down?",
              "How does increasing the friction coefficient μ affect the equilibrium?"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "earth-science",
    name: "Earth & Environmental Sciences",
    icon: "Globe2",
    description: "Meteorological cycles, thermodynamics of water, and planetary systems.",
    color: "blue",
    chapters: [
      {
        id: "hydrology",
        title: "Hydrology & Meteorology",
        description: "The continuous movement of water on, above, and below the surface of the Earth.",
        topics: [
          {
            id: "water-cycle-stages",
            title: "The Hydrological (Water) Cycle",
            description: "Follow water molecules through solar evaporation, atmospheric condensation, precipitation, and collection.",
            assetKey: "water-diagram",
            learningObjectives: [
              "Understand solar radiation as the fundamental thermal engine driving the hydrological cycle.",
              "Describe phase transition from liquid water to atmospheric vapor during evaporation.",
              "Explain cloud formation through cooling and condensation around condensation nuclei.",
              "Identify forms of precipitation (rain, snow, sleet, hail) and gravity-driven return.",
              "Recognize terrestrial collection, surface runoff, groundwater infiltration, and ocean storage."
            ],
            mandatoryConcepts: [
              "Solar Energy Driver",
              "Evaporation (Phase Change)",
              "Condensation (Cloud Formation)",
              "Precipitation (Gravity Return)",
              "Collection & Groundwater Storage"
            ],
            defaultLevel: "beginner",
            keyLandmarks: [
              "sun",
              "evaporation",
              "condensation",
              "precipitation",
              "collection"
            ],
            formulas: [
              "Latent Heat of Vaporization for Water: L_v ≈ 2.26 × 10⁶ J/kg",
              "Water Balance Equation: P = Q + E + ΔS (Precipitation = Runoff + Evaporation + Storage change)"
            ],
            misconceptions: [
              "Misconception: Clouds are made of water vapor gas (water vapor is invisible; clouds are liquid droplets or ice crystals).",
              "Misconception: Water in the cycle is destroyed or created anew (the total amount of water on Earth remains constant)."
            ],
            suggestedPrompts: [
              "What provides the energy to evaporate water from oceans and lakes?",
              "What causes water vapor to condense into visible clouds?",
              "What role does gravity play in the water cycle?"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "mathematics",
    name: "Mathematics & Geometry",
    icon: "Binary",
    description: "Geometric relationships, algebraic balances, and trigonometric foundations.",
    color: "green",
    chapters: [
      {
        id: "geometry-trig",
        title: "Geometry & Trigonometry",
        description: "Right-angled triangles, Pythagorean relationships, and trigonometric ratios.",
        topics: [
          {
            id: "pythagorean-theorem",
            title: "The Pythagorean Theorem",
            description: "Explore the relationship between the legs and hypotenuse of right-angled triangles.",
            assetKey: "pythagoras",
            learningObjectives: [
              "State and geometrically prove the Pythagorean theorem: a² + b² = c².",
              "Identify the hypotenuse as the side opposite the 90° right angle.",
              "Calculate unknown side lengths in real-world geometric problems.",
              "Introduce basic trigonometric ratios: sine, cosine, and tangent."
            ],
            mandatoryConcepts: [
              "Right Angle (90°)",
              "Legs (a and b)",
              "Hypotenuse (c)",
              "Trigonometric Ratios (sin, cos, tan)"
            ],
            defaultLevel: "beginner",
            keyLandmarks: [],
            formulas: [
              "Pythagorean Theorem: a² + b² = c²",
              "c = √(a² + b²)",
              "sin(θ) = Opposite / Hypotenuse",
              "cos(θ) = Adjacent / Hypotenuse",
              "tan(θ) = Opposite / Adjacent"
            ],
            misconceptions: [
              "Misconception: The Pythagorean theorem applies to all triangles (it only holds for right-angled triangles in Euclidean space).",
              "Misconception: Any side can be 'c' (c MUST be the hypotenuse opposite the right angle)."
            ],
            suggestedPrompts: [
              "Which side is always the longest in a right-angled triangle?",
              "If the two legs are 3 and 4 units, what is the length of the hypotenuse?",
              "How does the Pythagorean theorem connect to the trigonometric identity sin²θ + cos²θ = 1?"
            ]
          }
        ]
      }
    ]
  }
];

export class CurriculumTaxonomy {
  static getSubjects(): CurriculumSubject[] {
    return curriculumSubjects;
  }

  static getSubject(subjectId: string): CurriculumSubject | undefined {
    return curriculumSubjects.find(s => s.id === subjectId.toLowerCase());
  }

  static findTopic(topicIdOrKey: string): { subject: CurriculumSubject; chapter: CurriculumChapter; topic: CurriculumTopic } | undefined {
    const norm = topicIdOrKey.toLowerCase().trim();
    for (const subject of curriculumSubjects) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          if (
            topic.id.toLowerCase() === norm ||
            topic.assetKey?.toLowerCase() === norm ||
            topic.title.toLowerCase() === norm ||
            topic.title.toLowerCase().includes(norm) ||
            norm.includes(topic.title.toLowerCase())
          ) {
            return { subject, chapter, topic };
          }
        }
      }
    }
    return undefined;
  }

  static search(query: string): Array<{ subject: CurriculumSubject; chapter: CurriculumChapter; topic: CurriculumTopic }> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: Array<{ subject: CurriculumSubject; chapter: CurriculumChapter; topic: CurriculumTopic }> = [];

    for (const subject of curriculumSubjects) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          const match =
            topic.title.toLowerCase().includes(q) ||
            topic.description.toLowerCase().includes(q) ||
            subject.name.toLowerCase().includes(q) ||
            chapter.title.toLowerCase().includes(q) ||
            topic.mandatoryConcepts.some(c => c.toLowerCase().includes(q)) ||
            topic.learningObjectives.some(o => o.toLowerCase().includes(q));

          if (match) {
            results.push({ subject, chapter, topic });
          }
        }
      }
    }
    return results;
  }
}
