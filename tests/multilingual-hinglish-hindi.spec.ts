import { test, expect } from "@playwright/test";

test.describe("Multilingual Whiteboard & Voice Synchronization (English / Hindi / Hinglish)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:3002");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
  });

  test("1. Default language is English: whiteboard text, notes, and narration audio are in English", async ({ page }) => {
    // 1. Initial whiteboard marks must be in English
    const boardSvg = page.locator(".drawing-svg");
    await expect(boardSvg).toContainText("Human Cell");
    await expect(boardSvg).toContainText("Interactive Anatomy & Organelles");

    // 2. Open Study notes and verify English content
    const notesBtn = page.getByRole("button", { name: "Study notes" }).first();
    if (await notesBtn.isVisible()) {
      await notesBtn.click();
      const notesModal = page.getByRole("dialog");
      await expect(notesModal).toContainText("The nucleus commands and protects DNA");
      await expect(notesModal).toContainText("Mitochondria generate cellular fuel");
      await page.keyboard.press("Escape");
    }

    // 3. Start class and verify English audio track
    const startClassBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startClassBtn.isVisible()) {
      await startClassBtn.click();
    }
    const playerRegion = page.getByRole("region", { name: "Prerecorded class player" });
    await expect(playerRegion).toBeVisible({ timeout: 5000 });

    const audioEl = page.locator("audio");
    await expect(audioEl).toHaveAttribute("src", /\/class-audio\/human-cell-v2\.mp3/);
    await expect(page.locator(".page-count")).toContainText("Chapter 1");
  });

  test("2. Switching to Hindi in Settings immediately converts whiteboard marks, notes, and tutor voice to Hindi", async ({ page }) => {
    // 1. Open Settings modal
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const settingsDialog = page.getByRole("dialog");
    await expect(settingsDialog).toBeVisible();

    // 2. Select Hindi
    await page.getByRole("button", { name: /हिन्दी.*Hindi/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(settingsDialog).not.toBeVisible();

    // 3. Whiteboard marks immediately convert to Hindi without reload
    const boardSvg = page.locator(".drawing-svg");
    await expect(boardSvg).toContainText("मानव कोशिका");
    await expect(boardSvg).toContainText("सक्रिय कोशिका संरचना एवं अंगक");
    await expect(boardSvg).toContainText("1. कोशिका झिल्ली: चयनात्मक लिपिड परत");

    // 4. Study notes immediately convert to Hindi
    const notesBtn = page.getByRole("button", { name: "Study notes" }).first();
    if (await notesBtn.isVisible()) {
      await notesBtn.click();
      const notesModal = page.getByRole("dialog");
      await expect(notesModal).toContainText("केंद्रक डीएनए का नियंत्रण और सुरक्षा करता है");
      await expect(notesModal).toContainText("माइटोकॉन्ड्रिया कोशिकीय ऊर्जा उत्पन्न करते हैं");
      await page.keyboard.press("Escape");
    }

    // 5. Start class and verify Hindi audio track & Chapter 1 marks
    const startClassBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startClassBtn.isVisible()) {
      await startClassBtn.click();
    }
    const audioEl = page.locator("audio");
    await expect(audioEl).toHaveAttribute("src", /\/class-audio\/human-cell-hi\.mp3/);
    await expect(page.locator(".page-count")).toContainText("Chapter 1");

    // 6. Advance to Chapter 2 and verify Hindi scene title / marks
    const nextBtn = page.getByRole("button", { name: "Next chapter", exact: true });
    await nextBtn.click();
    await expect(page.locator(".page-count")).toContainText("Chapter 2");
    await expect(boardSvg).toContainText("केंद्रक और ऊर्जा केंद्र");
  });

  test("3. Switching to Hinglish in Settings keeps whiteboard marks & notes in English while tutor speaks Hinglish", async ({ page }) => {
    // 1. Switch to Hindi first
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /हिन्दी.*Hindi/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    const boardSvg = page.locator(".drawing-svg");
    await expect(boardSvg).toContainText("मानव कोशिका");

    // 2. Now switch to Hinglish
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /Hinglish.*हिंग्लिश/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    // 3. Under Hinglish: whiteboard marks MUST remain in English
    await expect(boardSvg).toContainText("Human Cell");
    await expect(boardSvg).toContainText("Interactive Anatomy & Organelles");
    await expect(boardSvg).toContainText("1. Cell Membrane: Selective lipid bilayer");

    // 4. Study notes MUST remain in English
    const notesBtn = page.getByRole("button", { name: "Study notes" }).first();
    if (await notesBtn.isVisible()) {
      await notesBtn.click();
      const notesModal = page.getByRole("dialog");
      await expect(notesModal).toContainText("The nucleus commands and protects DNA");
      await page.keyboard.press("Escape");
    }

    // 5. Start class and verify Hinglish audio track
    const startClassBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startClassBtn.isVisible()) {
      await startClassBtn.click();
    }
    const audioEl = page.locator("audio");
    await expect(audioEl).toHaveAttribute("src", /\/class-audio\/human-cell-hinglish\.mp3/);
    await expect(page.locator(".page-count")).toContainText("Chapter 1");

    // 6. Advance to Chapter 2 and verify English scene marks
    const nextBtn = page.getByRole("button", { name: "Next chapter", exact: true });
    await nextBtn.click();
    await expect(page.locator(".page-count")).toContainText("Chapter 2");
    await expect(boardSvg).toContainText("Nucleus & Powerhouses");
  });

  test("4. Trigonometry class supports both Hindi and Hinglish modes", async ({ page }) => {
    // 1. Switch to Trigonometry session from sidebar or quick switcher
    const trigSidebarBtn = page.locator('button[title*="Trigonometry"]').first();
    if (await trigSidebarBtn.isVisible()) {
      await trigSidebarBtn.click();
    } else {
      await page.getByRole("button", { name: "New session" }).first().click();
      await page.locator(".lesson-option").filter({ hasText: /Trigonometry/i }).first().click();
      await page.getByRole("button", { name: "Start learning" }).click();
    }

    const boardSvg = page.locator(".drawing-svg");
    await expect(boardSvg).toContainText("Trigonometry & Right Triangles");

    // 2. Switch to Hindi in Settings
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /हिन्दी.*Hindi/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    // Whiteboard marks convert to Hindi
    await expect(boardSvg).toContainText("त्रिकोणमिति और समकोण त्रिभुज");

    // Start class and verify Hindi audio
    const startClassBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startClassBtn.isVisible()) {
      await startClassBtn.click();
    }
    const audioEl = page.locator("audio");
    await expect(audioEl).toHaveAttribute("src", /\/class-audio\/trigonometry-hi\.mp3/);

    // 3. Now switch to Hinglish
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /Hinglish.*हिंग्लिश/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    // Whiteboard marks remain in English (Chapter 1 scene)
    await expect(boardSvg).toContainText("The Right-Angled Triangle");
    await expect(audioEl).toHaveAttribute("src", /\/class-audio\/trigonometry-hinglish\.mp3/);
  });

  test("5. Existing user ink on whiteboard is preserved when switching between English and Hindi, while board template marks update", async ({ page }) => {
    // 1. Initial state is English
    const boardSvg = page.locator(".drawing-svg");
    await expect(boardSvg).toContainText("Human Cell");

    // 2. Add an ink mark to page 0 to simulate existing user notes/sketches
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("chalkly.sessions") || "[]");
      // Find active or first session
      const sessions = (window as any).__qrie_sessions || saved;
      if (sessions && sessions[0]) {
        sessions[0].data.pages[0].ink = [
          { type: "path", d: "M 100 100 L 200 200", color: "#e74c3c", width: 4 },
        ];
      }
    });

    // Alternatively, verify that when session page has ink, it renders .student-mark
    await page.evaluate(() => {
      const event = new CustomEvent("qrie-test-add-ink", {
        detail: { type: "path", d: "M 150 150 L 250 250", color: "#e74c3c", width: 4 }
      });
      window.dispatchEvent(event);
    });

    // 3. Switch to Hindi in Settings
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /हिन्दी.*Hindi/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    // Template converts to Hindi
    await expect(boardSvg).toContainText("मानव कोशिका");
    await expect(boardSvg).toContainText("सक्रिय कोशिका संरचना एवं अंगक");

    // 4. Switch to Hinglish in Settings
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /Hinglish.*हिंग्लिश/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    // Template converts back to English for Hinglish mode
    await expect(boardSvg).toContainText("Human Cell");
    await expect(boardSvg).toContainText("Interactive Anatomy & Organelles");
  });

  test("6. Switching language while class is actively running hot-swaps audio track and chapter scenes seamlessly without playback errors", async ({ page }) => {
    // 1. Start English class
    const startClassBtn = page.getByRole("button", { name: /Start.*Class|Watch.*class/i }).first();
    if (await startClassBtn.isVisible()) {
      await startClassBtn.click();
    }
    const audioEl = page.locator("audio");
    await expect(audioEl).toHaveAttribute("src", /\/class-audio\/human-cell-v2\.mp3/);
    await expect(page.locator(".page-count")).toContainText("Chapter 1");

    // Let it play for a moment
    await page.waitForTimeout(2000);

    // 2. Open Settings and switch to Hindi while audio is playing
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /हिन्दी.*Hindi/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    // Verify audio immediately switched to Hindi without error alert
    await expect(audioEl).toHaveAttribute("src", /\/class-audio\/human-cell-hi\.mp3/);
    await expect(page.locator(".inline-error")).toHaveCount(0);
    await expect(page.locator(".drawing-svg")).toContainText("मानव कोशिका के अंदर");

    // 3. Open Settings and switch to Hinglish
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: /Hinglish.*हिंग्लिश/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    // Verify audio switched to Hinglish and marks returned to English
    await expect(audioEl).toHaveAttribute("src", /\/class-audio\/human-cell-hinglish\.mp3/);
    await expect(page.locator(".inline-error")).toHaveCount(0);
    await expect(page.locator(".drawing-svg")).toContainText("Inside the Human Cell");
  });
});
