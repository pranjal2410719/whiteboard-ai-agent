"""Unit Tests for Curriculum Engine."""

import unittest

from whiteboard_tutor_agent.curriculum import Curriculum


class TestCurriculum(unittest.TestCase):
    def setUp(self):
        self.curriculum = Curriculum()

    def test_list_topics(self):
        topics = self.curriculum.list_topics()
        self.assertGreaterEqual(len(topics), 2)
        ids = [t["id"] for t in topics]
        self.assertIn("friction", ids)
        self.assertIn("gravitation", ids)

    def test_friction_topic_structure(self):
        topic = self.curriculum.get_topic("friction")
        self.assertIsNotNone(topic)
        self.assertEqual(topic.id, "friction")
        self.assertEqual(topic.grade_level, "Class 10")
        self.assertGreaterEqual(len(topic.steps), 3)

        for step in topic.steps:
            self.assertGreater(len(step.title), 0)
            self.assertGreater(len(step.narration), 0)
            self.assertGreater(len(step.checkpoint_question), 0)
            self.assertGreater(len(step.expected_keywords), 0)
            self.assertGreater(len(step.whiteboard_elements), 0)

            # Check that elements have valid coords and types
            for elem in step.whiteboard_elements:
                self.assertIn(elem.get("type"), ["rectangle", "ellipse", "arrow", "text", "line"])
                self.assertIn("x", elem)
                self.assertIn("y", elem)

    def test_gravitation_topic_structure(self):
        topic = self.curriculum.get_topic("gravitation")
        self.assertIsNotNone(topic)
        self.assertEqual(topic.id, "gravitation")
        self.assertEqual(topic.grade_level, "Class 10")
        self.assertGreaterEqual(len(topic.steps), 3)

        for step in topic.steps:
            self.assertGreater(len(step.title), 0)
            self.assertGreater(len(step.checkpoint_question), 0)
            self.assertGreater(len(step.expected_keywords), 0)
            self.assertGreater(len(step.whiteboard_elements), 0)

    def test_nonexistent_topic_returns_none(self):
        topic = self.curriculum.get_topic("quantum_electrodynamics")
        self.assertIsNone(topic)


if __name__ == "__main__":
    unittest.main()
