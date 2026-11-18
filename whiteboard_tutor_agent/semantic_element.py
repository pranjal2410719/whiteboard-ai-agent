"""
Semantic Element & Comprehensive Context Tracking Model
======================================================
Stores and answers the five essential contextual questions for every element:
1. Where is the element? (Quadrant, spatial relation, parent container)
2. What is the position? (Index in sequence, hierarchy, relative position)
3. What are the coordinates? (Outer bounds, inner text coordinates, anchor points)
4. What content is on the operation? (Text, label, formula, shape type, styling)
5. Why was this element there? (Semantic purpose, pedagogical intent, role)

Also tracks layering, overlapping elements, and attached annotations.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class AnchorPoints:
    top: Tuple[float, float]
    bottom: Tuple[float, float]
    left: Tuple[float, float]
    right: Tuple[float, float]
    center: Tuple[float, float]

    def to_dict(self) -> Dict[str, Tuple[float, float]]:
        return {
            "top": self.top,
            "bottom": self.bottom,
            "left": self.left,
            "right": self.right,
            "center": self.center,
        }


@dataclass
class InnerTextBounds:
    x: float
    y: float
    width: float
    height: float
    text: str
    font_size: int = 14

    @property
    def bottom(self) -> float:
        return self.y + self.height

    @property
    def right(self) -> float:
        return self.x + self.width

    def to_dict(self) -> Dict[str, Any]:
        return {
            "x": round(self.x, 1),
            "y": round(self.y, 1),
            "width": round(self.width, 1),
            "height": round(self.height, 1),
            "right": round(self.right, 1),
            "bottom": round(self.bottom, 1),
            "text": self.text,
            "font_size": self.font_size,
        }


class SemanticElement:
    """Rich semantic wrapper around an Excalidraw whiteboard element."""

    def __init__(
        self,
        element_id: str,
        element_type: str,
        x: float,
        y: float,
        width: float,
        height: float,
        content: str = "",
        role: str = "general_element",
        purpose: str = "",
        parent_id: Optional[str] = None,
        sequence_index: int = 0,
        raw_data: Optional[Dict[str, Any]] = None,
    ):
        self.id = element_id
        self.element_type = element_type
        self.x = float(x)
        self.y = float(y)
        self.width = float(width)
        self.height = float(height)
        self.content = content
        self.role = role
        self.purpose = purpose or f"Whiteboard {element_type} representing {content or role}"
        self.parent_id = parent_id
        self.sequence_index = sequence_index
        self.raw_data = raw_data or {}

        # Layering & Overlap tracking
        self.attached_annotations: List[str] = []
        self.overlapping_elements: List[str] = []

    # -------------------------------------------------------------------------
    # Spatial & Geometry Properties
    # -------------------------------------------------------------------------

    @property
    def right(self) -> float:
        return self.x + self.width

    @property
    def bottom(self) -> float:
        return self.y + self.height

    @property
    def center_x(self) -> float:
        return self.x + (self.width / 2.0)

    @property
    def center_y(self) -> float:
        return self.y + (self.height / 2.0)

    @property
    def anchors(self) -> AnchorPoints:
        """Exact anchor connection points for connecting arrows and lines."""
        return AnchorPoints(
            top=(round(self.center_x, 1), round(self.y, 1)),
            bottom=(round(self.center_x, 1), round(self.bottom, 1)),
            left=(round(self.x, 1), round(self.center_y, 1)),
            right=(round(self.right, 1), round(self.center_y, 1)),
            center=(round(self.center_x, 1), round(self.center_y, 1)),
        )

    @property
    def boundaries(self) -> Dict[str, float]:
        """Outer bounding boundaries of the element."""
        return {
            "top": round(self.y, 1),
            "bottom": round(self.bottom, 1),
            "left": round(self.x, 1),
            "right": round(self.right, 1),
            "width": round(self.width, 1),
            "height": round(self.height, 1),
        }

    @property
    def text_bounds(self) -> Optional[InnerTextBounds]:
        """Calculated inner boundaries of the text inside this element."""
        if not self.content:
            return None

        font_size = int(self.raw_data.get("fontSize", 14))
        # Estimate text line metrics
        lines = self.content.split("\n")
        max_line_len = max(len(l) for l in lines) if lines else len(self.content)
        est_char_width = font_size * 0.58
        est_line_height = font_size * 1.35

        text_w = min(max_line_len * est_char_width, self.width - 10)
        text_h = min(len(lines) * est_line_height, self.height - 10)

        # Center inside container
        text_x = self.center_x - (text_w / 2.0)
        text_y = self.center_y - (text_h / 2.0)

        return InnerTextBounds(
            x=max(text_x, self.x + 5),
            y=max(text_y, self.y + 5),
            width=text_w,
            height=text_h,
            text=self.content,
            font_size=font_size,
        )

    def determine_quadrant(self, canvas_width: float = 1200.0, canvas_height: float = 800.0) -> str:
        """Determine general canvas quadrant / region."""
        mid_x = canvas_width / 2.0
        mid_y = canvas_height / 2.0
        horiz = "Left" if self.center_x < mid_x else "Right"
        vert = "Top" if self.center_y < mid_y else "Bottom"
        return f"{vert}-{horiz} Quadrant"

    # -------------------------------------------------------------------------
    # The Five Contextual Queries
    # -------------------------------------------------------------------------

    def explain_context(self) -> Dict[str, Any]:
        """
        Generate complete, structured answers to the 5 core contextual questions:
        - Where is the element?
        - What is the position?
        - What are the coordinates?
        - What content is on the operation?
        - Why was this element there?
        - Is there any element placed over it?
        """
        tb = self.text_bounds
        return {
            "element_id": self.id,
            "where_is_element": {
                "quadrant": self.determine_quadrant(),
                "parent_entity": self.parent_id or "Independent element on canvas",
                "center_point": (round(self.center_x, 1), round(self.center_y, 1)),
            },
            "what_is_position": {
                "sequence_index": self.sequence_index,
                "role": self.role,
                "z_layer": self.raw_data.get("version", 1),
            },
            "what_are_coordinates": {
                "exact_x": round(self.x, 1),
                "exact_y": round(self.y, 1),
                "width": round(self.width, 1),
                "height": round(self.height, 1),
                "boundaries": self.boundaries,
                "anchors": self.anchors.to_dict(),
                "inner_text_coordinates": tb.to_dict() if tb else None,
            },
            "what_content_is_on_operation": {
                "type": self.element_type,
                "content_text": self.content,
                "background_color": self.raw_data.get("backgroundColor", "transparent"),
                "stroke_color": self.raw_data.get("strokeColor", "#000000"),
                "font_size": self.raw_data.get("fontSize", 14),
            },
            "why_was_this_element_there": self.purpose,
            "is_there_any_element_over_it": {
                "has_overlays": len(self.overlapping_elements) > 0 or len(self.attached_annotations) > 0,
                "overlapping_elements": self.overlapping_elements,
                "attached_annotations": self.attached_annotations,
            },
        }

    def to_dict(self) -> Dict[str, Any]:
        d = dict(self.raw_data)
        d.update({
            "id": self.id,
            "type": self.element_type,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "role": self.role,
            "purpose": self.purpose,
            "parent_id": self.parent_id,
            "sequence_index": self.sequence_index,
        })
        return d
