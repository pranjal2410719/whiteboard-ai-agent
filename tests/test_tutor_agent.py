"""Unit and Integration Tests for WhiteboardTutorAgent."""

import unittest
from unittest.mock import MagicMock, patch

from whiteboard_tutor_agent.tutor_agent import WhiteboardTutorAgent


class TestWhiteboardTutorAgent(unittest.TestCase):
    def setUp(self):
        # Initialize agent with mocked canvas calls to ensure test isolation
        self.agent = WhiteboardTutorAgent(canvas_url="http://127.0.0.1:3000")
        self.mock_elements = []

        def mock_add(elems):
            self.mock_elements.extend(elems)
            return {"status": "ok", "added": len(elems)}

        def mock_clear():
            self.mock_elements.clear()
            return {"status": "ok"}

        def mock_get():
            return list(self.mock_elements)

        self.agent.canvas.clear = MagicMock(side_effect=mock_clear)
        self.agent.canvas.add_elements = MagicMock(side_effect=mock_add)
        self.agent.canvas.get_elements = MagicMock(side_effect=mock_get)
        self.agent.canvas.delete_element = MagicMock(return_value={"status": "ok"})
        self.agent.canvas.save_snapshot = MagicMock(return_value={"status": "ok"})
        self.agent.canvas.describe = MagicMock(return_value="Canvas with 15 elements")
        self.agent.canvas.health = MagicMock(return_value={"status": "ok", "elements": 15})
        self.agent.canvas.export_image = MagicMock(return_value={"file": "/tmp/test.png"})
        self.agent.canvas.export_scene = MagicMock(return_value={"file": "/tmp/test.excalidraw"})

    def test_start_lesson_success(self):
        res = self.agent.start_lesson("friction")
        self.assertTrue(res["success"])
        self.assertEqual(res["topic_id"], "friction")
        self.assertEqual(res["step_number"], 1)
        self.assertIn("narration", res)
        self.assertIn("checkpoint_question", res)
        self.assertEqual(self.agent.current_step_idx, 0)
        self.assertTrue(self.agent.waiting_for_checkpoint)
        self.agent.canvas.clear.assert_called_once()
        self.agent.canvas.add_elements.assert_called_once()

    def test_start_lesson_invalid_topic(self):
        res = self.agent.start_lesson("nonexistent_subject")
        self.assertFalse(res["success"])
        self.assertIn("not found", res["error"])

    def test_evaluate_checkpoint_correct(self):
        self.agent.start_lesson("friction")
        # Step 1 asks about microscopic irregularities or interlocking
        student_input = "Because of microscopic irregularities and interlocking of rough surfaces."
        res = self.agent.handle_input(student_input)

        self.assertTrue(res["success"])
        self.assertEqual(res["evaluated"], "CORRECT")
        self.assertTrue(res["next_step_available"])
        self.assertEqual(res["step_number"], 2)
        self.assertEqual(self.agent.current_step_idx, 1)

    def test_evaluate_checkpoint_incorrect(self):
        self.agent.start_lesson("friction")
        student_input = "It happens because of magical forces."
        res = self.agent.handle_input(student_input)

        self.assertTrue(res["success"])
        self.assertEqual(res["evaluated"], "NEEDS_IMPROVEMENT")
        self.assertIn("hint", res["tutor_feedback"].lower())
        self.assertEqual(self.agent.current_step_idx, 0)  # Remains on step 1

    def test_answer_doubt(self):
        self.agent.start_lesson("friction")
        # Set waiting_for_checkpoint to False or pass a question
        self.agent.waiting_for_checkpoint = False
        res = self.agent.handle_input("What is the unit of friction and coefficient mu?")

        self.assertTrue(res["success"])
        self.assertEqual(res["type"], "doubt_resolution")
        self.assertIn("Newtons", res["answer"])
        self.assertIn("NO units", res["answer"])
        self.assertTrue(res["whiteboard_annotated"])

    def test_manual_advance_and_previous(self):
        self.agent.start_lesson("friction")
        self.assertEqual(self.agent.current_step_idx, 0)

        # Advance
        adv = self.agent.handle_input("next")
        self.assertTrue(adv["success"])
        self.assertEqual(self.agent.current_step_idx, 1)

        # Prev
        prev = self.agent.handle_input("prev")
        self.assertTrue(prev["success"])
        self.assertEqual(self.agent.current_step_idx, 0)

    def test_get_board_status(self):
        self.agent.start_lesson("friction")
        status = self.agent.get_board_status()
        self.assertEqual(status["active_topic"], "Class 10 Physics: The Science of Friction")
        self.assertEqual(status["active_step"], 1)
        self.assertEqual(status["board_description"], "Canvas with 15 elements")

    def test_export_lesson(self):
        self.agent.start_lesson("friction")
        res = self.agent.export_lesson("/tmp/test_export")
        self.assertTrue(res["success"])
        self.assertEqual(res["image"], "/tmp/test.png")
        self.assertEqual(res["excalidraw_file"], "/tmp/test.excalidraw")

    def test_action_circle(self):
        self.agent.start_lesson("friction")
        res = self.agent.handle_input("circle banner_s1")
        self.assertTrue(res["success"])
        self.assertEqual(res["action"], "circle")
        self.assertIn("Circled", res["message"])

    def test_action_underline(self):
        self.agent.start_lesson("friction")
        res = self.agent.handle_input("underline banner_s1")
        self.assertTrue(res["success"])
        self.assertEqual(res["action"], "underline")
        self.assertIn("Underlined", res["message"])

    def test_action_light(self):
        self.agent.start_lesson("friction")
        res = self.agent.handle_input("light banner_s1")
        self.assertTrue(res["success"])
        self.assertEqual(res["action"], "light")
        self.assertIn("Highlighted", res["message"])

    def test_action_draw_below(self):
        self.agent.start_lesson("friction")
        res = self.agent.handle_input("draw below banner_s1: Important friction principle")
        self.assertTrue(res["success"])
        self.assertEqual(res["action"], "draw_relative")
        self.assertEqual(res["placement"], "below")

    def test_action_erase(self):
        self.agent.start_lesson("friction")
        res = self.agent.handle_input("erase banner_s1")
        self.assertTrue(res["success"])
        self.assertEqual(res["action"], "erase")


if __name__ == "__main__":
    unittest.main()
