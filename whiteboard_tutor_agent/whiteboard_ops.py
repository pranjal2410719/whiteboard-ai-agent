"""
Whiteboard Operations Suite
===========================
Executes high-level visual whiteboard actions:
- DRAW: shapes, cards, banners, arrows, and context-relative elements (below, above, beside)
- ERASE: delete by id, text search, or clear board
- LIGHT: highlighter backdrops, halos, and spotlight attention
- ANNOTATE: circle elements, underline words/boxes, add callouts
- ALIGN & DISTRIBUTE: multi-element geometric layout
- GENERATE IMAGES: headless export to PNG / SVG / editable scene files
"""

import logging
import os
import time
from typing import Any, Dict, List, Optional, Tuple, Union

from .canvas_client import CanvasClient
from .flowchart_manager import Flowchart, FlowchartEdgeDef, FlowchartManager, FlowchartNodeDef
from .spatial_context import BoundingBox, SpatialContext

logger = logging.getLogger(__name__)


class WhiteboardOperations:
    """Orchestrates comprehensive whiteboard operations with spatial tracking."""

    def __init__(self, canvas_client: Optional[CanvasClient] = None, context: Optional[SpatialContext] = None):
        self.canvas = canvas_client or CanvasClient()
        self.context = context or SpatialContext()
        self.flowchart = FlowchartManager(canvas_client=self.canvas, context=self.context)
        self.sync_from_canvas()

    def sync_from_canvas(self) -> None:
        """Fetch current canvas state and refresh spatial context."""
        try:
            elements = self.canvas.get_elements()
            self.context.update_from_elements(elements)
        except Exception as e:
            logger.warning(f"Could not sync elements from canvas: {e}")

    # =========================================================================
    # 1. DRAW Operations
    # =========================================================================

    def draw_shape(
        self,
        shape_type: str = "rectangle",
        x: float = 100,
        y: float = 100,
        width: float = 200,
        height: float = 100,
        text: str = "",
        bg_color: str = "#ffffff",
        stroke_color: str = "#1971c2",
        stroke_width: float = 2.0,
        font_size: int = 14,
        element_id: Optional[str] = None,
        avoid_collision: bool = True,
    ) -> Dict[str, Any]:
        """Draw an individual shape onto the whiteboard with optional collision avoidance."""
        self.sync_from_canvas()

        final_x, final_y = x, y
        if avoid_collision and shape_type not in ("arrow", "line"):
            final_x, final_y = self.context.find_non_overlapping_spot(x, y, width, height)

        elem_id = element_id or f"{shape_type}_{int(time.time()*1000)}"
        element: Dict[str, Any] = {
            "id": elem_id,
            "type": shape_type,
            "x": final_x,
            "y": final_y,
            "width": width,
            "height": height,
            "backgroundColor": bg_color,
            "strokeColor": stroke_color,
            "strokeWidth": stroke_width,
            "roughness": 1,
        }

        if text:
            if shape_type in ("rectangle", "ellipse", "diamond"):
                element["label"] = {"text": text}
                element["fontSize"] = font_size
            elif shape_type == "text":
                element["text"] = text
                element["fontSize"] = font_size

        self.canvas.add_elements([element])
        self.context.register_element(element)
        return element

    def draw_relative(
        self,
        reference_query: str,
        shape_type: str = "rectangle",
        placement: str = "below",
        width: float = 220,
        height: float = 100,
        gap: float = 25,
        align: str = "center",
        text: str = "",
        bg_color: str = "#e7f5ff",
        stroke_color: str = "#1971c2",
        stroke_width: float = 2.0,
    ) -> Dict[str, Any]:
        """
        Draw a new element positioned relatively to another element.
        E.g., placement='below', 'above', 'right', 'left', 'inside'.
        """
        self.sync_from_canvas()
        ref = self.context.find(reference_query)
        if not ref:
            logger.warning(f"Reference '{reference_query}' not found. Defaulting to coordinate placement.")
            return self.draw_shape(shape_type=shape_type, x=100, y=100, width=width, height=height, text=text)

        calc_x, calc_y = self.context.calculate_relative_position(
            reference=ref,
            placement=placement,
            width=width,
            height=height,
            gap=gap,
            align=align,
        )

        return self.draw_shape(
            shape_type=shape_type,
            x=calc_x,
            y=calc_y,
            width=width,
            height=height,
            text=text,
            bg_color=bg_color,
            stroke_color=stroke_color,
            stroke_width=stroke_width,
            avoid_collision=False,  # Honor exact calculated placement
        )

    def draw_arrow(
        self,
        from_query: str,
        to_query: str,
        label: str = "",
        stroke_color: str = "#1971c2",
        stroke_width: float = 2.5,
    ) -> Optional[Dict[str, Any]]:
        """Connect two elements on the whiteboard with a bound directional arrow."""
        self.sync_from_canvas()
        el1 = self.context.find(from_query)
        el2 = self.context.find(to_query)

        if not el1 or not el2:
            logger.warning(f"Cannot draw arrow: could not find endpoints ({from_query} -> {to_query})")
            return None

        b1 = self.context.get_bbox(el1)
        b2 = self.context.get_bbox(el2)

        start_x = b1.center_x
        start_y = b1.bottom if b2.center_y > b1.bottom else (b1.y if b2.center_y < b1.y else b1.center_x)
        end_x = b2.center_x
        end_y = b2.y if b2.center_y > b1.bottom else (b2.bottom if b2.center_y < b1.y else b2.center_y)

        dx = end_x - start_x
        dy = end_y - start_y

        arrow_elem = {
            "id": f"arrow_{int(time.time()*1000)}",
            "type": "arrow",
            "x": start_x,
            "y": start_y,
            "points": [[0, 0], [dx, dy]],
            "strokeColor": stroke_color,
            "strokeWidth": stroke_width,
            "endArrowhead": "arrow",
            "start": {"id": el1["id"]},
            "end": {"id": el2["id"]},
        }
        if label:
            arrow_elem["label"] = {"text": label}

        self.canvas.add_elements([arrow_elem])
        self.context.register_element(arrow_elem)
        return arrow_elem

    # =========================================================================
    # 2. ERASE Operations
    # =========================================================================

    def erase(self, query: str) -> bool:
        """Erase an element matching query by ID, text, or 'last'."""
        self.sync_from_canvas()
        target = self.context.find(query)
        if not target:
            logger.warning(f"Could not find element to erase: '{query}'")
            return False

        elem_id = target["id"]
        try:
            self.canvas.delete_element(elem_id)
            self.context.remove_element(elem_id)
            return True
        except Exception as e:
            logger.error(f"Failed to delete element {elem_id}: {e}")
            return False

    def erase_multiple(self, queries: List[str]) -> int:
        """Erase multiple elements matching a list of queries."""
        count = 0
        for q in queries:
            if self.erase(q):
                count += 1
        return count

    def clear(self) -> Dict[str, Any]:
        """Completely clear the whiteboard."""
        res = self.canvas.clear()
        self.context.elements.clear()
        self.context.order.clear()
        self.context.last_element_id = None
        return res

    # =========================================================================
    # 3. LIGHT / HIGHLIGHT Operations
    # =========================================================================

    def light(
        self,
        query: str,
        color: str = "#fff3bf",
        padding: float = 12.0,
        style: str = "backdrop",
    ) -> Optional[Dict[str, Any]]:
        """
        Light up / highlight an element.
        Creates a translucent halo or backdrop spotlight around the target element.
        """
        self.sync_from_canvas()
        target = self.context.find(query)
        if not target:
            logger.warning(f"Cannot light element: '{query}' not found.")
            return None

        bbox = self.context.get_bbox(target)
        highlight_elem = {
            "id": f"light_{target['id']}_{int(time.time()*1000)}",
            "type": "rectangle",
            "x": bbox.x - padding,
            "y": bbox.y - padding,
            "width": bbox.width + (2 * padding),
            "height": bbox.height + (2 * padding),
            "backgroundColor": color,
            "strokeColor": "#fab005" if style == "halo" else "transparent",
            "strokeWidth": 2.0 if style == "halo" else 0.5,
            "roughness": 0,
            "opacity": 50,
        }

        # Insert highlight on canvas
        self.canvas.add_elements([highlight_elem])
        self.context.register_element(highlight_elem, set_as_last=False)
        return highlight_elem

    def spotlight(self, query: str, label: str = "★ FOCUS") -> List[Dict[str, Any]]:
        """Highlight an element and draw an attention pointer arrow pointing to it."""
        h_elem = self.light(query, color="#fff3bf", style="halo")
        target = self.context.find(query)
        if not target or not h_elem:
            return []

        bbox = self.context.get_bbox(target)
        pointer = {
            "id": f"spotlight_lbl_{int(time.time()*1000)}",
            "type": "rectangle",
            "x": bbox.right + 25,
            "y": bbox.center_y - 18,
            "width": 110,
            "height": 36,
            "text": label,
            "backgroundColor": "#ff6b6b",
            "strokeColor": "#c92a2a",
            "fontSize": 12,
        }
        arrow = {
            "id": f"spotlight_arr_{int(time.time()*1000)}",
            "type": "arrow",
            "x": bbox.right + 20,
            "y": bbox.center_y,
            "points": [[0, 0], [-18, 0]],
            "strokeColor": "#c92a2a",
            "strokeWidth": 2.5,
            "endArrowhead": "arrow",
        }
        self.canvas.add_elements([pointer, arrow])
        self.context.register_element(pointer)
        self.context.register_element(arrow)
        return [h_elem, pointer, arrow]

    # =========================================================================
    # 4. ANNOTATE Operations (Circle, Underline, Callout)
    # =========================================================================

    def circle(
        self,
        query: str,
        color: str = "#e03131",
        stroke_width: float = 2.5,
        padding: float = 14.0,
    ) -> Optional[Dict[str, Any]]:
        """
        Draw an elliptical circle around a target element or word to highlight it.
        (e.g., circling an important formula or keyword on the whiteboard).
        """
        self.sync_from_canvas()
        target = self.context.find(query)
        if not target:
            logger.warning(f"Cannot circle: '{query}' not found.")
            return None

        bbox = self.context.get_bbox(target)
        circle_elem = {
            "id": f"circle_{target['id']}_{int(time.time()*1000)}",
            "type": "ellipse",
            "x": bbox.x - padding,
            "y": bbox.y - padding,
            "width": bbox.width + (2 * padding),
            "height": bbox.height + (2 * padding),
            "backgroundColor": "transparent",
            "strokeColor": color,
            "strokeWidth": stroke_width,
            "roughness": 2,  # Organic hand-drawn look
        }

        self.canvas.add_elements([circle_elem])
        self.context.register_element(circle_elem)
        return circle_elem

    def underline(
        self,
        query: str,
        color: str = "#e03131",
        stroke_width: float = 3.5,
        offset_y: float = 6.0,
    ) -> Optional[Dict[str, Any]]:
        """
        Draw an underline beneath a target word or element.
        (e.g. underlining a term like 'Inertia' or 'Friction').
        """
        self.sync_from_canvas()
        target = self.context.find(query)
        if not target:
            logger.warning(f"Cannot underline: '{query}' not found.")
            return None

        bbox = self.context.get_bbox(target)
        line_y = bbox.bottom + offset_y
        underline_elem = {
            "id": f"underline_{target['id']}_{int(time.time()*1000)}",
            "type": "line",
            "x": bbox.x - 2,
            "y": line_y,
            "points": [[0, 0], [bbox.width + 4, 0]],
            "strokeColor": color,
            "strokeWidth": stroke_width,
            "roughness": 1,
        }

        self.canvas.add_elements([underline_elem])
        self.context.register_element(underline_elem)
        return underline_elem

    def add_callout(
        self,
        query: str,
        text: str,
        position: str = "right",
        color: str = "#fff3bf",
        stroke_color: str = "#f59f00",
    ) -> List[Dict[str, Any]]:
        """Draw a sticky-note callout box with a leader line pointing to the element."""
        self.sync_from_canvas()
        target = self.context.find(query)
        if not target:
            logger.warning(f"Cannot add callout: '{query}' not found.")
            return []

        bbox = self.context.get_bbox(target)
        w, h = 220, 80
        calc_x, calc_y = self.context.calculate_relative_position(bbox, placement=position, width=w, height=h, gap=35)

        note = {
            "id": f"callout_note_{int(time.time()*1000)}",
            "type": "rectangle",
            "x": calc_x,
            "y": calc_y,
            "width": w,
            "height": h,
            "text": text,
            "backgroundColor": color,
            "strokeColor": stroke_color,
            "fontSize": 12,
        }

        # Pointer arrow
        arr_x = calc_x if position == "right" else (calc_x + w if position == "left" else calc_x + (w / 2))
        arr_y = calc_y + (h / 2) if position in ("right", "left") else (calc_y + h if position == "above" else calc_y)
        target_pt_x = bbox.right if position == "right" else (bbox.x if position == "left" else bbox.center_x)
        target_pt_y = bbox.center_y if position in ("right", "left") else (bbox.bottom if position == "below" else bbox.y)

        arrow = {
            "id": f"callout_arr_{int(time.time()*1000)}",
            "type": "arrow",
            "x": arr_x,
            "y": arr_y,
            "points": [[0, 0], [target_pt_x - arr_x, target_pt_y - arr_y]],
            "strokeColor": stroke_color,
            "strokeWidth": 2.0,
            "endArrowhead": "arrow",
        }

        self.canvas.add_elements([note, arrow])
        self.context.register_element(note)
        self.context.register_element(arrow)
        return [note, arrow]

    # =========================================================================
    # 5. ALIGN & DISTRIBUTE Operations
    # =========================================================================

    def align(self, queries: List[str], to: str = "left") -> Dict[str, Any]:
        """Align a group of elements on the canvas (e.g. left, center, right, top, bottom)."""
        self.sync_from_canvas()
        element_ids = []
        for q in queries:
            el = self.context.find(q)
            if el:
                element_ids.append(el["id"])

        if len(element_ids) < 2:
            return {"success": False, "error": "Need at least 2 valid elements to align"}

        updates = self.context.compute_alignment(element_ids, to=to)
        for eid, coords in updates.items():
            self.canvas.update_element(eid, coords)

        self.sync_from_canvas()
        return {"success": True, "aligned_ids": element_ids, "alignment": to, "updates": updates}

    def distribute(self, queries: List[str], direction: str = "horizontal", gap: Optional[float] = None) -> Dict[str, Any]:
        """Distribute a group of elements evenly across horizontal or vertical space."""
        self.sync_from_canvas()
        element_ids = []
        for q in queries:
            el = self.context.find(q)
            if el:
                element_ids.append(el["id"])

        if len(element_ids) < 2:
            return {"success": False, "error": "Need at least 2 valid elements to distribute"}

        updates = self.context.compute_distribution(element_ids, direction=direction, gap=gap)
        for eid, coords in updates.items():
            self.canvas.update_element(eid, coords)

        self.sync_from_canvas()
        return {"success": True, "distributed_ids": element_ids, "direction": direction, "updates": updates}

    # =========================================================================
    # 6. GENERATE IMAGES & EXPORTS
    # =========================================================================

    def generate_image(
        self,
        out_path: str = "whiteboard.png",
        format: str = "png",
        scale: int = 2,
        dark: bool = False,
    ) -> Dict[str, Any]:
        """Generate high-resolution PNG or SVG image export of the live whiteboard."""
        return self.canvas.export_image(out_path=out_path, format=format, scale=scale, dark=dark)

    def export_scene(self, out_path: str = "whiteboard.excalidraw") -> Dict[str, Any]:
        """Export the complete editable .excalidraw scene to disk."""
        return self.canvas.export_scene(out_path=out_path)

    # =========================================================================
    # 7. FLOWCHART & COMPREHENSIVE CONTEXT DEMONSTRATION
    # =========================================================================

    def draw_flowchart(
        self,
        flowchart_id: str,
        title: str,
        nodes: Union[List[Dict[str, Any]], List[FlowchartNodeDef]],
        edges: Optional[Union[List[Dict[str, Any]], List[FlowchartEdgeDef]]] = None,
        start_x: float = 380.0,
        start_y: float = 60.0,
    ) -> Flowchart:
        """Create and layout a structured flowchart with full context metadata."""
        node_defs = []
        for i, n in enumerate(nodes):
            if isinstance(n, FlowchartNodeDef):
                node_defs.append(n)
            else:
                node_defs.append(
                    FlowchartNodeDef(
                        node_id=n.get("id", f"{flowchart_id}_node_{i}"),
                        text=n.get("text", f"Step {i+1}"),
                        node_type=n.get("type", "process"),
                        purpose=n.get("purpose", ""),
                        width=n.get("width", 240.0),
                        height=n.get("height", 80.0),
                        bg_color=n.get("backgroundColor"),
                        stroke_color=n.get("strokeColor"),
                    )
                )

        edge_defs = []
        if edges:
            for e in edges:
                if isinstance(e, FlowchartEdgeDef):
                    edge_defs.append(e)
                else:
                    edge_defs.append(
                        FlowchartEdgeDef(
                            from_node=e["from"],
                            to_node=e["to"],
                            label=e.get("label", ""),
                            color=e.get("color", "#495057"),
                        )
                    )
        else:
            # Default sequential connection
            for i in range(len(node_defs) - 1):
                edge_defs.append(FlowchartEdgeDef(from_node=node_defs[i].id, to_node=node_defs[i + 1].id))

        fc = self.flowchart.create_flowchart(
            flowchart_id=flowchart_id,
            title=title,
            nodes=node_defs,
            edges=edge_defs,
            start_x=start_x,
            start_y=start_y,
        )
        return fc

    def highlight_flowchart_node(
        self,
        flowchart_id: str,
        node_query: Union[str, int],
        style: str = "light",
        color: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Highlight a specific node of a flowchart with exact boundary / inner text precision."""
        return self.flowchart.highlight_node(flowchart_id=flowchart_id, node_query=node_query, style=style, color=color)

    def explain_element(self, query: str) -> Dict[str, Any]:
        """
        Explain the direct context of an element answering:
        - Where is the element?
        - What is the position?
        - What are the coordinates?
        - What content is on the operation?
        - Why was this element there?
        - Is there any element placed over it?
        """
        self.sync_from_canvas()
        return self.context.explain_element(query)
