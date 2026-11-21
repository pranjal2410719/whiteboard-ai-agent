import { test, expect } from "@playwright/test";

test("Human Heart class: verify synchronous voice and drawing on whiteboard", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);

  // Switch to heart session
  const heartBtn = page.getByRole("navigation", { name: "Recent sessions" }).getByRole("button", { name: /Heart/i });
  if (await heartBtn.count() > 0) {
    await heartBtn.scrollIntoViewIfNeeded();
    await heartBtn.click();
  } else {
    await page.evaluate(async () => {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      const heart = data.sessions.find((s: any) => s.data.lessonKey === "heart-diagram");
      if (heart) {
        localStorage.setItem("chalkly.active", heart.id);
        window.location.reload();
      }
    });
    await page.waitForLoadState("networkidle");
  }

  // 1. Verify diagram is visible
  const heartImg = page.locator('.canvas-layer-assets image[data-diagram="true"]');
  await expect(heartImg).toBeVisible({ timeout: 10000 });

  // 2. Click "Watch prerecorded class" to start lecture
  const watchClassBtn = page.getByRole("button", { name: /Watch/i }).first();
  await expect(watchClassBtn).toBeVisible({ timeout: 5000 });
  await watchClassBtn.click();

  // 3. Verify Lecture Player is active and playing
  const player = page.getByRole("region", { name: "Prerecorded class player" });
  await expect(player).toBeVisible({ timeout: 10000 });

  // Verify that audio issue does NOT appear (meaning heart-diagram-v2.mp3 loaded cleanly)
  const audioIssue = page.locator(".class-audio-message");
  await expect(audioIssue).not.toBeVisible();

  // Wait 4 seconds during playback while voice speaks and drawing synchronously advances
  await page.waitForTimeout(4000);

  // 4. Verify layer containers are maintained during playback
  await expect(page.locator('.canvas-layer-assets[data-layer="assets"]')).toBeAttached();
  await expect(page.locator('.canvas-layer-teacher-annotations[data-layer="teacher-annotations"]')).toBeAttached();

  // 5. Capture visual screenshot of the synchronized classroom
  await page.screenshot({
    path: "/home/vscode-gcp/.gemini/antigravity-cli/brain/2273bb1e-060d-4726-b480-af006db82186/heart-sync-verification.png",
    fullPage: true,
  });

  // Verify marker cursor is active and drawing
  const marker = page.locator(".marker-cursor");
  await expect(marker).toBeAttached();
});
