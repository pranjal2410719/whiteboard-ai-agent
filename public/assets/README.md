# Whiteboard Lecture Assets & Diagrams

This directory (`assets/` / `public/assets/`) stores visual assets, diagrams, charts, and illustrations used on the live Chalkly AI whiteboard.

## How it works

1. **Asset Accessibility**:
   - Files placed in this folder are publicly served by the Next.js App Router under `/assets/<filename>`.
   - Both `./assets` and `./assests` symlink directly to `public/assets/` for seamless access.

2. **Supported Formats**:
   - **Vector SVG (`.svg`)** *(Recommended)*: Scales losslessly on any screen density or whiteboard zoom level.
   - **Raster Images (`.png`, `.jpg`, `.jpeg`, `.webp`)**: Transparent PNGs or WebP diagrams work well for photographic or microscopic content.

3. **Whiteboard Integration**:
   - The whiteboard surface is normalized to **1000 × 330 units**.
   - Standard diagram layout places the image at `x=515, y=30, w=430, h=270` on the right side of the board, leaving the left column (`x=55..480`) for the AI tutor's handwritten explanations, titles, and formulas.
   - Images can be inserted onto the whiteboard via:
     - The **"Insert Diagram / Asset"** button in the whiteboard toolbar.
     - The lesson catalog (e.g. `cell-diagram`, `water-diagram`).
     - Directly via `draw_on_whiteboard` tool calls from Gemini / OpenAI using `{ type: "image", src: "/assets/<filename>", alt: "..." }`.

4. **AI Tutor Description & Annotations**:
   - When an asset image is on the whiteboard, its presence and spatial bounding boxes are passed into the model's spatial context through `describePage()`.
   - **Region-based Annotations**: You can register known regions for your diagram in `assets-manifest.json` (such as organelle coordinates, circuit parts, or mechanical vectors). When a student asks:
     - *"Circle the battery"*
     - *"Highlight the mitochondria"*
     - *"Underline the normal force"*
     - *"Label the resistor"*
     The AI tutor addresses the exact coordinates of that part and draws precision vector highlights, arrows, callout boxes, or underlines directly over the asset.
   - **Freehand Visual Grounding**: For custom images without pre-registered regions, the AI tutor receives the image's coordinate bounds and dynamically draws arrows, pointers, bounding boxes, and handwriting around the image to explain the concept.
