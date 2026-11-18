# 🎓 AI Whiteboard Tutor Agent

An autonomous AI pedagogical agent and whiteboard orchestrator designed for real-time interactive teaching. The agent pairs verbal narration and active learning checkpoints with synchronized visual diagrams on a live **Excalidraw** whiteboard canvas (`http://127.0.0.1:3000`).

The agent is organized as an independent, decoupled module residing in `/home/vscode-gcp/projects/qrie_tutors/test04/whiteboard_tutor_agent`.

---

## 🌟 Key Features

1. **Autonomous Whiteboard Management**:
   - Programmatically renders and clears Excalidraw diagrams, Free-Body Diagrams (FBDs), formula spotlights, and visual callouts.
   - Directly drives the local Excalidraw REST and MCP engine with automatic schema normalization (labels, coordinates, bindings).
   - Captures snapshots and exports full lessons as high-resolution PNGs and editable `.excalidraw` scene files.

2. **Whiteboard Spatial Context Tracking Engine (`spatial_context.py`)**:
   - Stores real-time spatial memory of every element on the canvas (bounding boxes, coordinates, centers, z-order).
   - Relative spatial geometry: calculates coordinates to place elements `below`, `above`, `beside`, or `inside` existing reference elements.
   - Intelligent collision avoidance: automatically discovers clean non-overlapping locations.
   - Multi-element alignment (`left`, `center`, `right`, `top`, `bottom`) and spatial distribution.

3. **Complete Whiteboard Operations Suite (`whiteboard_ops.py`)**:
   - **DRAW**: Freehand shapes, text cards, directional bound arrows, and relative elements (`draw below <ref>: <txt>`, `draw above <ref>: <txt>`).
   - **ERASE**: Delete elements by ID, text content search, or clear the whole board.
   - **LIGHT**: Highlight elements with translucent backdrops, glowing borders, and spotlight attention pointers.
   - **ANNOTATE**: Draw hand-drawn red circles around elements (`circle <ref>`), underline terms (`underline <ref>`), and attach pointer callouts.
   - **ALIGN & DISTRIBUTE**: Automatically align and distribute multiple shapes.
   - **GENERATE IMAGES**: Headless rendering to high-res PNG and SVG files.

4. **Pedagogical Curriculum Engine (`curriculum.py`)**:
   - Structured step-by-step curriculum with non-overlapping visual board layouts and calibrated spatial coordinates.
   - Built-in Class 10 Physics modules:
     - **The Science of Friction**: Microscopic origins & interlocking, Free Body Diagrams (FBDs), Static vs. Kinetic vs. Rolling friction, Laws of Friction ($f_L = \mu_s N$).
     - **Gravitation and Gravity**: Newton's Universal Law & Inverse-Square Law, Big $G$ vs. Small $g$ ($g = GM/R^2$), Mass vs. Weight ($W = mg$).

5. **LLM Generative Reasoning & Fallback (`llm_client.py`)**:
   - Supports Google Gemini API (`GEMINI_API_KEY`), OpenAI / Ollama (`OPENAI_API_KEY`), and seamless offline heuristic fallback.

6. **Dual Interface**:
   - **Interactive CLI (`cli.py`)**: Terminal REPL supporting teaching commands and direct visual whiteboard manipulation.
   - **HTTP REST API Server (`server.py`)**: Complete REST API with dedicated visual tool endpoints (`/api/ops/*`).

---

## 🏗 Architecture

```
+-----------------------------------------------------------------------------------+
|                            WHITEBOARD TUTOR AGENT                                 |
|                                                                                   |
|  +------------------------+      +------------------------+                       |
|  |   Interactive CLI      |      |   HTTP REST Server     |                       |
|  |   (cli.py)             |      |   (server.py:8080)     |                       |
|  +-----------+------------+      +-----------+------------+                       |
|              |                               |                                    |
|              +---------------+---------------+                                    |
|                              |                                                    |
|                              v                                                    |
|                 +--------------------------+                                      |
|                 |  WhiteboardTutorAgent    |                                      |
|                 |  (tutor_agent.py)        |                                      |
|                 +----+----------------+----+                                      |
|                      |                |                                           |
|       +--------------+                +--------------+                            |
|       v                                              v                            |
|  +------------------------+             +------------------------+                |
|  |  Curriculum Engine     |             |  CanvasClient          |                |
|  |  (curriculum.py)       |             |  (canvas_client.py)    |                |
|  +------------------------+             +------------+-----------+                |
+------------------------------------------------------|----------------------------+
                                                       | HTTP / REST
                                                       v
                                          +-------------------------+
                                          | Live Excalidraw Canvas  |
                                          | (http://127.0.0.1:3000) |
                                          +-------------------------+
```

---

## 📁 Repository Structure

