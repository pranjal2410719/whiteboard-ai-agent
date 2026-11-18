"""
Whiteboard Spatial Context & Layout Tracking Engine
===================================================
Maintains full spatial awareness of every element on the canvas:
- Bounding boxes, coordinates (x, y, width, height, center, right, bottom)
- Relative geometric positioning (below, above, beside, inside)
- Natural reference resolution (e.g. 'the circle', 'the formula', 'the previous element')
- Alignment and distribution calculations
- Collision detection and automatic overlap avoidance
"""

import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union

from .semantic_element import SemanticElement


@dataclass
class BoundingBox:
    x: float
    y: float
    width: float
    height: float

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

    def intersects(self, other: "BoundingBox") -> bool:
        """Return True if this bounding box overlaps with another."""
        return not (
            self.right <= other.x
            or self.x >= other.right
            or self.bottom <= other.y
            or self.y >= other.bottom
        )


class SpatialContext:
    """Maintains real-time spatial context and geometric memory of the whiteboard."""

    def __init__(self):
        self.elements: Dict[str, Dict[str, Any]] = {}
        self.order: List[str] = []  # Ordered list of element IDs (z-order)
        self.semantic_index: Dict[str, SemanticElement] = {}
        self.last_element_id: Optional[str] = None
        self.history: List[Dict[str, Any]] = []

    # -------------------------------------------------------------------------
    # State Synchronization & Element Indexing
    # -------------------------------------------------------------------------

    def register_semantic_element(self, element: SemanticElement) -> None:
        """Register a rich semantic element into both raw and semantic indexes."""
        self.semantic_index[element.id] = element
        self.elements[element.id] = element.to_dict()
        if element.id not in self.order:
            self.order.append(element.id)
        self.last_element_id = element.id

    def get_semantic_element(self, query: str) -> Optional[SemanticElement]:
        """Retrieve a SemanticElement, creating one on-the-fly if needed from raw data."""
        raw = self.find(query)
        if not raw:
            return None
        elem_id = raw.get("id")
        if elem_id in self.semantic_index:
            return self.semantic_index[elem_id]

        # Build SemanticElement on-the-fly
        text = self.get_text(raw)
        sem = SemanticElement(
            element_id=elem_id,
            element_type=raw.get("type", "rectangle"),
            x=raw.get("x", 0),
            y=raw.get("y", 0),
            width=raw.get("width", 200),
            height=raw.get("height", 100),
            content=text,
            role=raw.get("role", "whiteboard_element"),
            purpose=raw.get("purpose", f"Visual element: {text or raw.get('type')}"),
            raw_data=raw,
        )
        self.semantic_index[elem_id] = sem
        return sem

    def find_overlapping_elements(self, target_id_or_bbox: Union[str, BoundingBox]) -> List[str]:
        """Find IDs of all other elements that intersect/overlap with target."""
        if isinstance(target_id_or_bbox, str):
            target_id = target_id_or_bbox
            target_bbox = self.get_bbox(target_id)
        else:
            target_id = None
            target_bbox = target_id_or_bbox

        if not target_bbox:
            return []

        overlapping = []
        for eid in self.order:
            if eid == target_id:
                continue
            b = self.get_bbox(eid)
            if b and target_bbox.intersects(b):
                overlapping.append(eid)
        return overlapping

    def explain_element(self, query: str) -> Dict[str, Any]:
        """
        Produce a comprehensive answer to the five core contextual questions:
        - Where is the element?
        - What is the position?
        - What are the coordinates?
        - What content is on the operation?
        - Why was this element there?
        - Is there any element placed over it?
        """
        sem = self.get_semantic_element(query)
        if not sem:
            return {"success": False, "error": f"Element '{query}' not found in spatial context."}

        # Refresh overlap tracking
        sem.overlapping_elements = self.find_overlapping_elements(sem.id)
        return {"success": True, "context": sem.explain_context()}

    # -------------------------------------------------------------------------
    # State Synchronization & Element Indexing
    # -------------------------------------------------------------------------

    def update_from_elements(self, element_list: Union[List[Dict[str, Any]], Dict[str, Any]]) -> None:
        """Update spatial context with a full list of canvas elements."""
        if isinstance(element_list, dict) and "elements" in element_list:
            element_list = element_list["elements"]
        elif not isinstance(element_list, list):
            element_list = []

        self.elements.clear()
        self.order.clear()
        for el in element_list:
            if not isinstance(el, dict):
                continue
            elem_id = el.get("id")
            if not elem_id:
                continue
            self.elements[elem_id] = dict(el)
            self.order.append(elem_id)
        if self.order:
            self.last_element_id = self.order[-1]

    def add_elements(self, elements: List[Dict[str, Any]]) -> None:
        """Incrementally add elements to the spatial context without wiping existing elements."""
        for el in elements:
            if isinstance(el, dict) and "id" in el:
                self.register_element(el)

    def register_element(self, element: Dict[str, Any], set_as_last: bool = True) -> str:
        """Register or update a single element in the spatial index."""
        elem_id = element.get("id")
        if not elem_id:
            raise ValueError("Element must have an 'id'")
        self.elements[elem_id] = dict(element)
        if elem_id not in self.order:
            self.order.append(elem_id)
        if set_as_last:
            self.last_element_id = elem_id
        return elem_id

    def remove_element(self, element_id: str) -> Optional[Dict[str, Any]]:
        """Remove an element from spatial context by ID."""
        if element_id in self.elements:
            removed = self.elements.pop(element_id)
            if element_id in self.order:
                self.order.remove(element_id)
            if self.last_element_id == element_id:
                self.last_element_id = self.order[-1] if self.order else None
            return removed
        return None

    def get_all_elements(self) -> List[Dict[str, Any]]:
        """Return all elements sorted by current z-order."""
        return [self.elements[eid] for eid in self.order if eid in self.elements]

    # -------------------------------------------------------------------------
    # Bounding Box & Query Helpers
    # -------------------------------------------------------------------------

    def get_bbox(self, element_or_id: Union[str, Dict[str, Any]]) -> Optional[BoundingBox]:
        """Compute the bounding box of an element or element ID."""
        if isinstance(element_or_id, str):
            el = self.elements.get(element_or_id)
        else:
            el = element_or_id

        if not el:
            return None

        x = float(el.get("x", 0))
        y = float(el.get("y", 0))
        w = float(el.get("width", 0))
        h = float(el.get("height", 0))

        # Handle lines or arrows where points define dimensions
        if (w == 0 or h == 0) and "points" in el and el["points"]:
            pts = el["points"]
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            x += min_x
            y += min_y
            w = max(abs(max_x - min_x), 10.0)
            h = max(abs(max_y - min_y), 10.0)

        # Ensure minimal positive dimensions for zero-sized elements
        w = max(w, 20.0)
        h = max(h, 20.0)

        return BoundingBox(x=x, y=y, width=w, height=h)

    def get_text(self, el: Dict[str, Any]) -> str:
        """Extract text content from an element regardless of format."""
        if not el:
            return ""
        if "text" in el and el["text"]:
            return str(el["text"])
        label = el.get("label")
        if isinstance(label, dict) and "text" in label:
            return str(label["text"])
        return ""

    def find(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Locate an element by ID, type name, or fuzzy text content.
        Supports special queries: 'last', 'previous', 'first'.
        """
        if not self.elements:
            return None

        q = query.strip()
        q_lower = q.lower()

        # Positional keywords
        if q_lower in ("last", "previous", "recent", "prev"):
            if self.last_element_id and self.last_element_id in self.elements:
                return self.elements[self.last_element_id]
            return self.elements[self.order[-1]] if self.order else None

        if q_lower == "first":
            return self.elements[self.order[0]] if self.order else None

        # Exact ID match
        if q in self.elements:
            return self.elements[q]

        # Case-insensitive ID match
        for eid, el in self.elements.items():
            if eid.lower() == q_lower:
                return el

        # Match by text content
        for el in reversed(self.get_all_elements()):
            text = self.get_text(el).lower()
            if q_lower in text:
                return el

        # Match by element type
        for el in reversed(self.get_all_elements()):
            if el.get("type", "").lower() == q_lower:
                return el

        return None

    def find_all_by_type(self, element_type: str) -> List[Dict[str, Any]]:
        """Find all elements of a given type (e.g. rectangle, ellipse, arrow)."""
        t = element_type.lower()
        return [el for el in self.get_all_elements() if el.get("type", "").lower() == t]

    # -------------------------------------------------------------------------
    # Relative Spatial Positioning Calculations
    # -------------------------------------------------------------------------

    def calculate_relative_position(
        self,
        reference: Union[str, Dict[str, Any], BoundingBox],
        placement: str = "below",
        width: float = 200.0,
        height: float = 100.0,
        gap: float = 20.0,
        align: str = "center",
    ) -> Tuple[float, float]:
        """
        Calculate (x, y) coordinates for an element relative to a reference element.
        
        Args:
            reference: Target element ID, element dict, or BoundingBox.
            placement: 'below', 'above', 'right', 'left', 'inside'.
            width: Width of the new element.
            height: Height of the new element.
            gap: Pixel distance from reference boundary.
            align: 'center', 'start' (left/top), 'end' (right/bottom).
        """
        if isinstance(reference, BoundingBox):
            ref_bbox = reference
        else:
            ref_bbox = self.get_bbox(reference)

        if not ref_bbox:
            # Fallback to default canvas coordinate
            return (100.0, 100.0)

        placement = placement.lower()
        align = align.lower()

        if placement == "below":
            y = ref_bbox.bottom + gap
            if align == "center":
                x = ref_bbox.center_x - (width / 2.0)
            elif align in ("start", "left"):
                x = ref_bbox.x
            elif align in ("end", "right"):
                x = ref_bbox.right - width
            else:
                x = ref_bbox.x

        elif placement == "above":
            y = ref_bbox.y - height - gap
            if align == "center":
                x = ref_bbox.center_x - (width / 2.0)
            elif align in ("start", "left"):
                x = ref_bbox.x
            elif align in ("end", "right"):
                x = ref_bbox.right - width
            else:
                x = ref_bbox.x

        elif placement in ("right", "beside", "beside_right"):
            x = ref_bbox.right + gap
            if align == "center":
                y = ref_bbox.center_y - (height / 2.0)
            elif align in ("start", "top"):
                y = ref_bbox.y
            elif align in ("end", "bottom"):
                y = ref_bbox.bottom - height
            else:
                y = ref_bbox.y

        elif placement in ("left", "beside_left"):
            x = ref_bbox.x - width - gap
            if align == "center":
                y = ref_bbox.center_y - (height / 2.0)
            elif align in ("start", "top"):
                y = ref_bbox.y
            elif align in ("end", "bottom"):
                y = ref_bbox.bottom - height
            else:
                y = ref_bbox.y

        elif placement == "inside":
            x = ref_bbox.center_x - (width / 2.0)
            y = ref_bbox.center_y - (height / 2.0)

        else:
            x = ref_bbox.x
            y = ref_bbox.bottom + gap

        return (round(x, 1), round(y, 1))

    # -------------------------------------------------------------------------
    # Spatial Alignment & Distribution
    # -------------------------------------------------------------------------

    def compute_alignment(
        self,
        element_ids: List[str],
        to: str = "left",
    ) -> Dict[str, Dict[str, float]]:
        """
        Compute coordinate updates to align a group of elements.
        to: 'left', 'center', 'right', 'top', 'middle', 'bottom'.
        Returns dict: {element_id: {'x': new_x} or {'y': new_y}}
        """
        valid_bboxes = []
        for eid in element_ids:
            bbox = self.get_bbox(eid)
            if bbox:
                valid_bboxes.append((eid, bbox))

        if len(valid_bboxes) < 2:
            return {}

        to = to.lower()
        updates = {}

        if to == "left":
            target_x = min(b.x for _, b in valid_bboxes)
            for eid, _ in valid_bboxes:
                updates[eid] = {"x": target_x}

        elif to == "right":
            target_right = max(b.right for _, b in valid_bboxes)
            for eid, b in valid_bboxes:
                updates[eid] = {"x": target_right - b.width}

        elif to == "center":
            avg_center_x = sum(b.center_x for _, b in valid_bboxes) / len(valid_bboxes)
            for eid, b in valid_bboxes:
                updates[eid] = {"x": round(avg_center_x - (b.width / 2.0), 1)}

        elif to == "top":
            target_y = min(b.y for _, b in valid_bboxes)
            for eid, _ in valid_bboxes:
                updates[eid] = {"y": target_y}

        elif to == "bottom":
            target_bottom = max(b.bottom for _, b in valid_bboxes)
            for eid, b in valid_bboxes:
                updates[eid] = {"y": target_bottom - b.height}

        elif to in ("middle", "vertical_center"):
            avg_center_y = sum(b.center_y for _, b in valid_bboxes) / len(valid_bboxes)
            for eid, b in valid_bboxes:
                updates[eid] = {"y": round(avg_center_y - (b.height / 2.0), 1)}

        return updates

    def compute_distribution(
        self,
        element_ids: List[str],
        direction: str = "horizontal",
        gap: Optional[float] = None,
    ) -> Dict[str, Dict[str, float]]:
        """
        Compute coordinate updates to distribute elements evenly.
        direction: 'horizontal' or 'vertical'.
        """
        valid_items = []
        for eid in element_ids:
            bbox = self.get_bbox(eid)
            if bbox:
                valid_items.append((eid, bbox))

        if len(valid_items) < 2:
            return {}

        direction = direction.lower()
        updates = {}

        if direction == "horizontal":
            # Sort from left to right
            valid_items.sort(key=lambda item: item[1].x)
            first_x = valid_items[0][1].x
            last_x = valid_items[-1][1].right
            total_elements_width = sum(item[1].width for item in valid_items)

            if gap is None:
                # Distribute space evenly between elements
                total_span = last_x - first_x
                remaining_space = total_span - total_elements_width
                calculated_gap = max(remaining_space / (len(valid_items) - 1), 10.0)
            else:
                calculated_gap = gap

            curr_x = first_x
            for eid, bbox in valid_items:
                updates[eid] = {"x": round(curr_x, 1)}
                curr_x += bbox.width + calculated_gap

        elif direction == "vertical":
            # Sort from top to bottom
            valid_items.sort(key=lambda item: item[1].y)
            first_y = valid_items[0][1].y
            last_y = valid_items[-1][1].bottom
            total_elements_height = sum(item[1].height for item in valid_items)

            if gap is None:
                total_span = last_y - first_y
                remaining_space = total_span - total_elements_height
                calculated_gap = max(remaining_space / (len(valid_items) - 1), 10.0)
            else:
                calculated_gap = gap

            curr_y = first_y
            for eid, bbox in valid_items:
                updates[eid] = {"y": round(curr_y, 1)}
                curr_y += bbox.height + calculated_gap

        return updates

    # -------------------------------------------------------------------------
    # Collision Avoidance
    # -------------------------------------------------------------------------

    def find_non_overlapping_spot(
        self,
        target_x: float,
        target_y: float,
        width: float,
        height: float,
        step_y: float = 30.0,
        max_attempts: int = 20,
    ) -> Tuple[float, float]:
        """
        Check if (target_x, target_y, width, height) collides with existing elements.
        If it does, automatically step down to find a clean, non-overlapping spot.
        """
        candidate = BoundingBox(x=target_x, y=target_y, width=width, height=height)
        all_bboxes = [self.get_bbox(el) for el in self.get_all_elements()]
        all_bboxes = [b for b in all_bboxes if b is not None]

        attempts = 0
        while attempts < max_attempts:
            collision = any(candidate.intersects(b) for b in all_bboxes)
            if not collision:
                return (candidate.x, candidate.y)
            candidate.y += step_y
            attempts += 1

        return (candidate.x, candidate.y)
