#!/usr/bin/env python3
"""
Whiteboard Tutor Agent - Interactive CLI
========================================
Interactive terminal interface for students to learn Physics and other subjects
from the AI Whiteboard Tutor while live diagrams sync to the Excalidraw canvas.
"""

import argparse
import sys
from typing import Optional

from .curriculum import Curriculum
from .tutor_agent import WhiteboardTutorAgent

CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def print_banner():
    print(f"{CYAN}{BOLD}")
    print("=" * 72)
    print("      🎓 AI WHITEBOARD TUTOR - INTERACTIVE CLASSROOM 🎓      ")
    print("  Live Canvas Sync | Conceptual Explanations | Active Learning  ")
    print("=" * 72)
    print(f"{RESET}")


def print_help():
    print(f"\n{BOLD}Teaching Commands:{RESET}")
    print(f"  {CYAN}topics{RESET}                  - List all available lesson topics")
    print(f"  {CYAN}start <topic>{RESET}           - Begin a lesson (e.g., 'start friction', 'start gravitation')")
    print(f"  {CYAN}next{RESET}                    - Advance to the next lesson step")
    print(f"  {CYAN}prev{RESET}                    - Go back to the previous lesson step")
    print(f"  {CYAN}board{RESET}                   - Inspect live canvas status and element counts")
    print(f"  {CYAN}export{RESET}                  - Save current whiteboard as PNG and .excalidraw")
    print(f"  {CYAN}help{RESET}                    - Show this command reference")
    print(f"  {CYAN}quit / exit{RESET}             - Exit the tutor session\n")
    print(f"{BOLD}Whiteboard Visual Action Tools:{RESET}")
    print(f"  {CYAN}circle <target>{RESET}         - Circle an element with an attention ring (e.g. 'circle friction')")
    print(f"  {CYAN}underline <target>{RESET}      - Underline a key word or box (e.g. 'underline formula')")
    print(f"  {CYAN}light <target>{RESET}          - Highlight an element with a halo/backdrop (e.g. 'light block')")
    print(f"  {CYAN}spotlight <target>{RESET}      - Highlight and point attention arrow to an element")
    print(f"  {CYAN}erase <target>{RESET}          - Delete an element by label or ID (e.g. 'erase note')")
    print(f"  {CYAN}callout <target>: <note>{RESET} - Add a sticky callout pointing to an element")
    print(f"  {CYAN}draw below <ref>: <txt>{RESET}  - Place a new box directly under a target element")
    print(f"  {CYAN}draw above <ref>: <txt>{RESET}  - Place a new box directly above a target element")
    print(f"  {CYAN}align <ids> to <pos>{RESET}     - Align elements (left, center, right, top, bottom)")
    print(f"  {CYAN}distribute <ids>{RESET}        - Evenly space elements horizontally or vertically")
    print(f"  {CYAN}generate image <path>{RESET}   - Render and save PNG/SVG image\n")
    print(f"Type your answers to checkpoint questions, ask doubts, or use whiteboard tools!\n")


def display_step(res: dict):
    print(f"\n{GREEN}{BOLD}════════════════════════════════════════════════════════════════════════{RESET}")
    print(f"{GREEN}{BOLD}▶ STEP {res.get('step_number', 1)}/{res.get('total_steps', '?')}: {res.get('step_title', '')}{RESET}")
    print(f"{GREEN}{BOLD}════════════════════════════════════════════════════════════════════════{RESET}\n")

    print(f"{BOLD}TUTOR NARRATION:{RESET}")
    for line in res.get("narration", "").strip().split("\n"):
        print(f"  {line}")

    if res.get("canvas_url"):
        print(f"\n{DIM}[Live Whiteboard updated at: {res['canvas_url']}]{RESET}")

    if res.get("checkpoint_question"):
        print(f"\n{YELLOW}{BOLD}❓ CHECKPOINT QUESTION:{RESET}")
        print(f"  {YELLOW}{res['checkpoint_question']}{RESET}\n")


