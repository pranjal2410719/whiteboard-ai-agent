"""Unit tests for Whiteboard Tutor Agent REST API Server."""

import json
import threading
import time
import unittest
from urllib.request import Request, urlopen

from whiteboard_tutor_agent.server import TutorRequestHandler, run_server
from whiteboard_tutor_agent.tutor_agent import WhiteboardTutorAgent


class TestTutorServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Run a test server instance on a test port
        cls.test_port = 8899
        cls.server_thread = threading.Thread(
            target=run_server,
            kwargs={"port": cls.test_port, "host": "127.0.0.1", "canvas_url": "http://127.0.0.1:3000"},
            daemon=True,
        )
        cls.server_thread.start()
        time.sleep(0.3)  # Allow server to bind

    def _get(self, path: str):
        url = f"http://127.0.0.1:{self.test_port}{path}"
        req = Request(url, method="GET")
        with urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def _post(self, path: str, data: dict):
        url = f"http://127.0.0.1:{self.test_port}{path}"
        payload = json.dumps(data).encode("utf-8")
        req = Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def test_health_endpoint(self):
        status, data = self._get("/health")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "whiteboard_tutor_agent")

    def test_topics_endpoint(self):
        status, data = self._get("/api/topics")
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])
        topic_ids = [t["id"] for t in data["topics"]]
        self.assertIn("friction", topic_ids)
        self.assertIn("gravitation", topic_ids)

    def test_topic_details_endpoint(self):
        status, data = self._get("/api/topic/friction")
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])
        self.assertEqual(data["topic"]["id"], "friction")

    def test_lesson_flow(self):
        # Start lesson
        status, start_res = self._post("/api/lesson/start", {"topic": "friction"})
        self.assertEqual(status, 200)
        self.assertTrue(start_res["success"])
        self.assertEqual(start_res["step_number"], 1)

        # Answer question
        status, ans_res = self._post("/api/lesson/input", {"input": "Microscopic irregularities and interlocking rough surfaces."})
        self.assertEqual(status, 200)
        self.assertTrue(ans_res["success"])
        self.assertEqual(ans_res["evaluated"], "CORRECT")


if __name__ == "__main__":
    unittest.main()
