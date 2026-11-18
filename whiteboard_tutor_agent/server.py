#!/usr/bin/env python3
"""
Whiteboard Tutor Agent - HTTP REST API Server
============================================
Lightweight REST API service built with Python standard library http.server.
Allows external frontends, web apps, and microservices to drive the AI Whiteboard
Tutor, receive interactive step narrations, and synchronize Excalidraw canvases.
"""

import json
import logging
import os
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict
from urllib.parse import parse_qs, urlparse

from .curriculum import Curriculum
from .tutor_agent import WhiteboardTutorAgent

logger = logging.getLogger("whiteboard_tutor_agent.server")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


class TutorRequestHandler(BaseHTTPRequestHandler):
    agent: WhiteboardTutorAgent = None  # Class-level shared agent instance
    curriculum: Curriculum = None

    def _send_json(self, data: Any, status: int = HTTPStatus.OK):
        try:
            body = json.dumps(data, indent=2).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            logger.error(f"Error sending response: {e}")

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def _read_json_body(self) -> Dict[str, Any]:
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                return {}
            raw = self.rfile.read(length).decode("utf-8")
            return json.loads(raw)
        except Exception as e:
            logger.warning(f"Failed to parse JSON body: {e}")
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path in ("", "/health"):
            canvas_health = self.agent.canvas.health()
            self._send_json({
                "status": "healthy",
                "service": "whiteboard_tutor_agent",
                "canvas_server": canvas_health,
                "current_topic": self.agent.current_topic.id if self.agent.current_topic else None,
                "current_step": self.agent.current_step_idx + 1 if self.agent.current_topic else None,
            })
            return

        if path == "/api/topics":
            topics = self.curriculum.list_topics()
            self._send_json({"success": True, "topics": topics})
            return

        if path.startswith("/api/topic/"):
            topic_id = path[len("/api/topic/") :]
            topic = self.curriculum.get_topic(topic_id)
            if not topic:
                self._send_json({"success": False, "error": f"Topic '{topic_id}' not found."}, status=HTTPStatus.NOT_FOUND)
                return
            self._send_json({
                "success": True,
                "topic": {
                    "id": topic.id,
                    "title": topic.title,
                    "grade_level": topic.grade_level,
                    "step_count": len(topic.steps),
                    "steps": [
                        {
                            "step_number": s.step_number,
                            "title": s.title,
                            "narration": s.narration,
                            "checkpoint_question": s.checkpoint_question,
                        }
                        for s in topic.steps
                    ],
                },
            })
            return

        if path == "/api/lesson/status":
            status = self.agent.get_board_status()
            self._send_json({"success": True, "status": status})
            return

        self._send_json({"error": f"Endpoint not found: {self.path}"}, status=HTTPStatus.NOT_FOUND)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = self._read_json_body()

        if path == "/api/lesson/start":
            topic_id = body.get("topic") or body.get("topic_id", "friction")
            res = self.agent.start_lesson(topic_id)
            status = HTTPStatus.OK if res.get("success") else HTTPStatus.BAD_REQUEST
            self._send_json(res, status=status)
            return

        if path == "/api/lesson/input":
            user_input = body.get("input") or body.get("text") or body.get("message", "")
            if not user_input:
                self._send_json({"success": False, "error": "Missing 'input' field in request body."}, status=HTTPStatus.BAD_REQUEST)
                return
            res = self.agent.handle_input(user_input)
            self._send_json(res)
            return

        if path == "/api/lesson/advance":
            force = body.get("force", True)
            res = self.agent.advance_step(force=force)
            self._send_json(res)
            return

        if path == "/api/lesson/previous":
            res = self.agent.previous_step()
            self._send_json(res)
            return

        if path == "/api/lesson/export":
            out_dir = body.get("out_dir", "/tmp/whiteboard_tutor_export")
            res = self.agent.export_lesson(out_dir=out_dir)
            self._send_json(res)
            return

        if path == "/api/canvas/clear":
            res = self.agent.canvas.clear()
            self._send_json(res)
            return

        if path == "/api/canvas/elements":
            elements = body.get("elements", [])
            res = self.agent.canvas.add_elements(elements)
            self._send_json(res)
            return

        # Direct Whiteboard Operations & Spatial Tools
        if path == "/api/ops/action":
            action_str = body.get("action") or body.get("command", "")
            res = self.agent.try_execute_action(action_str)
            if res is not None:
                self._send_json(res)
            else:
                self._send_json({"success": False, "error": f"Unknown action: {action_str}"}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/ops/circle":
            target = body.get("target", "last")
            color = body.get("color", "#e03131")
            elem = self.agent.ops.circle(target, color=color)
            self._send_json({"success": bool(elem), "element": elem})
            return

        if path == "/api/ops/underline":
            target = body.get("target", "last")
            color = body.get("color", "#fab005")
            elem = self.agent.ops.underline(target, color=color)
            self._send_json({"success": bool(elem), "element": elem})
            return

        if path == "/api/ops/light":
            target = body.get("target", "last")
            color = body.get("color", "#fff3bf")
            style = body.get("style", "backdrop")
            elem = self.agent.ops.light(target, color=color, style=style)
            self._send_json({"success": bool(elem), "element": elem})
            return

        if path == "/api/ops/erase":
            target = body.get("target", "last")
            ok = self.agent.ops.erase(target)
            self._send_json({"success": ok, "target": target})
            return

        if path == "/api/ops/callout":
            target = body.get("target", "last")
            text = body.get("text", "Note")
            elems = self.agent.ops.add_callout(target, text)
            self._send_json({"success": bool(elems), "elements": elems})
            return

        if path == "/api/ops/draw_relative":
            ref = body.get("reference", "last")
            placement = body.get("placement", "below")
            text = body.get("text", "")
            shape_type = body.get("type", "rectangle")
            elem = self.agent.ops.draw_relative(reference_query=ref, placement=placement, text=text, shape_type=shape_type)
            self._send_json({"success": bool(elem), "element": elem})
            return

        if path == "/api/ops/align":
            targets = body.get("targets", [])
            to = body.get("to", "left")
            res = self.agent.ops.align(targets, to=to)
            self._send_json(res)
            return

        if path == "/api/ops/distribute":
            targets = body.get("targets", [])
            direction = body.get("direction", "horizontal")
            res = self.agent.ops.distribute(targets, direction=direction)
            self._send_json(res)
            return

        self._send_json({"error": f"Endpoint not found: {self.path}"}, status=HTTPStatus.NOT_FOUND)


def run_server(port: int = 8080, canvas_url: str = None, host: str = "127.0.0.1"):
    agent = WhiteboardTutorAgent(canvas_url=canvas_url)
    curriculum = Curriculum()

    TutorRequestHandler.agent = agent
    TutorRequestHandler.curriculum = curriculum

    server_address = (host, port)
    httpd = HTTPServer(server_address, TutorRequestHandler)
    logger.info(f"AI Whiteboard Tutor Server running at http://{host}:{port}/")
    logger.info(f"Targeting Excalidraw canvas at {agent.canvas.base_url}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down Whiteboard Tutor Server.")
        httpd.server_close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run the AI Whiteboard Tutor REST Server")
    parser.add_argument("--port", type=int, default=8080, help="Port to listen on (default: 8080)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--canvas-url", type=str, default=None, help="Canvas base URL (default: http://127.0.0.1:3000)")
    args = parser.parse_args()

    run_server(port=args.port, host=args.host, canvas_url=args.canvas_url)