```
whiteboard_tutor_agent/
├── __init__.py           # Package exports and version metadata
├── canvas_client.py      # Excalidraw REST/CLI client and pedagogical drawing helpers
├── spatial_context.py    # Spatial Context & Layout Engine (bboxes, relative placement, collision avoidance)
├── whiteboard_ops.py     # Whiteboard Operations Suite (draw, erase, light, annotate, align, images)
├── curriculum.py         # Course definitions, steps, geometry, and checkpoint Q&A
├── llm_client.py         # Pluggable LLM interface (Gemini, OpenAI, Ollama, & Heuristic)
├── tutor_agent.py        # Central tutor brain: dialogue, visual actions, evaluations, board sync
├── cli.py                # Interactive student REPL terminal interface
├── server.py             # REST API server for external web applications
├── README.md             # Complete documentation
└── tests/
    ├── __init__.py
    ├── test_canvas_client.py   # Unit tests for canvas client and drawing primitives
    ├── test_spatial_context.py # Unit tests for spatial bounding boxes and relative positioning
    ├── test_whiteboard_ops.py  # Unit tests for draw, erase, light, annotate, align, and image tools
    ├── test_curriculum.py      # Unit tests for curriculum lessons and steps
    ├── test_tutor_agent.py     # End-to-end unit tests for tutor logic, actions, and flow
    └── test_server.py          # Integration tests for HTTP REST endpoints
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python $\ge$ 3.10
- Requests library (`pip install requests`)
- Excalidraw canvas server running at `http://127.0.0.1:3000` (started automatically or via `mcp-excalidraw-server start`)

### 2. Interactive Student CLI

To launch the interactive tutor session in your terminal:
```bash
python3 -m whiteboard_tutor_agent.cli
```

Or start directly with a specific topic:
```bash
python3 -m whiteboard_tutor_agent.cli --topic friction
```

#### CLI Command Reference:
- `topics`: List all available lesson topics.
- `start <topic_id>`: Begin learning a topic (e.g. `start friction`, `start gravitation`).
- `next`: Advance to the next lesson step.
- `prev`: Go back to the previous lesson step.
- `board`: Inspect current live canvas status and element count.
- `export`: Save the current whiteboard as a PNG image and `.excalidraw` file.
- `help`: View available commands.
- `quit` / `exit`: Exit the tutoring session.

---

### 3. Running the REST API Server

To run the tutor HTTP server:
```bash
python3 -m whiteboard_tutor_agent.server --port 8080
```

#### REST Endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check service health and live canvas status |
| `GET` | `/api/topics` | List available curriculum courses |
| `GET` | `/api/topic/<id>` | Get detailed step outline of a course |
| `POST` | `/api/lesson/start` | Start a lesson: `{"topic": "friction"}` |
| `POST` | `/api/lesson/input` | Send student response or doubt: `{"input": "..."}` |
| `POST` | `/api/lesson/advance` | Force advance to next step: `{"force": true}` |
| `POST` | `/api/lesson/previous` | Step back to previous step |
| `GET` | `/api/lesson/status` | Current progress & spatial canvas description |
| `POST` | `/api/lesson/export` | Export lesson to PNG and `.excalidraw` file |
| `POST` | `/api/canvas/clear` | Clear the live canvas |

---

### 4. Python SDK Usage

You can embed the tutor agent directly into any Python script or agent framework:

```python
from whiteboard_tutor_agent.tutor_agent import WhiteboardTutorAgent

# Initialize agent
tutor = WhiteboardTutorAgent(canvas_url="http://127.0.0.1:3000")

# 1. Start a structured lesson
lesson = tutor.start_lesson("friction")
print(f"Step {lesson['step_number']}: {lesson['step_title']}")
print(f"Tutor: {lesson['narration']}")
print(f"Question: {lesson['checkpoint_question']}")

# 2. Student submits an answer
response = tutor.handle_input("Because of microscopic irregularities and surface interlocking.")
if response["evaluated"] == "CORRECT":
    print("✓ Tutor Feedback:", response["tutor_feedback"])
    if response.get("next_step_available"):
        print(f"Moved to Step {response['step_number']}: {response['step_title']}")

# 3. Student asks a doubt anytime
doubt_res = tutor.handle_input("What is normal force N?")
print("💡 Tutor Explanation:", doubt_res["answer"])
# The whiteboard automatically gets annotated with a highlighted student note!
```

---

## 🧪 Running Tests

The test suite covers unit and integration tests across the client, curriculum, tutor agent, and REST server:

```bash
python3 -m unittest discover -s whiteboard_tutor_agent/tests -v
```

All 23 tests run in <0.5s:
```
test_draw_banner ... ok
test_draw_card ... ok
test_draw_formula_card ... ok
test_draw_free_body_diagram ... ok
test_health_mock_success ... ok
test_normalize_arrow_element ... ok
test_normalize_shape_element ... ok
test_friction_topic_structure ... ok
test_gravitation_topic_structure ... ok
test_list_topics ... ok
test_nonexistent_topic_returns_none ... ok
test_health_endpoint ... ok
test_lesson_flow ... ok
test_topic_details_endpoint ... ok
test_topics_endpoint ... ok
test_answer_doubt ... ok
test_evaluate_checkpoint_correct ... ok
test_evaluate_checkpoint_incorrect ... ok
test_export_lesson ... ok
test_get_board_status ... ok
test_manual_advance_and_previous ... ok
test_start_lesson_invalid_topic ... ok
test_start_lesson_success ... ok

Ran 23 tests in 0.330s
OK
```

---

## 📜 Pedagogical Design Philosophy

1. **Visual Clarity First**:
   - Elements are laid out bilaterally to prevent overlapping vector arrows.
   - Standardized palettes (e.g. Normal Force in `#2f9e44`, Gravity in `#e03131`, Friction in `#d9480f`).
2. **Step-by-Step Scaffolding**:
   - Each concept builds on the previous one (e.g. Microscopic Causes $\rightarrow$ Free Body Diagram $\rightarrow$ Coulomb's Laws).
3. **No Passive Listening**:
   - The tutor waits for student understanding at every checkpoint, encouraging genuine synthesis over rote memorization.
