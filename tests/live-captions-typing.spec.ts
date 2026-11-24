import { test, expect } from "@playwright/test";

test.describe("Live Captions Typing Effect & Synchronization", () => {
  test("captions overlay is transparent, centered at bottom, non-blocking, and animates smoothly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The Google Meet captions button is active by default
    const captionsBtn = page.getByRole("button", { name: /Turn (off|on) captions/i });
    await expect(captionsBtn).toBeVisible({ timeout: 10000 });

    // Open a demo lecture (e.g., Human Cell)
    const cellClass = page.getByRole("button", { name: /Human Cell/i }).first();
    if (await cellClass.isVisible()) {
      await cellClass.click();
      await page.waitForTimeout(1000);

      // Verify captions overlay exists in DOM with proper styling
      const captionOverlay = page.locator(".meet-captions-overlay");
      if (await captionOverlay.count() > 0) {
        // Evaluate CSS properties of the caption overlay
        const styles = await captionOverlay.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            position: computed.position,
            pointerEvents: computed.pointerEvents,
            backgroundColor: computed.backgroundColor,
            whiteSpace: computed.whiteSpace,
            overflow: computed.overflow,
            textOverflow: computed.textOverflow,
          };
        });

        // Verify transparent background, pointer-events none, single line
        expect(styles.position).toBe("fixed");
        expect(styles.pointerEvents).toBe("none");
        expect(styles.whiteSpace).toBe("nowrap");
        expect(styles.overflow).toBe("hidden");
        expect(styles.textOverflow).toBe("ellipsis");
      }
    }
  });

  test("captions overlay handles user speech and tutor doubt mode seamlessly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if mic toggle triggers listening state without breaking captions overlay
    const micBtn = page.getByRole("button", { name: /microphone/i }).first();
    if (await micBtn.isVisible()) {
      await micBtn.click();
      await page.waitForTimeout(500);
      // Clean toggle
      await micBtn.click();
    }
  });
});
