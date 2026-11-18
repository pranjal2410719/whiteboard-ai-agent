"""Unit and Integration Tests for CanvasClient."""

import unittest
from unittest.mock import MagicMock, patch

from whiteboard_tutor_agent.canvas_client import CanvasClient


class TestCanvasClient(unittest.TestCase):
    def setUp(self):
        self.client = CanvasClient(base_url="http://127.0.0.1:3000")

    def test_normalize_shape_element(self):
        raw = {
            "type": "rectangle",
            "x": 100,
            "y": 200,
            "width": 300,
            "height": 150,
            "text": "Core Concept",
            "backgroundColor": "#e7f5ff",
            "strokeColor": "#1971c2",
        }
        normalized = self.client._normalize_element(raw)
        self.assertEqual(normalized["type"], "rectangle")
        self.assertEqual(normalized["x"], 100)
        self.assertEqual(normalized["y"], 200)
        self.assertEqual(normalized["width"], 300)
        self.assertEqual(normalized["height"], 150)
        self.assertIn("id", normalized)
        # Verify label format for excalidraw
        self.assertEqual(normalized["label"]["text"], "Core Concept")

    def test_normalize_arrow_element(self):
        raw = {
            "type": "arrow",
            "points": [[0, 0], [120, 0]],
            "strokeColor": "#e03131",
            "strokeWidth": 3,
        }
        normalized = self.client._normalize_element(raw)
        self.assertEqual(normalized["type"], "arrow")
        self.assertEqual(normalized["x"], 0)
        self.assertEqual(normalized["y"], 0)
        self.assertEqual(normalized["points"], [[0, 0], [120, 0]])

    def test_draw_banner(self):
        banner = self.client.draw_banner("Class 10 Physics: Friction", "Subheading test", x=50, y=30)
        self.assertGreaterEqual(len(banner), 2)
        bg = banner[0]
        self.assertEqual(bg["type"], "rectangle")
        self.assertEqual(bg["x"], 50)
        self.assertEqual(bg["y"], 30)
        self.assertIn("FRICTION", bg["text"])

    def test_draw_card(self):
        card = self.client.draw_card(
            title="Static Friction",
            body="Self-adjusting opposing force before motion begins.",
            x=80,
            y=150,
            width=380,
            height=200,
            theme="blue",
        )
        self.assertGreaterEqual(len(card), 1)
        box = card[0]
        self.assertEqual(box["backgroundColor"], "#e7f5ff")
        self.assertEqual(box["strokeColor"], "#1971c2")

    def test_draw_formula_card(self):
        formula = self.client.draw_formula_card(
            title="Coulomb's Law of Friction",
            formula="f_s(max) = μ_s · N",
            breakdown=["f_s: maximum static friction force", "μ_s: coefficient of static friction", "N: normal reaction force (N = mg)"],
            x=100,
            y=200,
        )
        self.assertGreaterEqual(len(formula), 1)
        box = formula[0]
        self.assertIn("μ_s", box["text"])

    def test_draw_free_body_diagram(self):
        fbd = self.client.draw_free_body_diagram(
            cx=400,
            cy=300,
            block_width=180,
            block_height=100,
            block_label="Block (m)",
            forces={
                "up": ("Normal Force N", "#1971c2"),
                "down": ("Gravity W = mg", "#2b8a3e"),
                "left": ("Friction f", "#e03131"),
                "right": ("Applied Force F", "#f08c00"),
            },
        )
        # Should have surface + block + arrows + force labels
        types = [e["type"] for e in fbd]
        self.assertIn("rectangle", types)
        self.assertIn("arrow", types)

    @patch("requests.get")
    def test_health_mock_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"status": "ok", "elements": 12}
        mock_get.return_value = mock_resp

        res = self.client.health()
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["elements"], 12)


if __name__ == "__main__":
    unittest.main()
