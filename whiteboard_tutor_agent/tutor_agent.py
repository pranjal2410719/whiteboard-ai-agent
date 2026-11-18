"""
Whiteboard Tutor AI Agent Core
===============================
Coordinates visual whiteboard drawing, interactive pedagogical dialogue,
student evaluation, doubt resolution, and visual verification.
"""

import logging
import os
import time
from typing import Any, Dict, List, Optional

from .canvas_client import CanvasClient
from .curriculum import Curriculum, LessonStep, LessonTopic
from .llm_client import LLMClient
from .spatial_context import SpatialContext
from .whiteboard_ops import WhiteboardOperations

logger = logging.getLogger(__name__)


class WhiteboardTutorAgent:
    """The central AI Tutor managing whiteboard state and student interaction."""

    def __init__(self, canvas_url: Optional[str] = None, llm_provider: Optional[str] = None):
        self.canvas = CanvasClient(base_url=canvas_url)
        self.curriculum = Curriculum()
        self.llm = LLMClient(provider=llm_provider)
        self.context = SpatialContext()
        self.ops = WhiteboardOperations(canvas_client=self.canvas, context=self.context)
        self.current_topic: Optional[LessonTopic] = None
        self.current_step_idx: int = 0
        self.history: List[Dict[str, Any]] = []
        self.waiting_for_checkpoint: bool = False

    # -------------------------------------------------------------------------
    # Lesson Lifecycle
    # -------------------------------------------------------------------------

    def start_lesson(self, topic_id: str) -> Dict[str, Any]:
        """Begin a structured lesson, drawing the first step on the whiteboard."""
        topic = self.curriculum.get_topic(topic_id)
        if not topic:
            available = [t["id"] for t in self.curriculum.list_topics()]
            return {
                "success": False,
                "error": f"Topic '{topic_id}' not found. Available topics: {', '.join(available)}",
            }

        self.current_topic = topic
        self.current_step_idx = 0
        step = topic.steps[0]

        # Sync whiteboard
        self._sync_step_to_board(step)
        self.waiting_for_checkpoint = True

        msg = {
            "success": True,
            "topic_id": topic.id,
            "topic_title": topic.title,
            "grade_level": topic.grade_level,
            "step_number": step.step_number,
            "total_steps": len(topic.steps),
            "step_title": step.title,
            "narration": step.narration,
            "checkpoint_question": step.checkpoint_question,
            "canvas_url": self.canvas.base_url,
        }
        self.history.append({"role": "tutor", "type": "lesson_start", "data": msg})
        return msg

    def _sync_step_to_board(self, step: LessonStep) -> None:
        """Clear canvas and draw the elements corresponding to the current step."""
        try:
            self.canvas.clear()
            self.canvas.add_elements(step.whiteboard_elements)
            self.context.update_from_elements(step.whiteboard_elements)
            self.canvas.save_snapshot(f"step_{step.step_number}_{int(time.time())}")
        except Exception as e:
            logger.warning(f"Could not sync elements to canvas server: {e}")

    # -------------------------------------------------------------------------
    # Student Interaction & Evaluation
    # -------------------------------------------------------------------------

    def handle_input(self, user_input: str) -> Dict[str, Any]:
        """Process incoming student input: answers, questions, or control commands."""
        text = user_input.strip()
        lower = text.lower()

        # Handle explicit commands
        if lower in ("next", "continue", "skip"):
            return self.advance_step(force=True)
        if lower in ("prev", "previous", "back"):
            return self.previous_step()
        if lower in ("redraw", "refresh", "board"):
            if self.current_topic and self.current_step_idx < len(self.current_topic.steps):
                self._sync_step_to_board(self.current_topic.steps[self.current_step_idx])
                return {"success": True, "message": "Whiteboard redrawn and refreshed."}
            return {"success": False, "message": "No active lesson to redraw."}
        if lower.startswith("export"):
            return self.export_lesson()

        # Check for direct whiteboard visual actions (draw, erase, light, annotate, align, etc.)
        action_res = self.try_execute_action(text)
        if action_res is not None:
            return action_res

        # Check if the student is asking a doubt or question
        is_question = (
            "?" in text
            or lower.startswith((
                "what", "why", "how", "can ", "could ", "is ", "are ", "does ",
                "explain", "doubt", "tell me", "wait", "please explain"
            ))
        )

        if is_question:
            return self.answer_doubt(text)

        # If we are waiting for a checkpoint answer, evaluate it
        if self.waiting_for_checkpoint and self.current_topic:
            return self.evaluate_checkpoint(text)

        # Otherwise treat as a general doubt / question
        return self.answer_doubt(text)

    def try_execute_action(self, command: str) -> Optional[Dict[str, Any]]:
        """Parse and execute direct whiteboard actions if command matches."""
        raw = command.strip()
        lower = raw.lower()

        # 1. Circle
        if lower.startswith("circle "):
            target = raw[7:].strip()
            elem = self.ops.circle(target)
            return {
                "success": bool(elem),
                "action": "circle",
                "target": target,
                "message": f"Circled '{target}' with attention ring." if elem else f"Could not find '{target}' to circle.",
            }

        # 2. Underline
        if lower.startswith("underline "):
            target = raw[10:].strip()
            elem = self.ops.underline(target)
            return {
                "success": bool(elem),
                "action": "underline",
                "target": target,
                "message": f"Underlined '{target}' on the whiteboard." if elem else f"Could not find '{target}' to underline.",
            }

        # 3. Light / Highlight
        if lower.startswith(("light ", "highlight ")):
            prefix = "highlight " if lower.startswith("highlight ") else "light "
            target = raw[len(prefix):].strip()
            elem = self.ops.light(target)
            return {
                "success": bool(elem),
                "action": "light",
                "target": target,
                "message": f"Highlighted '{target}' on the whiteboard." if elem else f"Could not find '{target}' to highlight.",
            }

        # 4. Spotlight
        if lower.startswith("spotlight "):
            target = raw[10:].strip()
            elems = self.ops.spotlight(target)
            return {
                "success": bool(elems),
                "action": "spotlight",
                "target": target,
                "message": f"Spotlighted '{target}' with attention pointer." if elems else f"Could not find '{target}' to spotlight.",
            }

        # 5. Erase / Delete
        if lower.startswith(("erase ", "delete ", "remove ")):
            prefix = lower.split(" ", 1)[0] + " "
            target = raw[len(prefix):].strip()
            ok = self.ops.erase(target)
            return {
                "success": ok,
                "action": "erase",
                "target": target,
                "message": f"Erased '{target}' from whiteboard." if ok else f"Could not find '{target}' to erase.",
            }

        # 6. Callout / Annotate
        if lower.startswith(("callout ", "annotate ")):
            prefix = lower.split(" ", 1)[0] + " "
            rest = raw[len(prefix):].strip()
            if ":" in rest:
                target, note = rest.split(":", 1)
            else:
                target, note = rest, "Note"
            elems = self.ops.add_callout(target.strip(), note.strip())
            return {
                "success": bool(elems),
                "action": "callout",
                "target": target.strip(),
                "message": f"Added callout note to '{target.strip()}': {note.strip()}" if elems else f"Target '{target}' not found.",
            }

        # 7. Draw relative (below, above, beside, right, left)
        for rel in ("draw below ", "place under ", "draw under ", "draw above ", "place above ", "draw beside ", "draw right "):
            if lower.startswith(rel):
                rest = raw[len(rel):].strip()
                placement = "below" if "under" in rel or "below" in rel else ("above" if "above" in rel else "right")
                if ":" in rest:
                    target, text_content = rest.split(":", 1)
                else:
                    target, text_content = rest, ""
                elem = self.ops.draw_relative(
                    reference_query=target.strip(),
                    placement=placement,
                    text=text_content.strip(),
                )
                return {
                    "success": bool(elem),
                    "action": "draw_relative",
                    "placement": placement,
                    "target": target.strip(),
                    "message": f"Drawn new element {placement} '{target.strip()}': {text_content.strip()}",
                }

        # 8. Draw Arrow from X to Y
        if lower.startswith("draw arrow ") or lower.startswith("arrow "):
            rest = lower.replace("draw arrow ", "").replace("arrow ", "").strip()
            if " from " in rest and " to " in rest:
                src = rest.split(" from ", 1)[1].split(" to ", 1)[0].strip()
                dst = rest.split(" to ", 1)[1].strip()
                elem = self.ops.draw_arrow(src, dst)
                return {
                    "success": bool(elem),
                    "action": "draw_arrow",
                    "source": src,
                    "target": dst,
                    "message": f"Drawn arrow from '{src}' to '{dst}'." if elem else f"Could not connect '{src}' to '{dst}'.",
                }

        # 9. Align
        if lower.startswith("align ") and " to " in lower:
            parts = raw[6:].split(" to ", 1)
            ids = [s.strip() for s in parts[0].split(",")]
            to_dir = parts[1].strip()
            res = self.ops.align(ids, to=to_dir)
            return res

        # 10. Distribute
        if lower.startswith("distribute "):
            parts = raw[11:].strip()
            direction = "vertical" if "vertical" in lower else "horizontal"
            clean_parts = parts.replace("vertical", "").replace("horizontal", "").strip()
            ids = [s.strip() for s in clean_parts.split(",") if s.strip()]
            res = self.ops.distribute(ids, direction=direction)
            return res

        # 11. Generate Image
        if lower.startswith(("generate image", "export image", "export png", "export svg")):
            parts = raw.split()
            path = parts[-1] if len(parts) >= 3 and not parts[-1].startswith("-") else "whiteboard.png"
            fmt = "svg" if path.endswith(".svg") or "svg" in lower else "png"
            res = self.ops.generate_image(out_path=path, format=fmt)
            return {
                "success": True,
                "action": "generate_image",
                "file": res.get("file", path),
                "message": f"Whiteboard image generated: {res.get('file', path)}",
            }

        # 12. Explain Element Context (The 5 Core Context Questions)
        if lower.startswith(("explain element ", "context of ", "inspect element ", "where is ")):
            prefix = ""
            for p in ("explain element ", "context of ", "inspect element ", "where is "):
                if lower.startswith(p):
                    prefix = p
                    break
            target = raw[len(prefix):].strip("? ")
            res = self.ops.explain_element(target)
            return {
                "success": res.get("success", False),
                "action": "explain_element",
                "target": target,
                "context": res.get("context"),
                "message": f"Retrieved full context for '{target}'" if res.get("success") else res.get("error"),
            }

        # 13. Highlight Flowchart Node
        if "highlight node " in lower and " in " in lower:
            # e.g. "highlight node 0 in physics_fc with circle"
            # or "highlight node start in physics_fc"
            parts = lower.split("highlight node ", 1)[1].split(" in ", 1)
            node_q = parts[0].strip()
            rest = parts[1].strip()
            style = "light"
            fc_id = rest
            if " with " in rest:
                fc_id, style = rest.split(" with ", 1)
                fc_id = fc_id.strip()
                style = style.strip()
            res = self.ops.highlight_flowchart_node(fc_id, node_q, style=style)
            return res

        return None

    def evaluate_checkpoint(self, student_answer: str) -> Dict[str, Any]:
        """Evaluate student answer against expected concept keywords."""
        if not self.current_topic:
            return {"success": False, "error": "No active lesson. Start a lesson with start_lesson(topic_id)."}

        step = self.current_topic.steps[self.current_step_idx]

        # Use LLM or heuristic evaluation
        eval_res = self.llm.evaluate_student_answer(
            checkpoint_question=step.checkpoint_question,
            expected_keywords=step.expected_keywords,
            student_answer=student_answer,
            step_title=step.title,
        )
        is_correct = eval_res["is_correct"]

        self.history.append({"role": "student", "type": "checkpoint_answer", "content": student_answer, "is_correct": is_correct})

        if is_correct:
            feedback = eval_res.get("feedback") or step.explanation_on_correct
            # Check if there are more steps
            if self.current_step_idx + 1 < len(self.current_topic.steps):
                self.current_step_idx += 1
                next_step = self.current_topic.steps[self.current_step_idx]
                self._sync_step_to_board(next_step)
                self.waiting_for_checkpoint = True

                result = {
                    "success": True,
                    "evaluated": "CORRECT",
                    "tutor_feedback": feedback,
                    "next_step_available": True,
                    "step_number": next_step.step_number,
                    "total_steps": len(self.current_topic.steps),
                    "step_title": next_step.title,
                    "narration": next_step.narration,
                    "checkpoint_question": next_step.checkpoint_question,
                }
            else:
                self.waiting_for_checkpoint = False
                result = {
                    "success": True,
                    "evaluated": "CORRECT",
                    "tutor_feedback": feedback,
                    "next_step_available": False,
                    "lesson_completed": True,
                    "congratulations": f"🎉 Congratulations! You have completed the entire topic: '{self.current_topic.title}'!",
                }
        else:
            result = {
                "success": True,
                "evaluated": "NEEDS_IMPROVEMENT",
                "tutor_feedback": f"Good try! Here is a hint to help you think through it: {step.remedial_hint}",
                "retry_question": step.checkpoint_question,
            }

        self.history.append({"role": "tutor", "type": "evaluation_response", "data": result})
        return result

    def advance_step(self, force: bool = False) -> Dict[str, Any]:
        """Manually advance to the next step."""
        if not self.current_topic:
            return {"success": False, "error": "No active lesson."}

        if self.current_step_idx + 1 < len(self.current_topic.steps):
            self.current_step_idx += 1
            step = self.current_topic.steps[self.current_step_idx]
            self._sync_step_to_board(step)
            self.waiting_for_checkpoint = True
            return {
                "success": True,
                "step_number": step.step_number,
                "step_title": step.title,
                "narration": step.narration,
                "checkpoint_question": step.checkpoint_question,
            }
        return {"success": False, "message": "Already at the final step of this lesson."}

    def previous_step(self) -> Dict[str, Any]:
        """Return to the previous lesson step."""
        if not self.current_topic:
            return {"success": False, "error": "No active lesson."}

        if self.current_step_idx > 0:
            self.current_step_idx -= 1
            step = self.current_topic.steps[self.current_step_idx]
            self._sync_step_to_board(step)
            self.waiting_for_checkpoint = True
            return {
                "success": True,
                "step_number": step.step_number,
                "step_title": step.title,
                "narration": step.narration,
                "checkpoint_question": step.checkpoint_question,
            }
        return {"success": False, "message": "Already at the first step of this lesson."}

    # -------------------------------------------------------------------------
    # Answering Doubts & Dynamic Annotation
    # -------------------------------------------------------------------------

    def answer_doubt(self, student_doubt: str) -> Dict[str, Any]:
        """Answer a student's doubt and annotate the whiteboard with a highlighted note card."""
        ans = self._generate_doubt_answer(student_doubt)

        # Add an answer callout box to the current whiteboard
        try:
            callout = {
                "id": f"doubt_note_{int(time.time())}",
                "type": "rectangle",
                "x": 80,
                "y": 620,
                "width": 900,
                "height": 95,
                "text": f"STUDENT QUESTION & TUTOR NOTE:\nQ: {student_doubt[:80]}...\nA: {ans[:200]}...",
                "backgroundColor": "#fff3bf",
                "strokeColor": "#f59f00",
                "fontSize": 12,
            }
            self.canvas.add_elements([callout])
        except Exception as e:
            logger.warning(f"Could not annotate doubt note onto canvas: {e}")

        response = {
            "success": True,
            "type": "doubt_resolution",
            "question": student_doubt,
            "answer": ans,
            "whiteboard_annotated": True,
        }
        if self.waiting_for_checkpoint and self.current_topic:
            step = self.current_topic.steps[self.current_step_idx]
            response["checkpoint_reminder"] = step.checkpoint_question
        self.history.append({"role": "tutor", "type": "doubt_response", "data": response})
        return response

    def _generate_doubt_answer(self, doubt: str) -> str:
        """Generate pedagogical answer using LLM or built-in physics rule engine."""
        ctx = ""
        if self.current_topic and self.current_step_idx < len(self.current_topic.steps):
            step = self.current_topic.steps[self.current_step_idx]
            ctx = f"Topic: {self.current_topic.title}, Step {step.step_number}: {step.title}"
        return self.llm.answer_student_doubt(doubt, ctx)

    # -------------------------------------------------------------------------
    # Board Inspection & Export
    # -------------------------------------------------------------------------

    def get_board_status(self) -> Dict[str, Any]:
        """Inspect the current live whiteboard."""
        health = self.canvas.health()
        desc = self.canvas.describe()
        return {
            "health": health,
            "canvas_url": self.canvas.base_url,
            "active_topic": self.current_topic.title if self.current_topic else None,
            "active_step": self.current_step_idx + 1 if self.current_topic else None,
            "board_description": desc,
        }

    def export_lesson(self, out_dir: str = ".") -> Dict[str, Any]:
        """Export current lesson artifacts (PNG + .excalidraw)."""
        os.makedirs(out_dir, exist_ok=True)
        img_path = os.path.join(out_dir, "whiteboard_lesson.png")
        scene_path = os.path.join(out_dir, "whiteboard_lesson.excalidraw")

        r_img = self.canvas.export_image(img_path, format="png", scale=2)
        r_scene = self.canvas.export_scene(scene_path)
        return {
            "success": True,
            "image": r_img.get("file"),
            "excalidraw_file": r_scene.get("file"),
        }
