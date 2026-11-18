"""
Flowchart Manager & Interactive Demonstration Engine
===================================================
Manages complete flowchart lifecycles on the whiteboard:
1. Automated layout generation for algorithm and physics process flowcharts.
2. Comprehensive semantic tracking for every node:
   - Where the node is
   - Which coordinate of the node
   - Where the text inside the node is
   - What the boundaries of the node are
   - Why was this node there (purpose/role)
   - Is there any element placed over it (annotations/overlays)
3. Precision highlighting and demonstration:
   - Underline exact inner text
   - Circle the node boundary
   - Light up with translucent backdrop
   - Spotlight with directional attention pointer
   - Step-by-step flowchart execution walk-through
"""

import logging
import time
from typing import Any, Dict, List, Optional, Tuple, Union

from .canvas_client import CanvasClient
from .semantic_element import InnerTextBounds, SemanticElement
from .spatial_context import BoundingBox, SpatialContext

logger = logging.getLogger(__name__)


class FlowchartNodeDef:
    """Definition for a node in a flowchart."""

    def __init__(
        self,
        node_id: str,
        text: str,
        node_type: str = "process",  # 'start', 'process', 'decision', 'end'
        purpose: str = "",
        width: float = 240.0,
        height: float = 80.0,
        bg_color: Optional[str] = None,
        stroke_color: Optional[str] = None,
    ):
        self.id = node_id
        self.text = text
        self.node_type = node_type
        self.purpose = purpose or f"Flowchart {node_type} step: {text}"
        self.width = width
        self.height = height

        # Default pedagogical color schemes
        colors = {
            "start": ("#d3f9d8", "#2b8a3e"),     # Green pill
            "end": ("#ffe3e3", "#e03131"),       # Red pill
            "process": ("#e7f5ff", "#1971c2"),   # Blue rectangle
            "decision": ("#fff9db", "#f59f00"),  # Yellow diamond
        }
        def_bg, def_stroke = colors.get(node_type, ("#f8f9fa", "#adb5bd"))
        self.bg_color = bg_color or def_bg
        self.stroke_color = stroke_color or def_stroke


class FlowchartEdgeDef:
    """Directed connection between two flowchart nodes."""

    def __init__(self, from_node: str, to_node: str, label: str = "", color: str = "#495057"):
        self.from_node = from_node
        self.to_node = to_node
        self.label = label
        self.color = color


class Flowchart:
    """Represents a fully laid out flowchart entity on the canvas."""

    def __init__(self, flowchart_id: str, title: str, description: str = ""):
        self.id = flowchart_id
        self.title = title
        self.description = description
        self.node_ids: List[str] = []
        self.edge_ids: List[str] = []
        self.bounds: Optional[BoundingBox] = None


