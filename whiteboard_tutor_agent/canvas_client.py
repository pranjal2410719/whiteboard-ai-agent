"""
Canvas Client for Whiteboard Tutor Agent
=========================================
Directly interfaces with the live Excalidraw Canvas server (REST API & CLI).
Provides high-level helpers for drawing diagrams, Free Body Diagrams (FBDs),
comparison tables, formula callouts, and inspecting the canvas state.
"""

import base64
import json
import logging
import os
import subprocess
import time
from typing import Any, Dict, List, Optional, Tuple
import requests

logger = logging.getLogger(__name__)


class CanvasClient:
    """Client for controlling the Excalidraw canvas server."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or os.getenv("EXPRESS_SERVER_URL") or "http://127.0.0.1:3000").rstrip("/")
        self.timeout = 10.0

    # -------------------------------------------------------------------------
    # Core Health & State
    # -------------------------------------------------------------------------

    def health(self) -> Dict[str, Any]:
        """Check if canvas server is healthy and listening."""
        try:
            r = requests.get(f"{self.base_url}/health", timeout=self.timeout)
            return r.json() if r.status_code == 200 else {"status": "unhealthy", "code": r.status_code}
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}

    def is_available(self) -> bool:
        """Returns True if the server is healthy."""
        h = self.health()
        return h.get("status") == "healthy"

    def clear(self) -> Dict[str, Any]:
        """Clear all elements from the canvas."""
        r = requests.delete(f"{self.base_url}/api/elements/clear", timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def get_elements(self) -> List[Dict[str, Any]]:
        """Fetch all elements currently present on the canvas."""
        r = requests.get(f"{self.base_url}/api/elements", timeout=self.timeout)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, dict) and "elements" in data:
            return data["elements"]
        elif isinstance(data, list):
            return data
        return []

    def get_selection(self) -> Dict[str, Any]:
        """Get selected element IDs from open canvas tabs."""
        r = requests.get(f"{self.base_url}/api/selection", timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    # -------------------------------------------------------------------------
    # Element Mutation
    # -------------------------------------------------------------------------

    def _normalize_element(self, element: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure an individual element adheres to Excalidraw schema."""
        e = dict(element)
        if "id" not in e:
            e["id"] = f"elem_{int(time.time()*1000)}"
        # Normalize text to label object for shapes if not already done
        if "text" in e and e.get("type") in ("rectangle", "ellipse", "diamond"):
            if "label" not in e:
                e["label"] = {"text": e.pop("text")}
        # Ensure arrows have x, y coordinates
        if e.get("type") == "arrow":
            e.setdefault("x", 0)
            e.setdefault("y", 0)
            if "startElementId" in e and "start" not in e:
                e["start"] = {"id": e.pop("startElementId")}
            if "endElementId" in e and "end" not in e:
                e["end"] = {"id": e.pop("endElementId")}
        return e

    def _normalize_elements(self, elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Ensure all elements adhere to Excalidraw schema."""
        return [self._normalize_element(el) for el in elements]

    def add_elements(self, elements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Batch append elements to the current canvas."""
        normalized = self._normalize_elements(elements)
        r = requests.post(f"{self.base_url}/api/elements/batch", json={"elements": normalized}, timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def replace_canvas(self, elements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Atomically overwrite canvas with provided elements."""
        normalized = self._normalize_elements(elements)
        r = requests.post(f"{self.base_url}/api/elements/sync", json={"elements": normalized}, timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def update_element(self, element_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing element by ID."""
        r = requests.put(f"{self.base_url}/api/elements/{element_id}", json=updates, timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def delete_element(self, element_id: str) -> Dict[str, Any]:
        """Delete an element by ID."""
        r = requests.delete(f"{self.base_url}/api/elements/{element_id}", timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    # -------------------------------------------------------------------------
    # Snapshots & Exports
    # -------------------------------------------------------------------------

    def save_snapshot(self, name: str) -> Dict[str, Any]:
        """Save a named checkpoint snapshot."""
        r = requests.post(f"{self.base_url}/api/snapshots", json={"name": name}, timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def restore_snapshot(self, name: str) -> Dict[str, Any]:
        """Restore a named checkpoint snapshot via CLI or restore API."""
        try:
            cmd = ["mcp-excalidraw-server", "snapshot", "restore", name]
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.loads(res.stdout) if res.stdout.strip().startswith("{") else {"success": True, "name": name}
        except Exception:
            # Fallback to GET snapshot and sync replace
            r = requests.get(f"{self.base_url}/api/snapshots/{name}", timeout=self.timeout)
            r.raise_for_status()
            snap_data = r.json()
            elems = snap_data.get("elements", [])
            return self.replace_canvas(elems)

    def describe(self) -> str:
        """Return human/AI-readable spatial description of the canvas."""
        try:
            res = subprocess.run(["mcp-excalidraw-server", "describe"], capture_output=True, text=True, check=True)
            return res.stdout.strip()
        except Exception:
            elems = self.get_elements()
            lines = [f"Total elements: {len(elems)}"]
            for el in elems:
                label = el.get("label", {}).get("text") or el.get("text") or ""
                lines.append(f" - [{el.get('id')}] {el.get('type')} at ({el.get('x')}, {el.get('y')}): {label}")
            return "\n".join(lines)

    def export_image(self, out_path: str, format: str = "png", scale: int = 2, dark: bool = False) -> Dict[str, Any]:
        """Export headless rendered PNG or SVG to disk."""
        payload = {
            "format": format,
            "scale": scale,
            "dark": dark,
            "background": True,
            "renderer": "node",
        }
        r = requests.post(f"{self.base_url}/api/export/image", json=payload, timeout=30.0)
        r.raise_for_status()
        res = r.json()
        if "data" in res:
            # Data is base64 encoded for PNG, or raw SVG text
            data_str = res["data"]
            os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
            if format.lower() == "png":
                # Strip data URL prefix if present
                if "," in data_str:
                    data_str = data_str.split(",", 1)[1]
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(data_str))
            else:
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write(data_str)
            return {"success": True, "file": out_path, "width": res.get("width"), "height": res.get("height")}
        return res

    def export_scene(self, out_path: str) -> Dict[str, Any]:
        """Export the current canvas as an .excalidraw JSON file."""
        elements = self.get_elements()
        os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
        scene = {
            "type": "excalidraw",
            "version": 2,
            "source": "https://github.com/yctimlin/mcp_excalidraw",
            "elements": elements,
            "appState": {"viewBackgroundColor": "#ffffff", "gridSize": None},
            "files": {},
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(scene, f, indent=2)
        return {"success": True, "file": out_path, "elements": len(elements)}

    # -------------------------------------------------------------------------
    # Pedagogical Drawing Helpers
    # -------------------------------------------------------------------------

    def draw_banner(
        self,
        title: str,
        subtitle: str = "",
        x: int = 280,
        y: int = 20,
        width: int = 740,
        height: int = 48,
        sync: bool = False,
    ) -> List[Dict[str, Any]]:
        """Draw a lesson header title banner."""
        elements = [
            {
                "id": f"banner_bg_{int(time.time()*1000)}",
                "type": "rectangle",
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "text": title.upper(),
                "backgroundColor": "#e7f5ff",
                "strokeColor": "#1971c2",
                "fontSize": 18,
            }
        ]
        if subtitle:
            elements.append({
                "id": f"banner_sub_{int(time.time()*1000)}",
                "type": "rectangle",
                "x": x + 10,
                "y": y + height + 6,
                "width": width - 20,
                "height": 26,
                "text": subtitle,
                "backgroundColor": "#f8f9fa",
                "strokeColor": "#adb5bd",
                "fontSize": 12,
            })
        if sync:
            self.add_elements(elements)
        return elements

    def draw_card(
        self,
        title: str = "",
        body: str = "",
        content: str = "",
        x: int = 80,
        y: int = 150,
        width: int = 380,
        height: int = 200,
        theme: str = "blue",
        element_id: Optional[str] = None,
        bg_color: Optional[str] = None,
        stroke_color: Optional[str] = None,
        font_size: int = 12,
        sync: bool = False,
    ) -> List[Dict[str, Any]]:
        """Draw an informational card / box on the whiteboard."""
        theme_map = {
            "blue": ("#e7f5ff", "#1971c2"),
            "green": ("#ebfbee", "#2b8a3e"),
            "amber": ("#fff9db", "#f59f00"),
            "red": ("#ffe3e3", "#e03131"),
            "gray": ("#f8f9fa", "#adb5bd"),
        }
        def_bg, def_stroke = theme_map.get(theme, ("#f8f9fa", "#adb5bd"))
        final_bg = bg_color or def_bg
        final_stroke = stroke_color or def_stroke

        text_content = body or content
        full_text = f"{title.upper()}\n\n{text_content}" if title and text_content else (title.upper() if title else text_content)
        elem_id = element_id or f"card_{int(time.time()*1000)}"

        elements = [
            {
                "id": elem_id,
                "type": "rectangle",
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "text": full_text,
                "backgroundColor": final_bg,
                "strokeColor": final_stroke,
                "fontSize": font_size,
            }
        ]
        if sync:
            self.add_elements(elements)
        return elements

    def draw_formula_card(
        self,
        title: str = "",
        formula: str = "",
        equation: str = "",
        breakdown: Optional[List[str]] = None,
        bullet_points: Optional[List[str]] = None,
        x: int = 100,
        y: int = 200,
        width: int = 500,
        height: int = 200,
        element_id: Optional[str] = None,
        bg_color: str = "#e7f5ff",
        stroke_color: str = "#1971c2",
        sync: bool = False,
    ) -> List[Dict[str, Any]]:
        """Draw an equation spotlight card with annotated points."""
        eq = formula or equation
        pts = breakdown or bullet_points or []
        bullets_str = "\n".join([f"• {pt}" for pt in pts])
        body_text = f"{eq}\n\n{bullets_str}" if bullets_str else eq

        return self.draw_card(
            title=title,
            body=body_text,
            x=x,
            y=y,
            width=width,
            height=height,
            element_id=element_id,
            bg_color=bg_color,
            stroke_color=stroke_color,
            sync=sync,
        )

    def draw_free_body_diagram(
        self,
        x: int = 100,
        y: int = 150,
        cx: Optional[int] = None,
        cy: Optional[int] = None,
        block_width: int = 160,
        block_height: int = 90,
        block_label: str = "Object (m)",
        mass_label: str = "Object (m)",
        forces: Optional[Dict[str, Any]] = None,
        normal_val: str = "N = mg",
        weight_val: str = "W = mg",
        applied_val: str = "Applied Force (F)",
        friction_val: str = "Friction (f = μN)",
        sync: bool = False,
    ) -> List[Dict[str, Any]]:
        """Construct a complete, calibrated Free Body Diagram with balanced vectors."""
        box_w, box_h = block_width, block_height
        label = block_label if block_label != "Object (m)" else mass_label

        if cx is not None and cy is not None:
            center_x = cx - (box_w // 2)
            center_y = cy - (box_h // 2)
            x = center_x - 180
            y = center_y - 100
        else:
            center_x = x + 180
            center_y = y + 100

        # Colors & values for forces
        c_normal = "#2f9e44"
        c_weight = "#e03131"
        c_applied = "#1971c2"
        c_friction = "#d9480f"

        if forces:
            if "up" in forces:
                val = forces["up"]
                normal_val, c_normal = val if isinstance(val, (list, tuple)) else (val, c_normal)
            if "down" in forces:
                val = forces["down"]
                weight_val, c_weight = val if isinstance(val, (list, tuple)) else (val, c_weight)
            if "right" in forces:
                val = forces["right"]
                applied_val, c_applied = val if isinstance(val, (list, tuple)) else (val, c_applied)
            if "left" in forces:
                val = forces["left"]
                friction_val, c_friction = val if isinstance(val, (list, tuple)) else (val, c_friction)

        elements = [
            # Background zone
            {
                "id": f"fbd_zone_{int(time.time()*1000)}",
                "type": "rectangle",
                "x": x,
                "y": y,
                "width": 520,
                "height": 260,
                "backgroundColor": "#fff9db",
                "strokeColor": "#fab005",
            },
            # Ground line
            {
                "id": f"fbd_ground_{int(time.time()*1000)}",
                "type": "rectangle",
                "x": x + 30,
                "y": center_y + box_h,
                "width": 460,
                "height": 12,
                "text": "Contact Surface",
                "backgroundColor": "#adb5bd",
                "strokeColor": "#495057",
                "fontSize": 11,
            },
            # Main central mass
            {
                "id": "fbd_block",
                "type": "rectangle",
                "x": center_x,
                "y": center_y,
                "width": box_w,
                "height": box_h,
                "text": label,
                "backgroundColor": "#a5d8ff",
                "strokeColor": "#1971c2",
                "fontSize": 14,
            },
            # Upward Normal Vector
            {
                "id": "fbd_arr_normal",
                "type": "arrow",
                "x": center_x + (box_w // 2),
                "y": center_y,
                "points": [[0, 0], [0, -55]],
                "strokeColor": c_normal,
                "strokeWidth": 2.5,
                "endArrowhead": "arrow",
            },
            {
                "id": "fbd_lbl_normal",
                "type": "rectangle",
                "x": center_x + 10,
                "y": center_y - 75,
                "width": 140,
                "height": 28,
                "text": normal_val,
                "backgroundColor": "#d3f9d8",
                "strokeColor": c_normal,
                "fontSize": 12,
            },
            # Downward Gravity Vector
            {
                "id": "fbd_arr_weight",
                "type": "arrow",
                "x": center_x + (box_w // 2),
                "y": center_y + box_h,
                "points": [[0, 0], [0, 55]],
                "strokeColor": c_weight,
                "strokeWidth": 2.5,
                "endArrowhead": "arrow",
            },
            {
                "id": "fbd_lbl_weight",
                "type": "rectangle",
                "x": center_x + 10,
                "y": center_y + box_h + 35,
                "width": 140,
                "height": 28,
                "text": weight_val,
                "backgroundColor": "#ffe3e3",
                "strokeColor": c_weight,
                "fontSize": 12,
            },
            # Forward Applied Force
            {
                "id": "fbd_arr_applied",
                "type": "arrow",
                "x": center_x + box_w,
                "y": center_y + (box_h // 2),
                "points": [[0, 0], [60, 0]],
                "strokeColor": c_applied,
                "strokeWidth": 2.5,
                "endArrowhead": "arrow",
            },
            {
                "id": "fbd_lbl_applied",
                "type": "rectangle",
                "x": center_x + box_w + 40,
                "y": center_y + (box_h // 2) - 15,
                "width": 140,
                "height": 30,
                "text": applied_val,
                "backgroundColor": "#d0ebff",
                "strokeColor": c_applied,
                "fontSize": 11,
            },
            # Opposing Friction Vector
            {
                "id": "fbd_arr_fric",
                "type": "arrow",
                "x": center_x,
                "y": center_y + box_h,
                "points": [[0, 0], [-60, 0]],
                "strokeColor": c_friction,
                "strokeWidth": 2.5,
                "endArrowhead": "arrow",
            },
            {
                "id": "fbd_lbl_fric",
                "type": "rectangle",
                "x": center_x - 175,
                "y": center_y + box_h - 20,
                "width": 150,
                "height": 32,
                "text": friction_val,
                "backgroundColor": "#ffe8cc",
                "strokeColor": c_friction,
                "fontSize": 11,
            },
        ]
        if sync:
            self.add_elements(elements)
        return elements