def run_cli(canvas_url: Optional[str] = None, initial_topic: Optional[str] = None):
    print_banner()
    agent = WhiteboardTutorAgent(canvas_url=canvas_url)
    curriculum = Curriculum()

    print(f"{DIM}Connecting to Excalidraw canvas at {agent.canvas.base_url}...{RESET}")
    h = agent.canvas.health()
    if h.get("status") == "ok":
        print(f"{GREEN}✓ Connected to live canvas server successfully!{RESET}\n")
    else:
        print(f"{YELLOW}⚠ Live canvas server not detected or offline. Diagrams will queue locally.{RESET}\n")

    if initial_topic:
        res = agent.start_lesson(initial_topic)
        if res.get("success"):
            display_step(res)
        else:
            print(f"{RED}Error:{RESET} {res.get('error')}")
    else:
        print(f"{BOLD}Available Topics:{RESET}")
        for t in curriculum.list_topics():
            print(f"  • {CYAN}{t['id']}{RESET} : {t['title']} ({t['grade_level']}) [{t['step_count']} steps]")
        print(f"\nType {CYAN}start <topic_id>{RESET} to begin learning!\n")

    while True:
        try:
            prompt_label = f"{BOLD}Student{RESET}"
            if agent.current_topic:
                prompt_label = f"{CYAN}[Step {agent.current_step_idx + 1}/{len(agent.current_topic.steps)}]{RESET} {BOLD}Student{RESET}"

            user_input = input(f"{prompt_label}> ").strip()
            if not user_input:
                continue

            lower = user_input.lower()
            if lower in ("quit", "exit", "q"):
                print(f"\n{CYAN}Thank you for learning with the AI Whiteboard Tutor! Goodbye! 👋{RESET}")
                break

            if lower == "help":
                print_help()
                continue

            if lower in ("topics", "list"):
                print(f"\n{BOLD}Available Topics:{RESET}")
                for t in curriculum.list_topics():
                    print(f"  • {CYAN}{t['id']}{RESET} : {t['title']} ({t['grade_level']}) [{t['step_count']} steps]")
                print()
                continue

            if lower.startswith("start "):
                topic_id = user_input.split(" ", 1)[1].strip()
                res = agent.start_lesson(topic_id)
                if res.get("success"):
                    display_step(res)
                else:
                    print(f"{RED}Error:{RESET} {res.get('error')}\n")
                continue

            # Process input via agent
            res = agent.handle_input(user_input)

            if not res.get("success"):
                print(f"{RED}Notice:{RESET} {res.get('message') or res.get('error')}\n")
                continue

            # Check if element context explanation
            if res.get("action") == "explain_element" and res.get("context"):
                ctx = res["context"]
                print(f"\n{CYAN}{BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
                print(f"{CYAN}{BOLD}📍 ELEMENT CONTEXT REPORT: {ctx.get('element_id')}{RESET}")
                print(f"{CYAN}{BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
                print(f"  • {BOLD}Where is the element?{RESET} {ctx['where_is_element']['quadrant']} | Center: {ctx['where_is_element']['center_point']} | Parent: {ctx['where_is_element']['parent_entity']}")
                print(f"  • {BOLD}What is the position?{RESET} Sequence Index: {ctx['what_is_position']['sequence_index']} | Role: {ctx['what_is_position']['role']}")
                coords = ctx['what_are_coordinates']
                print(f"  • {BOLD}What are the coordinates?{RESET} x={coords['exact_x']}, y={coords['exact_y']}, width={coords['width']}, height={coords['height']}")
                if coords.get('inner_text_coordinates'):
                    tb = coords['inner_text_coordinates']
                    print(f"    Inner Text Bounds: x={tb['x']}, y={tb['y']}, width={tb['width']}, height={tb['height']}")
                print(f"  • {BOLD}What content is on the operation?{RESET} Type: {ctx['what_content_is_on_operation']['type']} | Content: \"{ctx['what_content_is_on_operation']['content_text'][:60]}\"")
                print(f"  • {BOLD}Why was this element there?{RESET} {ctx['why_was_this_element_there']}")
                overlays = ctx['is_there_any_element_over_it']
                print(f"  • {BOLD}Is there any element placed over it?{RESET} {'YES' if overlays['has_overlays'] else 'NO'} (Overlapping: {overlays['overlapping_elements']}, Attached Annotations: {overlays['attached_annotations']})\n")
                continue

            # Check if doubt resolution
            if res.get("type") == "doubt_resolution":
                print(f"\n{YELLOW}{BOLD}💡 TUTOR DOUBT RESOLUTION:{RESET}")
                print(f"{res.get('answer')}\n")
                if res.get("whiteboard_annotated"):
                    print(f"{DIM}[Whiteboard annotated with student note callout box]{RESET}")
                if res.get("checkpoint_reminder"):
                    print(f"\n{YELLOW}❓ Ready to continue? Here is the checkpoint question:{RESET}")
                    print(f"  {YELLOW}{res['checkpoint_reminder']}{RESET}\n")
                continue

            # Check if checkpoint evaluation
            eval_status = res.get("evaluated")
            if eval_status == "CORRECT":
                print(f"\n{GREEN}{BOLD}✓ Correct! Excellent work!{RESET}")
                print(f"{res.get('tutor_feedback')}\n")

                if res.get("lesson_completed"):
                    print(f"{GREEN}{BOLD}{res.get('congratulations')}{RESET}\n")
                elif res.get("next_step_available"):
                    display_step(res)

            elif eval_status == "NEEDS_IMPROVEMENT":
                print(f"\n{YELLOW}{BOLD}ℹ {res.get('tutor_feedback')}{RESET}\n")
                print(f"{YELLOW}Try again: {res.get('retry_question')}{RESET}\n")

            elif res.get("step_title"):
                # Result of manual advance or previous step
                display_step(res)
            elif res.get("board_description") or res.get("health"):
                print(f"\n{CYAN}Board status:{RESET} {res}\n")
            elif res.get("image"):
                print(f"\n{GREEN}Whiteboard exported successfully!{RESET}")
                print(f"  Image: {res.get('image')}")
                print(f"  Excalidraw: {res.get('excalidraw_file')}\n")
            elif res.get("message"):
                print(f"\n{res.get('message')}\n")

        except (KeyboardInterrupt, EOFError):
            print(f"\n\n{CYAN}Exiting AI Whiteboard Tutor session. Have a great day! 👋{RESET}")
            break


def main():
    parser = argparse.ArgumentParser(description="AI Whiteboard Tutor Agent CLI")
    parser.add_argument("--canvas-url", type=str, default=None, help="URL of live Excalidraw server (default: http://127.0.0.1:3000)")
    parser.add_argument("--topic", type=str, default=None, help="Initial topic to start immediately (e.g. friction, gravitation)")
    args = parser.parse_args()

    run_cli(canvas_url=args.canvas_url, initial_topic=args.topic)


if __name__ == "__main__":
    main()
