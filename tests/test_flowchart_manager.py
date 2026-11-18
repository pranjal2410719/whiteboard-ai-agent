"""Unit tests for FlowchartManager and SemanticElement context engine."""

import unittest
from unittest.mock import MagicMock

from whiteboard_tutor_agent.flowchart_manager import FlowchartEdgeDef, FlowchartManager, FlowchartNodeDef
from whiteboard_tutor_agent.spatial_context import SpatialContext


class TestFlowchartManager(unittest.TestCase):
    def setUp(self):
        self.mock_canvas = MagicMock()
        self.mock_canvas.add_elements.return_value = {"status": "ok"}
        self.mock_canvas.delete_element.return_value = {"status": "ok"}
        self.context = SpatialContext()
        self.fm = FlowchartManager(canvas_client=self.mock_canvas, context=self.context)

        # Setup standard 4-node algorithm flowchart
        nodes = [
            FlowchartNodeDef("start_node", "START: Measure Applied Force F", "start", purpose="Entry point of friction evaluation algorithm"),
            FlowchartNodeDef("calc_node", "Calculate Limiting Friction: f_L = mu_s * N", "process", purpose="Computes maximum opposing static force"),
            FlowchartNodeDef("check_node", "Is Applied Force F > f_L?", "decision", purpose="Determines whether block remains static or accelerates"),
            FlowchartNodeDef("end_node", "Output: Block Accelerates", "end", purpose="Terminal motion state"),
        ]
        edges = [
            FlowchartEdgeDef("start_node", "calc_node"),
            FlowchartEdgeDef("calc_node", "check_node"),
            FlowchartEdgeDef("check_node", "end_node", label="Yes"),
        ]
        self.flowchart = self.fm.create_flowchart(
            flowchart_id="friction_algorithm",
            title="Friction State Determination Algorithm",
            nodes=nodes,
            edges=edges,
            start_x=400.0,
            start_y=80.0,
            vertical_gap=50.0,
        )

    def test_flowchart_creation_and_layout(self):
        self.assertEqual(len(self.flowchart.node_ids), 4)
        self.assertEqual(len(self.flowchart.edge_ids), 3)

        # Verify sequential non-overlapping Y coordinates
        first = self.fm.get_node("friction_algorithm", 0)
        second = self.fm.get_node("friction_algorithm", 1)
        self.assertLess(first.bottom, second.y)

    def test_get_first_node_context(self):
        # The user's exact scenario:
        # - where the first node is
        # - which coordinate of the first node
        # - where the text inside the first node is
        # - what the boundaries of the first node are
        # - why was this element there
        first = self.fm.get_first_node("friction_algorithm")
        self.assertIsNotNone(first)
        self.assertEqual(first.id, "start_node")
        self.assertEqual(first.role, "flowchart_start_node")
        self.assertIn("Entry point", first.purpose)

        # Full context report
        ctx = first.explain_context()
        self.assertIn("where_is_element", ctx)
        self.assertIn("what_is_position", ctx)
        self.assertIn("what_are_coordinates", ctx)
        self.assertIn("why_was_this_element_there", ctx)
        self.assertIn("is_there_any_element_over_it", ctx)

        # Exact boundaries
        bounds = ctx["what_are_coordinates"]["boundaries"]
        self.assertEqual(bounds["left"], first.x)
        self.assertEqual(bounds["top"], first.y)
        self.assertEqual(bounds["width"], first.width)

        # Inner text coordinates
        tb = ctx["what_are_coordinates"]["inner_text_coordinates"]
        self.assertIsNotNone(tb)
        self.assertGreaterEqual(tb["x"], first.x)
        self.assertLessEqual(tb["right"], first.right)

    def test_highlight_first_node_circle(self):
        res = self.fm.highlight_node("friction_algorithm", 0, style="circle", color="#e03131")
        self.assertTrue(res["success"])
        self.assertEqual(res["style_applied"], "circle")
        self.assertGreater(len(res["created_annotations"]), 0)

        first = self.fm.get_first_node("friction_algorithm")
        self.assertIn(res["created_annotations"][0], first.attached_annotations)

        # Verify context now reports element is overlaid
        ctx = first.explain_context()
        self.assertTrue(ctx["is_there_any_element_over_it"]["has_overlays"])

    def test_highlight_first_node_underline(self):
        res = self.fm.highlight_node("friction_algorithm", 0, style="underline", color="#fab005")
        self.assertTrue(res["success"])
        self.assertEqual(res["style_applied"], "underline")

    def test_highlight_first_node_light(self):
        res = self.fm.highlight_node("friction_algorithm", 0, style="light")
        self.assertTrue(res["success"])
        self.assertEqual(res["style_applied"], "light")

    def test_highlight_first_node_spotlight(self):
        res = self.fm.highlight_node("friction_algorithm", 0, style="spotlight")
        self.assertTrue(res["success"])
        self.assertEqual(res["style_applied"], "spotlight")
        self.assertEqual(len(res["created_annotations"]), 3)  # backdrop + arrow + label

    def test_clear_node_highlights(self):
        self.fm.highlight_node("friction_algorithm", 0, style="circle")
        cleared = self.fm.clear_node_highlights("friction_algorithm", 0)
        self.assertEqual(cleared, 1)

        first = self.fm.get_first_node("friction_algorithm")
        self.assertEqual(len(first.attached_annotations), 0)


if __name__ == "__main__":
    unittest.main()
