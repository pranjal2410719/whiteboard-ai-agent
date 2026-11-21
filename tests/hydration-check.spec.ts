import { test, expect } from "@playwright/test";

test("Next.js SSR Hydration succeeds without error when non-default session is stored in localStorage", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", err => {
    errors.push(err.message);
  });

  // Pre-set localStorage with a non-default session key (e.g. inclined-diagram)
  await page.addInitScript(() => {
    localStorage.setItem("chalkly.active", "inclined-diagram");
  });

  await page.goto("http://127.0.0.1:3002");
  await page.waitForLoadState("networkidle");

  // Check no Next.js error dialog overlay is present
  await expect(page.locator("[data-nextjs-dialog-overlay]")).toHaveCount(0);

  // Check no error dialogs or toasts inside nextjs-portal
  const portalText = await page.locator("nextjs-portal").innerText().catch(() => "");
  expect(portalText).not.toContain("Hydration failed");
  expect(portalText).not.toContain("Recoverable Error");

  // Check no hydration errors logged to console
  const hydrationErrors = errors.filter(e => /hydration|hydrating|didn't match/i.test(e));
  expect(hydrationErrors).toHaveLength(0);

  // Check that the active session smoothly switched to Inclined Plane Mechanics post-mount
  await expect(page.locator(".meet-call-title")).toHaveText("Inclined Plane Mechanics", { timeout: 10000 });
});
