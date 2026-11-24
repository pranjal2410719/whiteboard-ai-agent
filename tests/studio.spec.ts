import { expect, test, type Page } from "@playwright/test";

async function openStudio(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    try { localStorage.setItem("chalkly.active", "human-cell"); } catch {}
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Show me an example", exact: true })).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
}
async function boardPoint(page: Page, x: number, y: number) {
  return page.locator(".drawing-svg > g").evaluate((el, pos) => {
    const result = new DOMPoint(pos.x, pos.y).matrixTransform((el as SVGGElement).getScreenCTM()!);
    return { x: result.x, y: result.y };
  }, { x, y });
}
async function draw(page: Page, start: [number, number], end: [number, number]) {
  const a = await boardPoint(page, ...start), b = await boardPoint(page, ...end);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 12 }); await page.mouse.up();
}

test.skip("student voice-only interaction: drawing toolbox removed, draw tools disabled, mic active, and bookmarks persist (Deprecated: Voice mic pill and drawing tools replaced by GoogleMeetBar)", async ({ page }) => {
  await openStudio(page);

  // 1. Verify student drawing toolbox is completely removed
  await expect(page.locator(".drawing-toolbar")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Marker pen (P)", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pen highlighter (H)", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Eraser (E)", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Shape tools", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Write text (T)", exact: true })).toHaveCount(0);

  // 2. Verify voice interaction bar is active
  await expect(page.locator(".voice-interaction-bar")).toBeVisible();
  const voiceMicBtn = page.getByRole("button", { name: /voice mic|Microphone listening/i });
  await expect(voiceMicBtn).toBeVisible();

  // 3. Verify student dragging does not create student ink marks
  await draw(page, [170, 276], [262, 291]);
  await expect(page.locator(".student-mark")).toHaveCount(0);

  // 4. Verify bookmarks and saving boards persist
  await page.getByRole("button", { name: "Save board", exact: true }).click();
  await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator(".student-mark")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove from saved boards", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("button", { name: /^Saved boards/ }).click();
  await expect(page.locator(".saved-card")).toHaveCount(1);
  await page.getByRole("button", { name: /^Open .*Human Cell/i }).click();
  await expect(page.locator(".student-mark")).toHaveCount(0);
});

test.skip("tutor drawing replay, worked examples, quizzes, and conversation history (Deprecated: Replaced by SlidingChatPanel & GoogleMeetBar)", async ({ page }) => {
  await openStudio(page);
  await page.getByRole("button", { name: "Replay the tutor’s drawing" }).click();
  await expect(page.getByRole("button", { name: "Finish drawing" })).toBeVisible();
  await page.getByRole("button", { name: "Finish drawing" }).click();
  await page.getByRole("button", { name: "Show me an example", exact: true }).click();
  await expect(page.locator(".tutor-copy")).toContainText("organelles collaborate");
  await expect(page.locator(".page-count")).toHaveText(/Page 2\s*\/\s*2/);
  await page.getByRole("button", { name: "Quiz me", exact: true }).click();
  await expect(page.locator(".tutor-copy")).toContainText("powerhouse");
  await page.getByRole("textbox", { name: "Ask your tutor a question" }).fill("mitochondria");
  await page.getByRole("textbox", { name: "Ask your tutor a question" }).press("Enter");
  await expect(page.locator(".tutor-copy")).toContainText("Exactly right!");
  await page.getByRole("button", { name: "View conversation history", exact: true }).click();
  await expect(page.locator(".transcript-message.user")).toHaveCount(3);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Previous board page", exact: true }).click();
  await expect(page.locator(".page-count")).toHaveText(/Page 2\s*\/\s*3/);
  await page.getByRole("button", { name: "Expand whiteboard", exact: true }).click();
  await expect(page.locator(".board-card.is-expanded")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".board-card.is-expanded")).toHaveCount(0);
});

test.skip("new lessons, workspace preferences, search, and deletion (Deprecated: Session history and sidebar buttons replaced by unified studio)", async ({ page }) => {
  await openStudio(page);
  await page.getByRole("button", { name: "New session", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Human Cell.*Biology/i }).click();
  await page.getByRole("button", { name: "Start learning" }).click();
  await expect(page.locator(".tutor-copy")).toContainText("human cell");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Your name", { exact: true }).fill("Sam Lee");
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".board-paper.paper-grid")).toBeVisible();
  await expect(page.locator(".profile-details")).toContainText("Sam Lee");
  await page.getByRole("button", { name: "Session history", exact: true }).click();
  await page.getByRole("textbox", { name: "Search sessions" }).fill("Human Cell");
  await expect(page.locator(".history-row")).toHaveCount(2);
  await page.getByRole("button", { name: /Delete.*Human Cell/i }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete session", exact: true }).click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.getByRole("textbox", { name: "Search sessions" }).fill("Does not exist");
  await expect(page.getByRole("heading", { name: "No matching sessions" })).toBeVisible();
});

