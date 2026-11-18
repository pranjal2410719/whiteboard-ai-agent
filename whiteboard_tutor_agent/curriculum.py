"""
Curriculum Engine for Whiteboard Tutor Agent
============================================
Contains structured course definitions, lesson steps, whiteboard layouts,
and pedagogical question-answer evaluations.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class LessonStep:
    """A single interactive teaching step in a lesson."""
    step_number: int
    title: str
    narration: str
    whiteboard_elements: List[Dict[str, Any]]
    checkpoint_question: str
    expected_keywords: List[str]
    explanation_on_correct: str
    remedial_hint: str


@dataclass
class LessonTopic:
    """A complete topic composed of sequential steps."""
    id: str
    title: str
    grade_level: str
    description: str
    steps: List[LessonStep] = field(default_factory=list)


class Curriculum:
    """Curriculum registry providing structured learning tracks."""

    def __init__(self):
        self._topics: Dict[str, LessonTopic] = {}
        self._aliases: Dict[str, str] = {}
        self._load_builtins()

    def register_topic(self, topic: LessonTopic, aliases: Optional[List[str]] = None) -> None:
        """Register a new topic into the curriculum."""
        self._topics[topic.id] = topic
        if aliases:
            for a in aliases:
                self._aliases[a.lower()] = topic.id

    def get_topic(self, topic_id: str) -> Optional[LessonTopic]:
        """Retrieve topic by ID or fuzzy title match."""
        tid = topic_id.strip().lower()
        if tid in self._topics:
            return self._topics[tid]
        if tid in self._aliases:
            return self._topics[self._aliases[tid]]
        # Fuzzy search
        norm = tid.replace(" ", "_")
        for k, t in self._topics.items():
            if norm in k.lower() or norm in t.title.lower().replace(" ", "_"):
                return t
        for a, target_id in self._aliases.items():
            if norm in a:
                return self._topics[target_id]
        return None

    def list_topics(self) -> List[Dict[str, str]]:
        """List all available topics."""
        return [
            {
                "id": t.id,
                "title": t.title,
                "grade_level": t.grade_level,
                "step_count": len(t.steps),
                "description": t.description,
            }
            for t in self._topics.values()
        ]

    def _load_builtins(self) -> None:
        """Load default curriculum tracks."""

        # ---------------------------------------------------------------------
        # Topic 1: Class 10 Physics - Friction
        # ---------------------------------------------------------------------
        friction = LessonTopic(
            id="friction",
            title="Class 10 Physics: The Science of Friction",
            grade_level="Class 10",
            description="Microscopic causes of friction, Free Body Diagrams, Static vs. Kinetic friction, and Laws of Friction.",
        )

        # Step 1: Microscopic Origin
        step1_elements = [
            {
                "id": "banner_s1",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "STEP 1: THE MICROSCOPIC ORIGIN OF FRICTION",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 18,
            },
            {
                "id": "macro_block",
                "type": "rectangle",
                "x": 120,
                "y": 140,
                "width": 460,
                "height": 180,
                "text": "MACRO VIEW (Appears Smooth)\n\n• Smooth Block moving over polished table\n• External pull force F applied forward\n• Friction f opposes motion at the interface",
                "backgroundColor": "#f8f9fa",
                "strokeColor": "#ced4da",
                "fontSize": 13,
            },
            {
                "id": "micro_block",
                "type": "rectangle",
                "x": 640,
                "y": 140,
                "width": 520,
                "height": 180,
                "text": "MICRO VIEW (1000x Microscope)\n\n• Both surfaces have microscopic peaks (asperities) & valleys\n• Mechanical Interlocking: Peaks lock like gear teeth\n• Molecular Adhesion (Cold Welding): Extreme pressure at peak tips bonds atoms together!",
                "backgroundColor": "#fff9db",
                "strokeColor": "#f59f00",
                "fontSize": 13,
            },
            {
                "id": "summary_s1",
                "type": "rectangle",
                "x": 200,
                "y": 360,
                "width": 840,
                "height": 120,
                "text": "BOARD EXAM DEFINITION:\nFriction is a contact force that acts parallel to the surfaces in contact and opposes the relative motion (or impending relative motion) between two bodies. SI Unit: Newton (N).",
                "backgroundColor": "#d3f9d8",
                "strokeColor": "#2b8a3e",
                "fontSize": 14,
            },
        ]

        friction.steps.append(
            LessonStep(
                step_number=1,
                title="What is Friction and Why Does It Exist?",
                narration=(
                    "Welcome to our study of Friction! Look at the canvas at http://127.0.0.1:3000.\n"
                    "Even if two surfaces appear mirror-smooth to your naked eyes, under a microscope they "
                    "resemble jagged mountain ranges with peaks (asperities) and valleys. Friction arises from two "
                    "mechanisms: 1) Mechanical interlocking of these peaks, and 2) Cold welding, where immense pressure "
                    "at microscopic contact tips causes atoms to bond together."
                ),
                whiteboard_elements=step1_elements,
                checkpoint_question="Why does a drop of water placed between two smooth glass slides make them stick together and become hard to slide?",
                expected_keywords=["water", "molecular", "contact", "adhesion", "interlocking", "surface tension", "attraction", "area"],
                explanation_on_correct=(
                    "Spot on! The thin water film fills the microscopic valleys, creating widespread molecular adhesion "
                    "and surface tension forces across a vastly increased real contact area, locking the two plates together!"
                ),
                remedial_hint=(
                    "Hint: Think about what the water does to the empty microscopic valleys between the two glass plates and "
                    "how molecular attraction (adhesion) changes."
                ),
            )
        )

        # Step 2: The 4 Forces & FBD
        step2_elements = [
            {
                "id": "banner_s2",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "STEP 2: FREE BODY DIAGRAM (THE 4 FORCES)",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 18,
            },
            {
                "id": "fbd_box",
                "type": "rectangle",
                "x": 380,
                "y": 180,
                "width": 180,
                "height": 100,
                "text": "Block (Mass m)\nWeight W = mg",
                "backgroundColor": "#a5d8ff",
                "strokeColor": "#1971c2",
                "fontSize": 14,
            },
            # Normal Force Up
            {"id": "arr_n", "type": "arrow", "x": 470, "y": 180, "points": [[0, 0], [0, -65]], "strokeColor": "#2f9e44", "strokeWidth": 2.5, "endArrowhead": "arrow"},
            {"id": "lbl_n", "type": "rectangle", "x": 395, "y": 95, "width": 150, "height": 32, "text": "Normal Force N = mg", "backgroundColor": "#d3f9d8", "strokeColor": "#2f9e44"},
            # Weight Down
            {"id": "arr_w", "type": "arrow", "x": 470, "y": 280, "points": [[0, 0], [0, 65]], "strokeColor": "#e03131", "strokeWidth": 2.5, "endArrowhead": "arrow"},
            {"id": "lbl_w", "type": "rectangle", "x": 395, "y": 360, "width": 150, "height": 32, "text": "Weight W = mg", "backgroundColor": "#ffe3e3", "strokeColor": "#e03131"},
            # Applied Force Right
            {"id": "arr_f", "type": "arrow", "x": 560, "y": 230, "points": [[0, 0], [75, 0]], "strokeColor": "#1971c2", "strokeWidth": 2.5, "endArrowhead": "arrow"},
            {"id": "lbl_f", "type": "rectangle", "x": 650, "y": 215, "width": 140, "height": 32, "text": "Applied Force (F)", "backgroundColor": "#d0ebff", "strokeColor": "#1971c2"},
            # Friction Force Left
            {"id": "arr_fr", "type": "arrow", "x": 380, "y": 280, "points": [[0, 0], [-75, 0]], "strokeColor": "#d9480f", "strokeWidth": 2.5, "endArrowhead": "arrow"},
            {"id": "lbl_fr", "type": "rectangle", "x": 190, "y": 265, "width": 170, "height": 32, "text": "Friction f = μN (Opposing)", "backgroundColor": "#ffe8cc", "strokeColor": "#d9480f"},
            # Formula Box
            {
                "id": "fbd_summary",
                "type": "rectangle",
                "x": 200,
                "y": 440,
                "width": 840,
                "height": 130,
                "text": "EQUILIBRIUM & MOTION:\n• Vertical axis balances: N = W = mg (block doesn't sink or levitate)\n• If F <= Limiting Friction: Object stays at rest (Static Friction = F)\n• If F > Limiting Friction: Object accelerates! F_net = F - f_k = m·a",
                "backgroundColor": "#fff9db",
                "strokeColor": "#f59f00",
                "fontSize": 13,
            },
        ]

        friction.steps.append(
            LessonStep(
                step_number=2,
                title="The Free Body Diagram & The 4 Active Forces",
                narration=(
                    "Now let us examine the four forces acting on any resting or moving object on a flat surface.\n"
                    "1. Weight (W = mg) pulls down into the Earth.\n"
                    "2. The surface pushes straight up with Normal Force (N = mg).\n"
                    "3. Your Applied Force (F) pulls to the right.\n"
                    "4. Friction (f) pushes to the left, resisting the slide!"
                ),
                whiteboard_elements=step2_elements,
                checkpoint_question="If you press down on top of a book with your hand while trying to slide it, does friction increase, decrease, or stay the same? Why?",
                expected_keywords=["increase", "increases", "greater", "higher", "more", "normal force", "normal reaction"],
                explanation_on_correct=(
                    "Excellent! Pressing down adds your downward hand force to the block's weight, increasing the Normal Force N. "
                    "Since friction is directly proportional to N (f = μN), friction increases significantly!"
                ),
                remedial_hint=(
                    "Hint: Think about what pressing down does to the upward normal force N. Does it squeeze the microscopic peaks together harder?"
                ),
            )
        )

        # Step 3: Types of Friction & Graph
        step3_elements = [
            {
                "id": "banner_s3",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "STEP 3: TYPES OF FRICTION (STATIC VS. KINETIC VS. ROLLING)",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 18,
            },
            {
                "id": "card_static",
                "type": "rectangle",
                "x": 100,
                "y": 100,
                "width": 320,
                "height": 220,
                "text": "1. STATIC FRICTION (f_s)\n\n• Operates when the object is AT REST.\n• SELF-ADJUSTING: Exactly matches the applied force (0 <= f_s <= f_L).\n• Peak value is LIMITING FRICTION: f_L = μ_s · N.",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 13,
            },
            {
                "id": "card_kinetic",
                "type": "rectangle",
                "x": 460,
                "y": 100,
                "width": 320,
                "height": 220,
                "text": "2. KINETIC FRICTION (f_k)\n\n• Operates during ACTIVE SLIDING motion.\n• CONSTANT: f_k = μ_k · N.\n• Crucial fact: f_k < f_L (Kinetic is always less than Limiting friction because peaks skip over valleys).",
                "backgroundColor": "#fff3bf",
                "strokeColor": "#f59f00",
                "fontSize": 13,
            },
            {
                "id": "card_rolling",
                "type": "rectangle",
                "x": 820,
                "y": 100,
                "width": 320,
                "height": 220,
                "text": "3. ROLLING FRICTION (f_r)\n\n• Operates when wheels or spheres roll.\n• SMALLEST FRICTION: f_r << f_k.\n• Contact point lifts vertically rather than grinding horizontally.\n• Reason ball bearings save huge energy!",
                "backgroundColor": "#d3f9d8",
                "strokeColor": "#2b8a3e",
                "fontSize": 13,
            },
            {
                "id": "hierarchy_banner",
                "type": "rectangle",
                "x": 200,
                "y": 360,
                "width": 840,
                "height": 80,
                "text": "THE GOLDEN HIERARCHY:\nStatic (Limiting) Friction > Kinetic (Sliding) Friction >> Rolling Friction\n(f_L > f_k >> f_r)",
                "backgroundColor": "#ffe8cc",
                "strokeColor": "#d9480f",
                "fontSize": 16,
            },
        ]

        friction.steps.append(
            LessonStep(
                step_number=3,
                title="The 3 Stages of Friction & The Golden Hierarchy",
                narration=(
                    "Now let us examine the three phases of friction:\n"
                    "1. Static Friction: Self-adjusting! It equals your push until you hit the peak Limiting Friction.\n"
                    "2. Kinetic Friction: Once the block begins sliding, friction drops to a slightly lower constant level (f_k < f_L).\n"
                    "3. Rolling Friction: By replacing sliding with rolling (using wheels or ball bearings), friction drops dramatically!"
                ),
                whiteboard_elements=step3_elements,
                checkpoint_question="Why is it easier to keep a heavy sofa sliding across a room once it is already moving, compared to starting it from rest?",
                expected_keywords=["kinetic", "static", "limiting", "less", "peaks", "valleys", "interlock", "time", "broken", "f_k", "f_l"],
                explanation_on_correct=(
                    "Spot on! Once moving, kinetic friction takes over, which is smaller than limiting static friction (f_k < f_L). "
                    "The microscopic peaks don't have enough time to sink into the valleys or form strong cold welds!"
                ),
                remedial_hint=(
                    "Hint: Compare the values of static limiting friction (f_L) versus sliding kinetic friction (f_k). Which one is smaller?"
                ),
            )
        )

        self.register_topic(friction, aliases=["class10_physics_friction", "friction_class10"])

        # ---------------------------------------------------------------------
        # Topic 2: Class 10 Physics - Gravitation & Gravity
        # ---------------------------------------------------------------------
        gravity = LessonTopic(
            id="gravitation",
            title="Class 10 Physics: Gravitation and Gravity",
            grade_level="Class 10",
            description="Newton's Universal Law of Gravitation, the Inverse Square Law, acceleration due to gravity (g), and Mass vs Weight.",
        )

        step1_grav_elements = [
            {
                "id": "banner_g1",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "NEWTON'S UNIVERSAL LAW OF GRAVITATION",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 18,
            },
            {
                "id": "body_m1",
                "type": "ellipse",
                "x": 250,
                "y": 140,
                "width": 90,
                "height": 90,
                "text": "Mass m1",
                "backgroundColor": "#b2f2bb",
                "strokeColor": "#2f9e44",
            },
            {
                "id": "body_m2",
                "type": "ellipse",
                "x": 650,
                "y": 140,
                "width": 90,
                "height": 90,
                "text": "Mass m2",
                "backgroundColor": "#ffc9c9",
                "strokeColor": "#e03131",
            },
            # Attraction arrows
            {"id": "arr_f1", "type": "arrow", "x": 340, "y": 185, "points": [[0, 0], [60, 0]], "strokeColor": "#1971c2", "strokeWidth": 2.5, "endArrowhead": "arrow"},
            {"id": "arr_f2", "type": "arrow", "x": 650, "y": 185, "points": [[0, 0], [-60, 0]], "strokeColor": "#1971c2", "strokeWidth": 2.5, "endArrowhead": "arrow"},
            {
                "id": "grav_formula_box",
                "type": "rectangle",
                "x": 150,
                "y": 280,
                "width": 700,
                "height": 160,
                "text": "THE UNIVERSAL FORMULA:\n\nF = G · (m1 · m2) / r²\n\n• G = Universal Gravitational Constant = 6.674 × 10⁻¹¹ N·m²/kg²\n• Force is directly proportional to product of masses (F ∝ m1·m2)\n• Force is INVERSELY proportional to square of distance (F ∝ 1/r²)",
                "backgroundColor": "#ffffff",
                "strokeColor": "#1971c2",
                "fontSize": 14,
            },
        ]

        gravity.steps.append(
            LessonStep(
                step_number=1,
                title="Newton's Universal Law of Gravitation & Inverse Square Law",
                narration=(
                    "Welcome to Gravitation! Look at the canvas at http://127.0.0.1:3000.\n"
                    "Sir Isaac Newton realized that every single mass in the cosmos attracts every other mass. "
                    "The force is directly proportional to their masses and inversely proportional to the square of "
                    "the distance between their centers: F = G (m1 m2) / r²."
                ),
                whiteboard_elements=step1_grav_elements,
                checkpoint_question="If the distance between two planets is doubled, how many times does the gravitational force between them change?",
                expected_keywords=["one fourth", "1/4", "four times less", "quarter", "decreases by 4", "4"],
                explanation_on_correct=(
                    "Correct! Because gravity follows the Inverse-Square Law (F ∝ 1/r²), doubling the distance means "
                    "the force becomes 1 / (2²) = 1/4th of the original force!"
                ),
                remedial_hint=(
                    "Hint: Look at the denominator: r is squared! What happens to 1/r² when you substitute r = 2?"
                ),
            )
        )

        # Step 2: Acceleration Due to Gravity (g)
        step2_grav_elements = [
            {
                "id": "banner_g2",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "STEP 2: ACCELERATION DUE TO GRAVITY (g) VS UNIVERSAL CONSTANT (G)",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 18,
            },
            {
                "id": "card_big_g",
                "type": "rectangle",
                "x": 100,
                "y": 100,
                "width": 380,
                "height": 220,
                "text": "UNIVERSAL GRAVITATIONAL CONSTANT (G)\n\n• Value: 6.674 × 10⁻¹¹ N·m²/kg²\n• Scalar quantity\n• SAME everywhere across the Universe\n• Independent of medium, mass, or temperature",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 13,
            },
            {
                "id": "card_small_g",
                "type": "rectangle",
                "x": 520,
                "y": 100,
                "width": 380,
                "height": 220,
                "text": "ACCELERATION DUE TO GRAVITY (g)\n\n• Value on Earth: ~9.8 m/s² (average)\n• Vector quantity (directed towards planetary center)\n• CHANGES with location: higher at poles, lower at equator\n• g = G · M / R²",
                "backgroundColor": "#ebfbee",
                "strokeColor": "#2b8a3e",
                "fontSize": 13,
            },
            {
                "id": "formula_g_earth",
                "type": "rectangle",
                "x": 100,
                "y": 350,
                "width": 800,
                "height": 130,
                "text": "DERIVATION OF g ON EARTH:\n\nF = m · g = G · (M · m) / R²  ⟹  g = G · M / R²\n\n• Notice that object mass 'm' CANCELS OUT!\n• Therefore, all objects in free fall fall at the EXACT same rate, regardless of mass!",
                "backgroundColor": "#fff9db",
                "strokeColor": "#f59f00",
                "fontSize": 13,
            },
        ]

        gravity.steps.append(
            LessonStep(
                step_number=2,
                title="Universal Constant (G) vs Acceleration due to Gravity (g)",
                narration=(
                    "Next, let's distinguish 'G' and 'g'. G is universal, constant everywhere. "
                    "In contrast, small 'g' is the local acceleration an object experiences near a celestial body: g = GM / R². "
                    "Notice that the falling object's mass 'm' completely cancels out!"
                ),
                whiteboard_elements=step2_grav_elements,
                checkpoint_question="Why do a heavy bowling ball and a light tennis ball dropped in a vacuum hit the ground at the exact same moment?",
                expected_keywords=["cancel", "independent of mass", "same acceleration", "g is same", "mass cancels"],
                explanation_on_correct=(
                    "Spot on! In the equation g = GM/R², the object's mass 'm' cancels out. All bodies experience the identical acceleration (9.8 m/s² on Earth) irrespective of how heavy or light they are."
                ),
                remedial_hint=(
                    "Hint: Look at the derivation formula g = GM/R². Does the mass of the falling ball appear anywhere in the acceleration formula?"
                ),
            )
        )

        # Step 3: Mass vs Weight
        step3_grav_elements = [
            {
                "id": "banner_g3",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "STEP 3: MASS VS. WEIGHT",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 18,
            },
            {
                "id": "card_mass",
                "type": "rectangle",
                "x": 100,
                "y": 100,
                "width": 380,
                "height": 220,
                "text": "MASS (m)\n\n• Measure of inertia / quantity of matter\n• Measured in Kilograms (kg)\n• Scalar quantity\n• CONSTANT: A 60 kg person has 60 kg mass on Earth, the Moon, and deep space!",
                "backgroundColor": "#f3f0ff",
                "strokeColor": "#7950f2",
                "fontSize": 13,
            },
            {
                "id": "card_weight",
                "type": "rectangle",
                "x": 520,
                "y": 100,
                "width": 380,
                "height": 220,
                "text": "WEIGHT (W = mg)\n\n• Gravitational pull exerted on an object\n• Measured in NEWTONS (N)\n• Vector quantity (downwards)\n• VARIABLE: On the Moon where g_moon = g/6, the 60 kg person weighs only ~98 N (instead of 588 N on Earth)!",
                "backgroundColor": "#fff4e6",
                "strokeColor": "#fd7e14",
                "fontSize": 13,
            },
        ]

        gravity.steps.append(
            LessonStep(
                step_number=3,
                title="Mass vs Weight and Weightlessness",
                narration=(
                    "In our third step, remember that Mass and Weight are fundamentally different. "
                    "Mass is how much matter you are made of (in kg, constant everywhere). "
                    "Weight is a force: W = m · g (in Newtons, varies by planet)."
                ),
                whiteboard_elements=step3_grav_elements,
                checkpoint_question="If an astronaut has a mass of 60 kg on Earth, what is their mass on the Moon where gravity is 1/6th?",
                expected_keywords=["60", "60 kg", "same", "remains 60", "unchanged"],
                explanation_on_correct=(
                    "Excellent! Mass never changes because the amount of matter remains identical (60 kg). Only their weight decreases to 1/6th!"
                ),
                remedial_hint=(
                    "Hint: Be careful! Did the question ask for Mass or Weight? Recall that Mass is a constant scalar quantity."
                ),
            )
        )

        self.register_topic(gravity, aliases=["gravity", "class10_physics_gravity", "gravitation_class10"])
