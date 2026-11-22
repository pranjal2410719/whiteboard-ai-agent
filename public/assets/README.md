# Whiteboard Lecture Assets & Diagrams

This directory (`assets/` / `public/assets/`) stores visual assets, diagrams, charts, and illustrations used on the live Qrie AI whiteboard.

## How it works

1. **Asset Accessibility**:
   - Files placed in this folder are publicly served by the Next.js App Router under `/assets/<filename>`.
   - Both `./assets` and `./assests` symlink directly to `public/assets/` for seamless access.

2. **Supported Formats**:
   - **Vector SVG (`.svg`)** *(Recommended)*: Scales losslessly on any screen density or whiteboard zoom level.
   - **Raster Images (`.png`, `.jpg`, `.jpeg`, `.webp`)**: Transparent PNGs or WebP diagrams work well for photographic or microscopic content.

3. **Whiteboard Integration**:
   - The whiteboard surface is normalized to **1000 × 330 units**.
   - Standard diagram layout places the image at `x=515, y=30, w=430, h=270` on the right side of the board, leaving the left column (`x=55..480`) for Professor's handwritten explanations, titles, and formulas.
   - Images can be inserted onto the whiteboard via:
     - The lesson catalog (e.g. `cell-diagram`, `water-diagram`).
     - Directly via `draw_on_whiteboard` tool calls from Gemini / OpenAI using `{ type: "image", src: "/assets/<filename>", alt: "..." }`.

4. **Vision Grounding & Precision Annotations**:
   - When an asset image is on the whiteboard, its presence and spatial bounding boxes are passed into the Vision Perception & Precision Grounding Engine (`src/lib/vision/`).
   - **Region-based Annotations**: You can register known regions for your diagram (such as organelle coordinates, circuit parts, or mechanical vectors). When a student asks:
     - *"Circle the battery"*
     - *"Highlight the mitochondria"*
     - *"Underline the normal force"*
     - *"Label the resistor"*
     Professor addresses the exact coordinates of that part and draws precision vector highlights, arrows, callout boxes, or underlines directly over the asset without covering textual labels.
   - **Freehand Visual Grounding**: For custom images without pre-registered regions, the Vision Engine extracts visual landmarks and dynamically draws arrows, pointers, bounding boxes, and handwriting around the image to explain the concept.
