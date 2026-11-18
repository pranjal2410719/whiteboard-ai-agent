"""Unit tests for WhiteboardOperations suite."""

import unittest
from unittest.mock import MagicMock

from whiteboard_tutor_agent.spatial_context import SpatialContext
from whiteboard_tutor_agent.whiteboard_ops import WhiteboardOperations


class TestWhiteboardOperations(unittest.TestCase):
    def setUp(self):
        self.mock_canvas = MagicMock()
        self.mock_canvas.get_elements.return_value = [
            {"id": "formula_box", "type": "rectangle", "x": 100, "y": 100, "width": 400, "height": 120, "text": "F = m * a"},
            {"id": "note_box", "type": "rectangle", "x": 550, "y": 100, "width": 200, "height": 120, "text": "Newton 2nd Law"},
        ]
        self.mock_canvas.add_elements.return_value = {"status": "ok"}
        self.mock_canvas.update_element.return_value = {"status": "ok"}
        self.mock_canvas.delete_element.return_value = {"status": "ok"}
        self.mock_canvas.export_image.return_value = {"file": "/tmp/test.png"}

        self.context = SpatialContext()
        self.ops = WhiteboardOperations(canvas_client=self.mock_canvas, context=self.context)

    def test_draw_shape(self):
        shape = self.ops.draw_shape(shape_type="rectangle", x=50, y=50, width=150, height=80, text="Force Definition")
        self.assertEqual(shape["type"], "rectangle")
        self.assertEqual(shape["width"], 150)
        self.mock_canvas.add_elements.assert_called()

    def test_draw_relative_below(self):
        # Draw new element under formula_box
        new_el = self.ops.draw_relative(
            reference_query="formula_box",
            shape_type="ellipse",
            placement="below",
            width=200,
            height=100,
            text="Acceleration a",
        )
        self.assertEqual(new_el["type"], "ellipse")
        # formula_box y=100, height=120, gap=25 -> 245
        self.assertEqual(new_el["y"], 245)

    def test_draw_arrow_between_elements(self):
        arrow = self.ops.draw_arrow("formula_box", "note_box", label="governs")
        self.assertIsNotNone(arrow)
        self.assertEqual(arrow["type"], "arrow")
        self.assertEqual(arrow["start"]["id"], "formula_box")
        self.assertEqual(arrow["end"]["id"], "note_box")

    def test_erase_element(self):
        ok = self.ops.erase("formula_box")
        self.assertTrue(ok)
        self.mock_canvas.delete_element.assert_called_with("formula_box")

    def test_light_element(self):
        light_el = self.ops.light("formula_box", color="#fff3bf")
        self.assertIsNotNone(light_el)
        self.assertEqual(light_el["type"], "rectangle")
        self.assertIn("light_", light_el["id"])
        self.assertEqual(light_el["backgroundColor"], "#fff3bf")

    def test_spotlight_element(self):
        elems = self.ops.spotlight("formula_box", label="IMPORTANT")
        self.assertEqual(len(elems), 3)  # light backdrop + pointer box + arrow

    def test_circle_element(self):
        circle_el = self.ops.circle("formula_box", color="#e03131")
        self.assertIsNotNone(circle_el)
        self.assertEqual(circle_el["type"], "ellipse")
        self.assertEqual(circle_el["strokeColor"], "#e03131")

    def test_underline_element(self):
        line_el = self.ops.underline("formula_box", color="#fab005")
        self.assertIsNotNone(line_el)
        self.assertEqual(line_el["type"], "line")
        self.assertEqual(line_el["strokeColor"], "#fab005")
        # Placed below bottom of formula_box (100 + 120 + 6 = 226)
        self.assertEqual(line_el["y"], 226)

    def test_add_callout(self):
        callout_elems = self.ops.add_callout("formula_box", "Remember SI units: kg*m/s^2")
        self.assertEqual(len(callout_elems), 2)  # note card + arrow

    def test_align_elements(self):
        res = self.ops.align(["formula_box", "note_box"], to="top")
        self.assertTrue(res["success"])
        self.mock_canvas.update_element.assert_called()

    def test_distribute_elements(self):
        res = self.ops.distribute(["formula_box", "note_box"], direction="horizontal")
        self.assertTrue(res["success"])

    def test_generate_image(self):
        res = self.ops.generate_image("/tmp/out.png", format="png")
        self.assertEqual(res["file"], "/tmp/test.png")


if __name__ == "__main__":
    unittest.main()