class FlowchartManager:
    """Engine for creating, tracking, and annotating flowcharts on the whiteboard."""

    def __init__(self, canvas_client: Optional[CanvasClient] = None, context: Optional[SpatialContext] = None):
        self.canvas = canvas_client or CanvasClient()
        self.context = context or SpatialContext()
        self.flowcharts: Dict[str, Flowchart] = {}

    # -------------------------------------------------------------------------
    # Flowchart Generation & Layout
    # -------------------------------------------------------------------------

    def create_flowchart(
        self,
        flowchart_id: str,
        title: str,
        nodes: List[FlowchartNodeDef],
        edges: List[FlowchartEdgeDef],
        start_x: float = 380.0,
        start_y: float = 60.0,
        vertical_gap: float = 50.0,
    ) -> Flowchart:
        """
        Build, layout, and draw a complete flowchart onto the whiteboard.
        Registers every node in the SpatialContext with full semantic metadata.
        """
        fc = Flowchart(flowchart_id, title)
        canvas_elements: List[Dict[str, Any]] = []

        # 1. Flowchart Header Banner
        banner_w = 640.0
        banner_h = 42.0
        banner_elem = {
            "id": f"{flowchart_id}_banner",
            "type": "rectangle",
            "x": start_x - 100.0,
            "y": start_y,
            "width": banner_w,
            "height": banner_h,
            "text": f"FLOWCHART: {title.upper()}",
            "backgroundColor": "#f8f9fa",
            "strokeColor": "#343a40",
            "fontSize": 15,
        }
        canvas_elements.append(banner_elem)
        current_y = start_y + banner_h + 35.0

        # 2. Node Placement Layout
        node_positions: Dict[str, Tuple[float, float, float, float]] = {}

        for idx, node_def in enumerate(nodes):
            shape_type = "diamond" if node_def.node_type == "decision" else "rectangle"
            node_x = start_x + 100.0 - (node_def.width / 2.0)
            node_y = current_y

            node_elem = {
                "id": node_def.id,
                "type": shape_type,
                "x": node_x,
                "y": node_y,
                "width": node_def.width,
                "height": node_def.height,
                "text": node_def.text,
                "backgroundColor": node_def.bg_color,
                "strokeColor": node_def.stroke_color,
                "strokeWidth": 2.0,
                "fontSize": 13,
            }
            if node_def.node_type in ("start", "end"):
                node_elem["roundness"] = {"type": 3}  # Pill shape

            canvas_elements.append(node_elem)
            fc.node_ids.append(node_def.id)
            node_positions[node_def.id] = (node_x, node_y, node_def.width, node_def.height)

            # Register as SemanticElement in SpatialContext
            sem_el = SemanticElement(
                element_id=node_def.id,
                element_type=shape_type,
                x=node_x,
                y=node_y,
                width=node_def.width,
                height=node_def.height,
                content=node_def.text,
                role=f"flowchart_{node_def.node_type}_node",
                purpose=node_def.purpose,
                parent_id=flowchart_id,
                sequence_index=idx,
                raw_data=node_elem,
            )
            self.context.register_semantic_element(sem_el)

            current_y += node_def.height + vertical_gap

        # 3. Directed Edge Connectors
        for e_idx, edge_def in enumerate(edges):
            if edge_def.from_node not in node_positions or edge_def.to_node not in node_positions:
                continue

            x1, y1, w1, h1 = node_positions[edge_def.from_node]
            x2, y2, w2, h2 = node_positions[edge_def.to_node]

            start_pt = (x1 + (w1 / 2.0), y1 + h1)
            end_pt = (x2 + (w2 / 2.0), y2)
            dx = end_pt[0] - start_pt[0]
            dy = end_pt[1] - start_pt[1]

            edge_id = f"{flowchart_id}_edge_{e_idx}"
            arrow_elem = {
                "id": edge_id,
                "type": "arrow",
                "x": start_pt[0],
                "y": start_pt[1],
                "points": [[0, 0], [dx, dy]],
                "strokeColor": edge_def.color,
                "strokeWidth": 2.0,
                "endArrowhead": "arrow",
                "start": {"id": edge_def.from_node},
                "end": {"id": edge_def.to_node},
            }
            if edge_def.label:
                arrow_elem["label"] = {"text": edge_def.label}

            canvas_elements.append(arrow_elem)
            fc.edge_ids.append(edge_id)

        # 4. Sync elements to live canvas
        self.canvas.add_elements(canvas_elements)
        self.context.add_elements(canvas_elements)

        # Calculate bounding box of entire flowchart
        all_xs = [el["x"] for el in canvas_elements]
        all_ys = [el["y"] for el in canvas_elements]
        all_rights = [el["x"] + el.get("width", 0) for el in canvas_elements]
        all_bottoms = [el["y"] + el.get("height", 0) for el in canvas_elements]
        fc.bounds = BoundingBox(
            x=min(all_xs),
            y=min(all_ys),
            width=max(all_rights) - min(all_xs),
            height=max(all_bottoms) - min(all_ys),
        )

        self.flowcharts[flowchart_id] = fc
        return fc

    # -------------------------------------------------------------------------
    # Context Retrieval for Flowchart & Nodes
    # -------------------------------------------------------------------------

    def get_flowchart(self, flowchart_id: str) -> Optional[Flowchart]:
        """Retrieve a flowchart by ID."""
        return self.flowcharts.get(flowchart_id)

    def get_first_node(self, flowchart_id: str) -> Optional[SemanticElement]:
        """Get the first (root/start) node of a flowchart with complete context."""
        fc = self.get_flowchart(flowchart_id)
        if not fc or not fc.node_ids:
            return None
        first_id = fc.node_ids[0]
        return self.context.get_semantic_element(first_id)

    def get_node(self, flowchart_id: str, node_query: Union[str, int]) -> Optional[SemanticElement]:
        """Retrieve a specific node by index (0, 1, ...), role ('start', 'decision'), or text."""
        fc = self.get_flowchart(flowchart_id)
        if not fc:
            return None

        # By integer index
        if isinstance(node_query, int):
            if 0 <= node_query < len(fc.node_ids):
                return self.context.get_semantic_element(fc.node_ids[node_query])
            return None

        q = str(node_query).strip().lower()
        if q in ("first", "start", "root", "initial"):
            return self.get_first_node(flowchart_id)
        if q in ("last", "end", "terminal"):
            return self.context.get_semantic_element(fc.node_ids[-1])

        # By ID
        if node_query in fc.node_ids:
            return self.context.get_semantic_element(node_query)

        # By text or role search
        for nid in fc.node_ids:
            sem = self.context.get_semantic_element(nid)
            if sem:
                if q in sem.content.lower() or q in sem.role.lower():
                    return sem

        return None

    def inspect_flowchart_context(self, flowchart_id: str) -> Dict[str, Any]:
        """
        Inspect complete context of a flowchart and its nodes:
        - Where is the flowchart?
        - What are its elements?
        - Where are the elements exactly placed?
        - What are the coordinates?
        - Is there any element placed over it?
        """
        fc = self.get_flowchart(flowchart_id)
        if not fc:
            return {"success": False, "error": f"Flowchart '{flowchart_id}' not found."}

        node_contexts = []
        for idx, nid in enumerate(fc.node_ids):
            sem = self.context.get_semantic_element(nid)
            if sem:
                node_contexts.append(sem.explain_context())

        return {
            "success": True,
            "flowchart_id": fc.id,
            "title": fc.title,
            "where_is_flowchart": {
                "bounds": {
                    "x": fc.bounds.x if fc.bounds else 0,
                    "y": fc.bounds.y if fc.bounds else 0,
                    "width": fc.bounds.width if fc.bounds else 0,
                    "height": fc.bounds.height if fc.bounds else 0,
                },
                "total_nodes": len(fc.node_ids),
                "total_connectors": len(fc.edge_ids),
            },
            "nodes": node_contexts,
        }

    # -------------------------------------------------------------------------
    # Precision Highlighting & Demonstration
    # -------------------------------------------------------------------------

    def highlight_node(
        self,
        flowchart_id: str,
        node_query: Union[str, int],
        style: str = "light",  # 'light', 'circle', 'underline', 'spotlight', 'all'
        color: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Highlight a node with precision geometry based on its exact boundaries
        and inner text coordinates:
        - 'light': translucent highlight backdrop behind the node
        - 'circle': organic red circle around the node boundaries
        - 'underline': underline beneath the exact inner text of the node
        - 'spotlight': highlight + directional attention arrow
        """
        sem = self.get_node(flowchart_id, node_query)
        if not sem:
            return {"success": False, "error": f"Node '{node_query}' not found in flowchart '{flowchart_id}'"}

        style = style.lower()
        created_elements: List[Dict[str, Any]] = []

        # 1. UNDERLINE (Placed directly under the inner text bounds)
        if style in ("underline", "all"):
            tb = sem.text_bounds
            c_color = color or "#fab005"
            line_y = (tb.bottom + 4) if tb else (sem.bottom - 8)
            line_x = tb.x if tb else sem.x + 10
            line_w = tb.width if tb else sem.width - 20

            und_elem = {
                "id": f"und_{sem.id}_{int(time.time()*1000)}",
                "type": "line",
                "x": line_x,
                "y": line_y,
                "points": [[0, 0], [line_w, 0]],
                "strokeColor": c_color,
                "strokeWidth": 3.5,
                "roughness": 1,
            }
            created_elements.append(und_elem)
            sem.attached_annotations.append(und_elem["id"])

        # 2. CIRCLE (Placed around outer node boundaries)
        if style in ("circle", "all"):
            c_color = color or "#e03131"
            pad = 12.0
            circ_elem = {
                "id": f"circ_{sem.id}_{int(time.time()*1000)}",
                "type": "ellipse",
                "x": sem.x - pad,
                "y": sem.y - pad,
                "width": sem.width + (2 * pad),
                "height": sem.height + (2 * pad),
                "backgroundColor": "transparent",
                "strokeColor": c_color,
                "strokeWidth": 2.5,
                "roughness": 2,
            }
            created_elements.append(circ_elem)
            sem.attached_annotations.append(circ_elem["id"])

        # 3. LIGHT / HALO (Translucent backdrop covering boundaries)
        if style in ("light", "all"):
            c_color = color or "#fff3bf"
            pad = 8.0
            light_elem = {
                "id": f"light_{sem.id}_{int(time.time()*1000)}",
                "type": "rectangle",
                "x": sem.x - pad,
                "y": sem.y - pad,
                "width": sem.width + (2 * pad),
                "height": sem.height + (2 * pad),
                "backgroundColor": c_color,
                "strokeColor": "#fab005",
                "strokeWidth": 1.5,
                "opacity": 40,
                "roughness": 0,
            }
            created_elements.append(light_elem)
            sem.attached_annotations.append(light_elem["id"])

        # 4. SPOTLIGHT (Highlight + Attention pointer arrow)
        if style == "spotlight":
            c_color = color or "#fff3bf"
            # Backdrop
            pad = 8.0
            light_elem = {
                "id": f"light_{sem.id}_{int(time.time()*1000)}",
                "type": "rectangle",
                "x": sem.x - pad,
                "y": sem.y - pad,
                "width": sem.width + (2 * pad),
                "height": sem.height + (2 * pad),
                "backgroundColor": c_color,
                "strokeColor": "#fab005",
                "strokeWidth": 1.5,
                "opacity": 40,
            }
            # Pointer Arrow
            arrow_elem = {
                "id": f"spot_arr_{sem.id}_{int(time.time()*1000)}",
                "type": "arrow",
                "x": sem.right + 45.0,
                "y": sem.center_y,
                "points": [[0, 0], [-35.0, 0]],
                "strokeColor": "#e03131",
                "strokeWidth": 3.0,
                "endArrowhead": "arrow",
            }
            # Attention Label Box
            lbl_elem = {
                "id": f"spot_lbl_{sem.id}_{int(time.time()*1000)}",
                "type": "rectangle",
                "x": sem.right + 50.0,
                "y": sem.center_y - 18.0,
                "width": 120.0,
                "height": 36.0,
                "text": "CURRENT STEP",
                "backgroundColor": "#ffe3e3",
                "strokeColor": "#e03131",
                "fontSize": 12,
            }
            created_elements.extend([light_elem, arrow_elem, lbl_elem])
            for el in (light_elem, arrow_elem, lbl_elem):
                sem.attached_annotations.append(el["id"])

        # Add to canvas and update context
        if created_elements:
            self.canvas.add_elements(created_elements)
            self.context.add_elements(created_elements)

        return {
            "success": True,
            "flowchart_id": flowchart_id,
            "node_id": sem.id,
            "node_role": sem.role,
            "node_purpose": sem.purpose,
            "style_applied": style,
            "boundaries": sem.boundaries,
            "inner_text_coordinates": sem.text_bounds.to_dict() if sem.text_bounds else None,
            "created_annotations": [e["id"] for e in created_elements],
        }

    def clear_node_highlights(self, flowchart_id: str, node_query: Union[str, int]) -> int:
        """Remove all active annotations/overlays covering a specific node."""
        sem = self.get_node(flowchart_id, node_query)
        if not sem or not sem.attached_annotations:
            return 0

        cleared_count = 0
        for ann_id in list(sem.attached_annotations):
            try:
                self.canvas.delete_element(ann_id)
                self.context.remove_element(ann_id)
                sem.attached_annotations.remove(ann_id)
                cleared_count += 1
            except Exception as e:
                logger.warning(f"Failed to delete annotation {ann_id}: {e}")
        return cleared_count
