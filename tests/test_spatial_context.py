"""Unit tests for SpatialContext layout and geometry engine."""

import unittest

from whiteboard_tutor_agent.spatial_context import BoundingBox, SpatialContext


class TestSpatialContext(unittest.TestCase):
    def setUp(self):
        self.ctx = SpatialContext()
        self.elements = [
            {"id": "header", "type": "rectangle", "x": 100, "y": 50, "width": 600, "height": 60, "text": "Lesson Header"},
            {"id": "card_a", "type": "rectangle", "x": 100, "y": 150, "width": 250, "height": 180, "text": "Concept A (Friction)"},
            {"id": "card_b", "type": "rectangle", "x": 450, "y": 150, "width": 250, "height": 180, "text": "Concept B (Gravity)"},
        ]
        self.ctx.update_from_elements(self.elements)

    def test_bounding_box_intersection(self):
        b1 = BoundingBox(x=10, y=10, width=100, height=100)
        b2 = BoundingBox(x=50, y=50, width=100, height=100)
        b3 = BoundingBox(x=200, y=200, width=50, height=50)

        self.assertTrue(b1.intersects(b2))
        self.assertFalse(b1.intersects(b3))

    def test_find_by_query(self):
        # By ID
        self.assertEqual(self.ctx.find("header")["id"], "header")
        # By text
        self.assertEqual(self.ctx.find("friction")["id"], "card_a")
        self.assertEqual(self.ctx.find("gravity")["id"], "card_b")
        # By positional keyword 'last'
        self.assertEqual(self.ctx.find("last")["id"], "card_b")

    def test_relative_placement_below(self):
        # Place new box under card_a
        x, y = self.ctx.calculate_relative_position("card_a", placement="below", width=250, height=100, gap=20, align="center")
        self.assertEqual(y, 150 + 180 + 20)  # y + height + gap = 350
        self.assertEqual(x, 100)  # Center aligned with width 250

    def test_relative_placement_above(self):
        x, y = self.ctx.calculate_relative_position("card_a", placement="above", width=250, height=50, gap=25, align="start")
        self.assertEqual(y, 150 - 50 - 25)  # 75
        self.assertEqual(x, 100)

    def test_relative_placement_beside(self):
        x, y = self.ctx.calculate_relative_position("card_a", placement="right", width=150, height=100, gap=30, align="start")
        self.assertEqual(x, 100 + 250 + 30)  # 380
        self.assertEqual(y, 150)

    def test_compute_alignment(self):
        # Align card_a and card_b to top
        updates = self.ctx.compute_alignment(["card_a", "card_b"], to="top")
        self.assertEqual(updates["card_a"]["y"], 150)
        self.assertEqual(updates["card_b"]["y"], 150)

        # Align to left
        updates_left = self.ctx.compute_alignment(["card_a", "card_b"], to="left")
        self.assertEqual(updates_left["card_a"]["x"], 100)
        self.assertEqual(updates_left["card_b"]["x"], 100)

    def test_compute_distribution(self):
        elem_c = {"id": "card_c", "type": "rectangle", "x": 800, "y": 150, "width": 250, "height": 180, "text": "Concept C"}
        self.ctx.register_element(elem_c)

        updates = self.ctx.compute_distribution(["card_a", "card_b", "card_c"], direction="horizontal")
        self.assertIn("card_a", updates)
        self.assertIn("card_b", updates)
        self.assertIn("card_c", updates)
        # Verify monotonically increasing x
        self.assertLess(updates["card_a"]["x"], updates["card_b"]["x"])
        self.assertLess(updates["card_b"]["x"], updates["card_c"]["x"])

    def test_find_non_overlapping_spot(self):
        # Preferred spot collides with card_a at (100, 150)
        clean_x, clean_y = self.ctx.find_non_overlapping_spot(target_x=100, target_y=150, width=200, height=100)
        # Should step down past bottom of card_a (150 + 180 = 330)
        self.assertGreaterEqual(clean_y, 330)


if __name__ == "__main__":
    unittest.main()