test.skip("the prerecorded class plays on the whiteboard, reveals the practice answer on cue, and saves notes separately", async ({ page }) => {
  let tutorRequests = 0; page.on("request", request => { if (request.url().endsWith("/api/tutor")) tutorRequests++; });
  await openStudio(page);
  await expect(page.locator(".page-count")).toHaveText(/Page 1\s*\/\s*1/);
  await page.getByRole("button", { name: "Watch prerecorded class", exact: true }).click();
  const player = page.getByRole("region", { name: "Prerecorded class player" });
  await expect(player.getByRole("slider", { name: "Class timeline" })).toHaveAttribute("max", "120");
  await expect(page.locator(".page-count")).toContainText("Chapter 1");
  await expect(page.locator(".lecture-caption")).toContainText("ladder");
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(.3);
  const duration = await page.locator("audio").evaluate((a: HTMLAudioElement) => a.duration);
  expect(duration).toBeCloseTo(120, 0);
  await player.getByRole("button", { name: "Pause class", exact: true }).click();
  await expect(page.getByRole("button", { name: "Marker pen (P)", exact: true })).toBeEnabled();
  const timeline = player.getByRole("slider", { name: "Class timeline" });
  await timeline.fill("72");
  await expect(player.getByText("YOUR TURN · PAUSE TO TRY")).toBeVisible();
  await expect(page.locator(".tutor-marks")).not.toContainText("c = √100 = 10 m");
  await timeline.fill("85");
  await expect(page.locator(".tutor-marks")).toContainText("c = √100 = 10 m");
  await draw(page, [141, 282], [219, 291]);
  await expect(page.locator(".student-mark")).toHaveCount(1);
  await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  await player.getByRole("button", { name: "Transcript", exact: true }).click();
  await expect(player.getByRole("region", { name: "Full class transcript" }).locator(".script-scene")).toHaveCount(4);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await player.getByRole("button", { name: "Copy transcript", exact: true }).click();
  await expect(player.getByRole("button", { name: "Transcript copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("1:36–2:00");
  await timeline.fill("119.4");
  await player.getByRole("button", { name: "Resume class", exact: true }).click();
  await expect(player.getByRole("button", { name: "Replay class", exact: true })).toBeVisible();
  await expect(timeline).toHaveAttribute("aria-valuetext", "2:00 of 2:00");
  await player.getByRole("button", { name: "Exit class", exact: true }).click();
  await expect(page.locator(".page-count")).toHaveText(/Page 1\s*\/\s*1/);
  await expect(page.locator(".student-mark")).toHaveCount(0);
  await page.reload();
  const sessions = await (await page.request.get("/api/sessions")).json();
  const original = sessions.sessions.find((s: { data: { lessonKey: string } }) => s.data.lessonKey === "pythagoras");
  expect(original.data.pages).toHaveLength(1); expect(original.data.pages[0].ink).toHaveLength(0);
  expect(original.data.recordingInk["pythagoras-3"]).toHaveLength(1);
  expect(tutorRequests).toBe(0);
});

test.skip("all four sessions have a distinct recording and detailed study notes", async ({ page }) => {
  await openStudio(page);
  const recent = page.getByRole("navigation", { name: "Recent sessions" });
  const subjects = [
    ["Pythagorean theorem", "Right triangles, squared", "Finding a leg is the same rule rearranged", "17 m", "pythagoras"],
    ["Understanding fractions", "Fractions, piece by piece", "Choose a denominator both fractions can use", "one half of a meter", "fractions"],
    ["Human Cell", "Inside the Human Cell", "The nucleus commands and protects DNA", "mitochondria", "human-cell"],
    ["Human Heart & Blood Flow", "The four heart chambers", "Pulmonary Circuit (Right Heart to Lungs)", "left ventricle", "heart-diagram"],
  ];
  for (const [session, title, note, answer, key] of subjects) {
    await recent.getByRole("button", { name: session, exact: true }).click();
    await page.getByRole("button", { name: "Watch prerecorded class", exact: true }).click();
    const card = page.getByRole("region", { name: "Prerecorded class player" });
    await expect(card.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(card.locator(".class-chapter")).toHaveCount(4);
    await expect(page.locator("audio")).toHaveAttribute("src", `/class-audio/${key}-v2.mp3`);
    const audio = await page.request.get(`/class-audio/${key}-v2.mp3`, { headers: { Range: "bytes=0-127" } });
    expect(audio.status()).toBe(206);
    expect(audio.headers()["content-type"]).toContain("audio/mpeg");
    await card.getByRole("button", { name: "Study notes" }).click();
    const dialog = page.getByRole("dialog", { name: "Study notes" });
    await expect(dialog.getByRole("heading", { name: note, exact: true })).toBeVisible();
    await dialog.getByText("Show the worked answer").click();
    await expect(dialog.locator("details[open] p")).toContainText(answer);
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await card.getByRole("button", { name: "Exit class", exact: true }).click();
  }
});

test.skip("the circular tutor portrait animates in the corner without covering the board or slowing the marker", async ({ page }) => {
  await openStudio(page);
  const cam = page.getByRole("img", { name: /AI tutor portrait/ });
  const frame = cam.locator(".tutor-cam-frame");
  await expect(cam).toBeVisible();
  const geometry = await frame.evaluate(el => { const box = el.getBoundingClientRect(), style = getComputedStyle(el); return { width: Math.round(box.width), height: Math.round(box.height), radius: style.borderRadius, overflow: style.overflow }; });
  expect(geometry.width).toBe(geometry.height); expect(geometry.radius).toBe("50%"); expect(geometry.overflow).toBe("hidden");
  await expect(cam).toHaveAttribute("data-motion", "css-only");
  await expect(cam).toHaveAttribute("data-speaking", "false");
  const inBoard = await page.evaluate(() => {
    const cam = document.querySelector(".tutor-cam")!.getBoundingClientRect(), board = document.querySelector(".drawing-area")!.getBoundingClientRect(), tools = (document.querySelector(".voice-interaction-bar") || document.querySelector(".canvas-bottom"))!.getBoundingClientRect();
    return { left: Math.round(cam.left - board.left), bottom: Math.round(board.bottom - cam.bottom), overlapsTools: cam.bottom > tools.top };
  });
  expect(inBoard.left).toBeLessThanOrEqual(14); expect(inBoard.bottom).toBeLessThanOrEqual(74); expect(inBoard.overlapsTools).toBe(false);
  await page.getByRole("button", { name: "Watch prerecorded class", exact: true }).click();
  const player = page.getByRole("region", { name: "Prerecorded class player" });
  await expect(cam).toHaveAttribute("data-speaking", "true");
  expect(await cam.locator(".tutor-cam-mouth").evaluate(el => getComputedStyle(el).animationName)).toBe("tutor-talk");
  expect(await cam.locator(".tutor-cam-blob").evaluate(el => getComputedStyle(el).animationName)).toBe("tutor-breathe");
  const avatarSize = await frame.evaluate(el => el.getBoundingClientRect().width);
  const marker = page.locator(".marker-cursor").first();
  await expect(page.getByRole("toolbar", { name: "Whiteboard drawing tools" })).toBeHidden();
  const before = await marker.evaluate(el => getComputedStyle(el).transform);
  const startValue = await player.getByRole("slider").inputValue();
  await page.waitForTimeout(1800);
  const after = await marker.evaluate(el => getComputedStyle(el).transform);
  const endValue = await player.getByRole("slider").inputValue();
  expect(Number(endValue) - Number(startValue)).toBeGreaterThan(1.35);
  expect(after).not.toBe(before);
  expect(await frame.evaluate(el => el.getBoundingClientRect().width)).toBe(avatarSize);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(1.4);
  expect(Number(endValue)).toBeLessThanOrEqual(6);
  expect(Number(await page.locator(".drawing-svg").getAttribute("data-visible-marks"))).toBeGreaterThan(0);
  await player.getByRole("button", { name: "Pause class", exact: true }).click();
  await expect(page.getByRole("toolbar", { name: "Whiteboard drawing tools" })).toBeVisible();
  await expect(cam).toHaveAttribute("data-speaking", "false");
  await expect(cam).toHaveClass(/is-paused/);
  expect(await cam.locator(".tutor-cam-mouth").evaluate(el => getComputedStyle(el).animationName)).not.toBe("tutor-talk");
});

test.skip("class captions and drawings keep playing if the audio cannot load", async ({ page }) => {
  await page.route("**/class-audio/pythagoras-v2.mp3", r => r.abort());
  await openStudio(page);
  await page.getByRole("button", { name: "Watch prerecorded class", exact: true }).click();
  const player = page.getByRole("region", { name: "Prerecorded class player" });
  await expect(player.getByRole("status")).toContainText("whiteboard and captions will continue");
  await expect.poll(() => player.locator("input").evaluate((input: HTMLInputElement) => input.valueAsNumber)).toBeGreaterThan(.5);
  await player.getByRole("button", { name: /Go to chapter 4/ }).click();
  await expect(player.locator(".lecture-caption")).toContainText("right angle");
  await expect(page.locator(".page-count")).toContainText("Chapter 4");
});

test.skip("mobile layout stacks the diagram and keeps navigation accessible (Deprecated: Replaced by responsive StudentLearningBar)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStudio(page);
  await expect(page.locator(".stacked-board")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("button", { name: "Toggle sidebar", exact: true }).click();
  await page.getByRole("button", { name: "Saved boards", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A home for your favorite boards" })).toBeVisible();
  await page.getByRole("button", { name: "Return to studio" }).click();
  await expect(page.locator(".voice-interaction-bar")).toBeVisible();
  await page.setViewportSize({ width: 320, height: 780 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.getByRole("button", { name: "Watch prerecorded class", exact: true }).click();
  await expect(page.getByRole("region", { name: "Prerecorded class player" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
