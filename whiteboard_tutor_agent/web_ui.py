"""
Interactive Web Classroom Interface for AI Whiteboard Tutor
============================================================
Serves a responsive split-screen UI for selecting curriculum topics,
monitoring live tutor narrations, answering checkpoint questions,
and applying precision visual annotation tools (Highlighter, Pen, Pencil, Circle, Underline).
"""


def get_classroom_html(canvas_url: str = "http://127.0.0.1:3000") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Whiteboard Tutor - Live Interactive Classroom</title>
  <style>
    :root {{
      --primary: #1971c2;
      --primary-dark: #1864ab;
      --accent: #2b8a3e;
      --bg: #f8f9fa;
      --card-bg: #ffffff;
      --border: #dee2e6;
      --text: #212529;
      --text-muted: #6c757d;
      --highlight: #ffec99;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }}
    /* Top Navigation Header */
    header {{
      background: #ffffff;
      border-bottom: 2px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      z-index: 10;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 700;
      color: var(--primary);
    }}
    .topic-selector-bar {{
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      max-width: 720px;
      margin: 0 20px;
    }}
    select, input, button {{
      font-family: inherit;
      font-size: 14px;
      border-radius: 6px;
      outline: none;
    }}
    select, input[type="text"] {{
      border: 1px solid var(--border);
      padding: 8px 12px;
      background: #ffffff;
      color: var(--text);
    }}
    select {{ flex: 1.2; }}
    input[type="text"] {{ flex: 1; }}
    button {{
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }}
    button:hover {{ background: var(--primary-dark); }}
    .btn-secondary {{ background: #e9ecef; color: #495057; border: 1px solid var(--border); }}
    .btn-secondary:hover {{ background: #dee2e6; }}
    .btn-success {{ background: var(--accent); color: white; }}
    .btn-success:hover {{ background: #237032; }}

    /* Main Container (Split Screen) */
    .main-workspace {{
      flex: 1;
      display: grid;
      grid-template-columns: 460px 1fr;
      height: calc(100vh - 65px);
      overflow: hidden;
    }}

    /* Left Sidebar: Tutor & Classroom */
    .tutor-panel {{
      background: #ffffff;
      border-right: 2px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 16px;
      gap: 16px;
    }}
    .panel-card {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }}
    .badge {{
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 8px;
    }}
    .badge-primary {{ background: #e7f5ff; color: #1971c2; }}
    .badge-success {{ background: #ebfbee; color: #2b8a3e; }}
    .badge-warning {{ background: #fff9db; color: #f59f00; }}

    .narration-box {{
      font-size: 14px;
      line-height: 1.55;
      color: #343a40;
      background: #f8f9fa;
      border-left: 4px solid var(--primary);
      padding: 12px 14px;
      border-radius: 0 6px 6px 0;
    }}
    .checkpoint-box {{
      border: 2px solid #fab005;
      background: #fffdf5;
      border-radius: 8px;
      padding: 14px;
    }}
    .checkpoint-box h4 {{
      color: #d9480f;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    /* Tool Palette */
    .tool-palette {{
      background: #f1f3f5;
      border-radius: 8px;
      padding: 12px;
    }}
    .tool-palette h4 {{
      font-size: 13px;
      color: #495057;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }}
    .tool-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }}
    .tool-btn {{
      background: #ffffff;
      color: #343a40;
      border: 1px solid #ced4da;
      padding: 8px 6px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }}
    .tool-btn:hover, .tool-btn.active {{
      background: #e7f5ff;
      border-color: #1971c2;
      color: #1971c2;
    }}
    .tool-target-row {{
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }}
    .tool-target-row input {{ flex: 1; font-size: 12px; }}

    /* Right Screen: Live Whiteboard Canvas */
    .canvas-container {{
      position: relative;
      background: #ffffff;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }}
    .canvas-iframe {{
      width: 100%;
      height: 100%;
      border: none;
    }}
    .canvas-overlay-bar {{
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(4px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      font-size: 12px;
      font-weight: 600;
    }}
    .status-dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #40c057;
      display: inline-block;
    }}
  </style>
</head>
<body>

  <!-- Top Header Navigation -->
  <header>
    <div class="brand">
      <span>🎓</span>
      <span>AI Whiteboard Tutor</span>
    </div>

    <div class="topic-selector-bar">
      <select id="topicDropdown">
        <option value="mitochondria" selected>⚡ Class 7 Biology: The Mitochondria (Powerhouse of the Cell)</option>
        <option value="photosynthesis">🌿 Class 7 Biology: Photosynthesis & Chloroplasts</option>
        <option value="cell_structure">🔬 Class 7 Biology: Human Cell Architecture & Organelles</option>
        <option value="friction">⚙️ Class 10 Physics: The Science of Friction</option>
        <option value="gravitation">🌍 Class 10 Physics: Gravitation and Gravity (g)</option>
      </select>
      <input type="text" id="customTopicInput" placeholder="Or enter any custom topic...">
      <button onclick="handleStartTopic()">▶️ Start Teaching</button>
    </div>

    <div>
      <a href="{canvas_url}" target="_blank" style="text-decoration:none;">
        <button class="btn-secondary" style="font-size:12px;">🔗 Open Canvas Tab</button>
      </a>
    </div>
  </header>

  <!-- Main Split-Screen Workspace -->
  <div class="main-workspace">

    <!-- Left Panel: Classroom Controls & Narration -->
    <div class="tutor-panel">

      <!-- Current Lesson Status -->
      <div class="panel-card">
        <span class="badge badge-primary" id="stepBadge">STEP 1 OF 3</span>
        <h3 id="stepTitle" style="font-size:16px; margin-bottom:8px; color:#1864ab;">Topic Ready</h3>
        <div class="narration-box" id="narrationText">
          Select a topic above or click "Start Teaching" to begin the step-by-step visual lesson!
        </div>
      </div>

      <!-- Checkpoint Question & Evaluation Box -->
      <div class="checkpoint-box" id="checkpointContainer">
        <h4>❓ Checkpoint Question</h4>
        <p id="checkpointQuestionText" style="font-size:13px; margin-bottom:10px; font-weight:600; color:#343a40;">
          Waiting to begin lesson...
        </p>
        <div style="display:flex; gap:8px;">
          <input type="text" id="studentAnswerInput" placeholder="Type your answer here..." style="flex:1;">
          <button class="btn-success" onclick="handleSubmitAnswer()">Submit</button>
        </div>
        <div id="evaluationAlert" style="margin-top:10px; display:none; padding:8px 10px; border-radius:6px; font-size:13px;"></div>
      </div>

      <!-- Specific Whiteboard Tool Palette -->
      <div class="tool-palette">
        <h4>🎨 Whiteboard Annotation Tools</h4>
        <div class="tool-grid">
          <button class="tool-btn" onclick="applyTool('highlighter')">
            <span style="font-size:16px;">🖍️</span>
            <span>Highlighter</span>
          </button>
          <button class="tool-btn" onclick="applyTool('pen')">
            <span style="font-size:16px;">🖊️</span>
            <span>Ink Pen</span>
          </button>
          <button class="tool-btn" onclick="applyTool('pencil')">
            <span style="font-size:16px;">✏️</span>
            <span>Pencil</span>
          </button>
          <button class="tool-btn" onclick="applyTool('circle')">
            <span style="font-size:16px;">⭕</span>
            <span>Circle</span>
          </button>
          <button class="tool-btn" onclick="applyTool('underline')">
            <span style="font-size:16px;">➖</span>
            <span>Underline</span>
          </button>
          <button class="tool-btn" onclick="applyTool('double_underline')">
            <span style="font-size:16px;">⚌</span>
            <span>Double Line</span>
          </button>
        </div>

        <div class="tool-target-row">
          <input type="text" id="toolTargetInput" placeholder="Target element (e.g. cristae, matrix, last)">
          <input type="text" id="toolNoteInput" placeholder="Pen note text (optional)" style="flex:1.2;">
        </div>
      </div>

      <!-- Lesson Navigation Controls -->
      <div style="display:flex; gap:8px;">
        <button class="btn-secondary" onclick="handleNav('previous')" style="flex:1;">⏮️ Prev Step</button>
        <button class="btn-secondary" onclick="handleNav('redraw')" style="flex:1;">🔄 Redraw</button>
        <button onclick="handleNav('advance')" style="flex:1.2;">⏭️ Next Step</button>
      </div>

    </div>

    <!-- Right Panel: Live Whiteboard Canvas Embed -->
    <div class="canvas-container">
      <div class="canvas-overlay-bar">
        <span class="status-dot"></span>
        <span>Live Canvas Connected</span>
      </div>
      <iframe class="canvas-iframe" id="canvasFrame" src="{canvas_url}"></iframe>
    </div>

  </div>

  <script>
    const CANVAS_URL = "{canvas_url}";

    async function handleStartTopic() {{
      const custom = document.getElementById("customTopicInput").value.trim();
      const selected = document.getElementById("topicDropdown").value;
      const topic = custom || selected;

      const res = await fetch("/api/lesson/start", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{ topic: topic }})
      }});
      const data = await res.json();
      if (data.success) {{
        renderStep(data);
      }}
    }}

    function renderStep(data) {{
      document.getElementById("stepBadge").innerText = `STEP ${{data.step_number || 1}} OF ${{data.total_steps || 3}}`;
      document.getElementById("stepTitle").innerText = data.step_title || data.topic_title || "Lesson Step";
      document.getElementById("narrationText").innerText = data.narration || "";
      document.getElementById("checkpointQuestionText").innerText = data.checkpoint_question || "Review the elements on the canvas.";
      document.getElementById("studentAnswerInput").value = "";
      const alertBox = document.getElementById("evaluationAlert");
      alertBox.style.display = "none";
    }}

    async function handleSubmitAnswer() {{
      const answer = document.getElementById("studentAnswerInput").value.trim();
      if (!answer) return;

      const res = await fetch("/api/lesson/input", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{ input: answer }})
      }});
      const data = await res.json();

      const alertBox = document.getElementById("evaluationAlert");
      alertBox.style.display = "block";

      if (data.evaluated === "CORRECT") {{
        alertBox.style.background = "#ebfbee";
        alertBox.style.border = "1px solid #2b8a3e";
        alertBox.style.color = "#2b8a3e";
        alertBox.innerText = `✅ Correct! ${{data.tutor_feedback || ""}}`;
        if (data.next_step_available) {{
          setTimeout(() => renderStep(data), 1200);
        }}
      }} else {{
        alertBox.style.background = "#fff9db";
        alertBox.style.border = "1px solid #f59f00";
        alertBox.style.color = "#d9480f";
        alertBox.innerText = `💡 ${{data.tutor_feedback || "Try again!"}}`;
      }}
    }}

    async function applyTool(tool) {{
      const target = document.getElementById("toolTargetInput").value.trim() || "last";
      const note = document.getElementById("toolNoteInput").value.trim();

      let endpoint = `/api/ops/${{tool}}`;
      let payload = {{ target: target }};
      if (tool === "pen") {{
        payload.text = note || "Key Concept";
      }}

      await fetch(endpoint, {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify(payload)
      }});
    }}

    async function handleNav(action) {{
      if (action === "advance") {{
        const res = await fetch("/api/lesson/advance", {{ method: "POST", headers: {{"Content-Type":"application/json"}}, body: JSON.stringify({{force:true}}) }});
        const data = await res.json();
        if (data.success) renderStep(data);
      }} else if (action === "previous") {{
        const res = await fetch("/api/lesson/previous", {{ method: "POST" }});
        const data = await res.json();
        if (data.success) renderStep(data);
      }} else if (action === "redraw") {{
        await fetch("/api/lesson/input", {{ method: "POST", headers: {{"Content-Type":"application/json"}}, body: JSON.stringify({{input:"redraw"}}) }});
      }}
    }}

    // Auto-load on startup
    window.addEventListener("DOMContentLoaded", () => {{
      handleStartTopic();
    }});
  </script>
</body>
</html>
"""
