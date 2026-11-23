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

    def get_or_create_topic(self, topic_id: str) -> LessonTopic:
        """Retrieve topic by ID/title or dynamically generate a structured 3-step visual lesson."""
        found = self.get_topic(topic_id)
        if found:
            return found

        clean_title = topic_id.strip().replace("_", " ").title()
        tid = topic_id.strip().lower().replace(" ", "_")

        # Dynamically build a structured 3-step visual whiteboard lesson
        topic = LessonTopic(
            id=tid,
            title=f"Lesson: {clean_title}",
            grade_level="Comprehensive",
            description=f"Interactive step-by-step visual lesson on {clean_title} with whiteboard annotations.",
        )

        # Step 1: Fundamentals
        step1_elems = [
            {
                "id": f"{tid}_banner_1",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": f"STEP 1: INTRODUCTION TO {clean_title.upper()}",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 16,
            },
            {
                "id": f"{tid}_overview",
                "type": "rectangle",
                "x": 100,
                "y": 100,
                "width": 480,
                "height": 220,
                "text": f"WHAT IS {clean_title.upper()}?\n\n• Fundamental scientific / mathematical concept\n• Core principles and observed phenomena\n• Real-world applications and importance in study",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 13,
            },
            {
                "id": f"{tid}_significance",
                "type": "rectangle",
                "x": 620,
                "y": 100,
                "width": 480,
                "height": 220,
                "text": f"KEY MECHANISMS & CAUSES\n\n• Primary driving factors and properties\n• How individual elements interact within the system\n• Foundational rules governing behavior",
                "backgroundColor": "#fff9db",
                "strokeColor": "#f59f00",
                "fontSize": 13,
            },
            {
                "id": f"{tid}_summary_1",
                "type": "rectangle",
                "x": 160,
                "y": 360,
                "width": 880,
                "height": 120,
                "text": f"CORE TAKEAWAY:\nUnderstanding {clean_title} allows us to model, predict, and apply these principles in natural and engineered systems.",
                "backgroundColor": "#d3f9d8",
                "strokeColor": "#2b8a3e",
                "fontSize": 14,
            },
        ]

        topic.steps.append(
            LessonStep(
                step_number=1,
                title=f"What is {clean_title}?",
                narration=f"Welcome to our lesson on {clean_title}! Let's understand the core definition, primary components, and why this topic is so essential.",
                whiteboard_elements=step1_elems,
                checkpoint_question=f"In your own words, what is the primary role or definition of {clean_title}?",
                expected_keywords=["concept", "fundamental", "system", "principle", "energy", "function", clean_title.lower()],
                explanation_on_correct=f"Great reasoning! You've captured the core principle of {clean_title}.",
                remedial_hint=f"Think about the primary definition shown on the left blue card on the whiteboard.",
            )
        )

        # Step 2: Detailed Mechanism
        step2_elems = [
            {
                "id": f"{tid}_banner_2",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": f"STEP 2: DEEP DIVE INTO {clean_title.upper()}",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 16,
            },
            {
                "id": f"{tid}_structure",
                "type": "rectangle",
                "x": 100,
                "y": 100,
                "width": 480,
                "height": 220,
                "text": f"ANATOMY & COMPONENTS\n\n• Sub-elements and structural hierarchy\n• Specific functions assigned to each part\n• How energy/information flows through the system",
                "backgroundColor": "#ebfbee",
                "strokeColor": "#2b8a3e",
                "fontSize": 13,
            },
            {
                "id": f"{tid}_formula_card",
                "type": "rectangle",
                "x": 620,
                "y": 100,
                "width": 480,
                "height": 220,
                "text": f"MATHEMATICAL / CHEMICAL FORMULA\n\nInput Factors ⟹ Intermediate Reactions ⟹ Output Work\n\n• Quantifiable relationships and conservation laws",
                "backgroundColor": "#ffe3e3",
                "strokeColor": "#c92a2a",
                "fontSize": 13,
            },
            {
                "id": f"{tid}_summary_2",
                "type": "rectangle",
                "x": 160,
                "y": 360,
                "width": 880,
                "height": 120,
                "text": f"KEY PRINCIPLE:\nEvery component of {clean_title} works synergistically to maximize performance and efficiency.",
                "backgroundColor": "#f3f0ff",
                "strokeColor": "#7950f2",
                "fontSize": 14,
            },
        ]

        topic.steps.append(
            LessonStep(
                step_number=2,
                title=f"Detailed Mechanics of {clean_title}",
                narration=f"Now let's examine the inner working architecture of {clean_title}. Notice how the individual parts coordinate to produce the observed result.",
                whiteboard_elements=step2_elems,
                checkpoint_question=f"Why is the internal structure of {clean_title} organized in this specific way?",
                expected_keywords=["structure", "function", "efficiency", "increase", "maximize", "surface", "work", "balance"],
                explanation_on_correct=f"Spot on! Structure directly dictates function, maximizing efficiency.",
                remedial_hint=f"Think about how the structure shown on the whiteboard optimizes its function.",
            )
        )

        # Step 3: Synthesis & Real-World Application
        step3_elems = [
            {
                "id": f"{tid}_banner_3",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": f"STEP 3: APPLICATIONS & EXAM SUMMARY",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 16,
            },
            {
                "id": f"{tid}_applications",
                "type": "rectangle",
                "x": 100,
                "y": 100,
                "width": 480,
                "height": 240,
                "text": f"REAL-WORLD APPLICATIONS\n\n• Biological systems & ecological significance\n• Industrial, medical, and technological uses\n• Why scientists and engineers rely on this principle",
                "backgroundColor": "#fff9db",
                "strokeColor": "#f59f00",
                "fontSize": 13,
            },
            {
                "id": f"{tid}_exam_recap",
                "type": "rectangle",
                "x": 620,
                "y": 100,
                "width": 480,
                "height": 240,
                "text": f"EXAM REVISION CHECKLIST:\n\n1. Definition and essential characteristics\n2. Key structural components and formulas\n3. Primary governing laws and exceptions\n4. Real-world importance and applications",
                "backgroundColor": "#d3f9d8",
                "strokeColor": "#2b8a3e",
                "fontSize": 13,
            },
        ]

        topic.steps.append(
            LessonStep(
                step_number=3,
                title=f"Applications & Summary of {clean_title}",
                narration=f"In our final step, let's connect {clean_title} to real-world applications and review the exam essentials!",
                whiteboard_elements=step3_elems,
                checkpoint_question=f"What is one major application or consequence of {clean_title} in daily life or science?",
                expected_keywords=["life", "energy", "application", "biology", "science", "use", "important", "system"],
                explanation_on_correct=f"Outstanding! You've mastered the concepts and applications of {clean_title}.",
                remedial_hint=f"Look at the Real-World Applications card on the left side of the whiteboard.",
            )
        )

        self.register_topic(topic, aliases=[tid, clean_title.lower()])
        return topic

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

        # ---------------------------------------------------------------------
        # Topic 3: Class 7 Biology - Mitochondria (The Powerhouse of the Cell)
        # ---------------------------------------------------------------------
        mitochondria = LessonTopic(
            id="mitochondria",
            title="Class 7 Biology: The Mitochondria (Powerhouse of the Cell)",
            grade_level="Class 7",
            description="Discovery, double membrane structure, folded cristae surface area, matrix, cellular respiration, and ATP energy currency.",
        )

        # Step 1: Introduction to Mitochondria
        step1_mito_elements = [
            {
                "id": "banner_m1",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "STEP 1: MITOCHONDRIA - THE POWERHOUSE OF THE CELL (CLASS 7 BIOLOGY)",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 16,
            },
            {
                "id": "cell_overview",
                "type": "rectangle",
                "x": 100,
                "y": 100,
                "width": 480,
                "height": 220,
                "text": "WHAT IS MITOCHONDRIA?\n\n• Microscopic sausage-shaped or oval organelle inside plant & animal cells\n• Floats within the liquid cytoplasm of the cell\n• Discovered as vital energy-generating centers\n• Known universally as 'The Powerhouse of the Cell'!",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 13,
            },
            {
                "id": "why_powerhouse",
                "type": "rectangle",
                "x": 620,
                "y": 100,
                "width": 480,
                "height": 220,
                "text": "WHY 'POWERHOUSE'?\n\n• Just like an electrical power station supplies electricity to a city,\n• Mitochondria break down food nutrients (glucose) using oxygen,\n• Producing usable biochemical energy stored in ATP molecules!\n• Cells with high energy demand (muscle cells, liver) have thousands of them!",
                "backgroundColor": "#fff9db",
                "strokeColor": "#f59f00",
                "fontSize": 13,
            },
            {
                "id": "fact_box_m1",
                "type": "rectangle",
                "x": 160,
                "y": 360,
                "width": 880,
                "height": 120,
                "text": "KEY TAKEAWAY (CLASS 7 EXAM CONCEPT):\nEvery action you do — running, thinking, breathing — requires energy produced by millions of mitochondria inside your cells! Cellular respiration takes place inside this organelle.",
                "backgroundColor": "#d3f9d8",
                "strokeColor": "#2b8a3e",
                "fontSize": 14,
            },
        ]

        mitochondria.steps.append(
            LessonStep(
                step_number=1,
                title="What is Mitochondria? (The Cell's Powerhouse)",
                narration=(
                    "Welcome! Today we are exploring one of the most exciting organelles in Biology: Mitochondria! "
                    "Found inside almost every plant and animal cell, mitochondria are famously called the 'powerhouse of the cell' "
                    "because they generate the energy our cells need to stay alive and active."
                ),
                whiteboard_elements=step1_mito_elements,
                checkpoint_question="Why are mitochondria famously called the 'powerhouse of the cell'?",
                expected_keywords=["energy", "power", "produce energy", "generate energy", "atp", "respiration", "powerhouse"],
                explanation_on_correct=(
                    "Spot on! Mitochondria generate usable biochemical energy (ATP) by breaking down nutrients with oxygen, acting exactly like miniature power plants for your body!"
                ),
                remedial_hint=(
                    "Hint: Think about what a powerhouse or power station produces for a city. What essential resource do cells need to perform all their daily activities?"
                ),
            )
        )

        # Step 2: Double Membrane Structure & Folded Cristae
        step2_mito_elements = [
            {
                "id": "banner_m2",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "STEP 2: DOUBLE MEMBRANE ARCHITECTURE & THE FOLDED CRISTAE",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 16,
            },
            {
                "id": "outer_membrane_card",
                "type": "rectangle",
                "x": 60,
                "y": 100,
                "width": 320,
                "height": 170,
                "text": "1. OUTER MEMBRANE\n\n• Smooth, continuous outer skin\n• Porous: contains porin protein channels\n• Freely lets nutrient molecules pass into the organelle",
                "backgroundColor": "#f1f3f5",
                "strokeColor": "#495057",
                "fontSize": 13,
            },
            {
                "id": "inner_membrane_card",
                "type": "rectangle",
                "x": 60,
                "y": 300,
                "width": 320,
                "height": 190,
                "text": "2. INNER MEMBRANE & CRISTAE\n\n• Deeply folded into finger-like projections called CRISTAE\n• WHY FOLDED? Massively increases surface area!\n• Houses the ATP synthase enzymes that manufacture energy",
                "backgroundColor": "#ffe3e3",
                "strokeColor": "#c92a2a",
                "fontSize": 13,
            },
            {
                "id": "organelle_diagram",
                "type": "rectangle",
                "x": 420,
                "y": 100,
                "width": 440,
                "height": 390,
                "text": "MITOCHONDRION INTERNAL STRUCTURE\n\n[ Outer Membrane: Smooth & Protective ]\n         │\n         ▼\n[ Intermembrane Space ]\n         │\n         ▼\n[ Cristae: Deep Folds = Max Surface Area! ]\n         │\n         ▼\n[ Matrix: Fluid with Enzymes, Ribosomes & DNA ]",
                "backgroundColor": "#ebfbee",
                "strokeColor": "#2b8a3e",
                "fontSize": 13,
                "assetPath": "classes/human-cell/assets/Mitochondria.png",
                "src": "/assets/Mitochondria.png",
            },
            {
                "id": "matrix_card",
                "type": "rectangle",
                "x": 900,
                "y": 100,
                "width": 320,
                "height": 170,
                "text": "3. MATRIX (INNER FLUID)\n\n• Viscous jelly-like fluid interior\n• Contains enzymes for respiration\n• Has its own 70S ribosomes & circular DNA (can self-replicate!)",
                "backgroundColor": "#fff4e6",
                "strokeColor": "#d9480f",
                "fontSize": 13,
            },
            {
                "id": "surface_area_summary",
                "type": "rectangle",
                "x": 900,
                "y": 300,
                "width": 320,
                "height": 190,
                "text": "CRUCIAL CONCEPT: SURFACE AREA\n\n• Like folding a huge paper sheet into an accordion,\n• Cristae allow a huge reaction surface to pack inside a tiny microscopic space!\n• More folds = More ATP factories = More Energy!",
                "backgroundColor": "#f3f0ff",
                "strokeColor": "#7950f2",
                "fontSize": 13,
            },
        ]

        mitochondria.steps.append(
            LessonStep(
                step_number=2,
                title="Double Membrane Architecture & The Folded Cristae",
                narration=(
                    "Now let's examine the fascinating inner anatomy of the mitochondrion! "
                    "Unlike many other organelles, it has a DOUBLE membrane. The outer membrane is smooth and porous. "
                    "However, the inner membrane is deeply folded into finger-like wrinkles called Cristae. "
                    "These cristae dramatically increase the surface area available for chemical reactions!"
                ),
                whiteboard_elements=step2_mito_elements,
                checkpoint_question="Why is the inner membrane of mitochondria deeply folded into cristae instead of being smooth?",
                expected_keywords=["surface area", "surface", "increase surface", "more space", "more area", "area", "maximize"],
                explanation_on_correct=(
                    "Brilliant! The folding creates an enormous surface area inside a tiny space, allowing thousands of ATP-producing enzyme machines to work simultaneously!"
                ),
                remedial_hint=(
                    "Hint: Think of folding an accordion or a pleated fan. What does folding do to the usable contact area compared to a flat sheet?"
                ),
            )
        )

        # Step 3: Cellular Respiration & ATP
        step3_mito_elements = [
            {
                "id": "banner_m3",
                "type": "rectangle",
                "x": 280,
                "y": 20,
                "width": 740,
                "height": 48,
                "text": "STEP 3: CELLULAR RESPIRATION & ATP - THE ENERGY CURRENCY",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 16,
            },
            {
                "id": "respiration_equation",
                "type": "rectangle",
                "x": 100,
                "y": 100,
                "width": 900,
                "height": 140,
                "text": "THE CELLULAR RESPIRATION FORMULA:\n\nGlucose (C₆H₁₂O₆) + Oxygen (6O₂) ⟹ Carbon Dioxide (6CO₂) + Water (6H₂O) + ENERGY (ATP)\n\n• Food you eat + Oxygen you breathe are transformed into 36-38 ATP energy molecules!",
                "backgroundColor": "#fff9db",
                "strokeColor": "#f59f00",
                "fontSize": 14,
            },
            {
                "id": "atp_definition",
                "type": "rectangle",
                "x": 100,
                "y": 270,
                "width": 430,
                "height": 210,
                "text": "WHAT IS ATP?\n\n• Full Name: Adenosine Triphosphate\n• Known as: The 'Energy Currency' of the cell\n• Functions like a rechargeable battery: ATP ⇌ ADP + Phosphate + Energy\n• Powers muscle movement, nerve impulses, and chemical synthesis",
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 13,
            },
            {
                "id": "summary_recap",
                "type": "rectangle",
                "x": 570,
                "y": 270,
                "width": 430,
                "height": 210,
                "text": "CLASS 7 CHAPTER RECAP:\n\n1. Mitochondria = Powerhouse of the cell\n2. Double membrane: Smooth outer + Folded inner (Cristae)\n3. Matrix contains enzymes, ribosomes, and DNA\n4. Cristae maximize surface area for ATP synthesis\n5. Energy output = ATP (Adenosine Triphosphate)",
                "backgroundColor": "#d3f9d8",
                "strokeColor": "#2b8a3e",
                "fontSize": 13,
            },
        ]

        mitochondria.steps.append(
            LessonStep(
                step_number=3,
                title="Cellular Respiration & ATP: The Energy Currency",
                narration=(
                    "In our final step, let's discover the chemical reaction happening inside: Cellular Respiration! "
                    "Mitochondria combine glucose from your food with oxygen you breathe to produce carbon dioxide, water, and ATP. "
                    "ATP stands for Adenosine Triphosphate — the universal energy currency of all living things!"
                ),
                whiteboard_elements=step3_mito_elements,
                checkpoint_question="What does the abbreviation ATP stand for, which is known as the energy currency of the cell?",
                expected_keywords=["adenosine triphosphate", "triphosphate", "adenosine"],
                explanation_on_correct=(
                    "Outstanding! ATP stands for Adenosine Triphosphate. Just like money pays for goods, ATP pays for every biochemical activity in living organisms!"
                ),
                remedial_hint=(
                    "Hint: It starts with 'Adenosine' and ends with 'Triphosphate' (representing 3 phosphate groups attached)."
                ),
            )
        )

        self.register_topic(
            mitochondria,
            aliases=[
                "mitochondria",
                "class7_biology_mitochondria",
                "microcondria",
                "cell_powerhouse",
                "mitochondria_class7",
                "biology_mitochondria",
            ],
        )
