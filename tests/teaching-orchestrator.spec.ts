import { test, expect } from "@playwright/test";
import { PedagogyStateMachine } from "@/lib/pedagogy/state-machine";
import { PersonaManager } from "@/lib/pedagogy/personas";
import { ActionDispatcher } from "@/lib/pedagogy/action-dispatcher";
import { CurriculumTaxonomy } from "@/lib/curriculum/taxonomy";
import { PreparationEngine } from "@/lib/curriculum/preparation-engine";

test.describe("Phase 7: Dynamic AI Teaching Orchestrator", () => {
  const prepared = PreparationEngine.prepareClassroom({
    subjectId: "biology",
    chapterId: "cardiovascular-system",
    topicId: "heart-blood-flow",
    studentLevel: "intermediate"
  });

  test("State Machine: progression across all 5 pedagogical stages", () => {
    // 1. Initial State in INTRODUCE
    let state = PedagogyStateMachine.initialState(prepared.classroomContext, "socratic");
    expect(state.stage).toBe("INTRODUCE");
    expect(state.persona).toBe("socratic");
    expect(state.turnCount).toBe(0);

    // 2. Student asks to start -> advances to VISUAL_DEMO
    const step1 = PedagogyStateMachine.evaluateStep("Let's begin the class", state, prepared.classroomContext);
    expect(step1.recommendedNextStage).toBe("VISUAL_DEMO");
    expect(step1.isCorrect).toBe(true);

    state = PedagogyStateMachine.transition(state, step1, ["right-atrium"]);
    expect(state.stage).toBe("VISUAL_DEMO");
    expect(state.coveredLandmarks).toContain("right-atrium");
    expect(state.turnCount).toBe(1);

    // 3. Demo delivered -> advances to CHECKPOINT
    const step2 = PedagogyStateMachine.evaluateStep("I understand right atrium", state, prepared.classroomContext);
    expect(step2.recommendedNextStage).toBe("CHECKPOINT");

    state = PedagogyStateMachine.transition(state, step2);
    expect(state.stage).toBe("CHECKPOINT");

    // 4. Student exhibits misconception -> triggers EVALUATE_AND_REMEDIATE
    const step3 = PedagogyStateMachine.evaluateStep("Because deoxygenated blood is blue!", state, prepared.classroomContext);
    expect(step3.isCorrect).toBe(false);
    expect(step3.recommendedNextStage).toBe("EVALUATE_AND_REMEDIATE");
    expect(step3.misconceptionDetected).toBeDefined();

    state = PedagogyStateMachine.transition(state, step3);
    expect(state.stage).toBe("EVALUATE_AND_REMEDIATE");
    expect(state.activeMisconceptions.length).toBeGreaterThan(0);
    expect(state.studentUnderstandingScore).toBeLessThan(0.8);

    // 5. Correct remediation understanding -> advances toward SYNTHESIS
    const step4 = PedagogyStateMachine.evaluateStep(
      "Ah, the septum divides the sides so blood never mixes, and high pressure flows into aorta to the body",
      state,
      prepared.classroomContext
    );
    expect(step4.isCorrect).toBe(true);

    state = PedagogyStateMachine.transition(state, step4, ["septum", "aorta"]);
    expect(state.studentUnderstandingScore).toBeGreaterThan(0.4);
    expect(state.coveredLandmarks).toContain("septum");
  });

  test("Persona Manager: dynamic adaptation and prompt directive generation", () => {
    expect(PersonaManager.resolveDefaultPersona("beginner")).toBe("mentor");
    expect(PersonaManager.resolveDefaultPersona("intermediate")).toBe("socratic");
    expect(PersonaManager.resolveDefaultPersona("advanced")).toBe("professor");

    // Explicit request detection
    expect(PersonaManager.resolveDefaultPersona("intermediate", "Can you explain like a peer?")).toBe("peer");
    expect(PersonaManager.resolveDefaultPersona("beginner", "Switch to professor mode")).toBe("professor");

    const directive = PersonaManager.getPromptDirective("professor");
    expect(directive).toContain("ACADEMIC PROFESSOR");
    expect(directive).toContain("Analytical, precise");
  });

  test("Action Dispatcher: parses action tags, cleans speech narration, and creates verified CIE marks", () => {
    const rawAiText = `Here is the entrance to the heart.
[ACTION:highlight element="right-atrium"]
Notice how blood enters through the vena cava into this chamber.
[ACTION:arrow from="right-atrium" to="right-ventricle"]
Next, it flows through the tricuspid valve into the right ventricle.`;

    const { narrationText, actions } = ActionDispatcher.parseActionsFromText(rawAiText);
    expect(narrationText).not.toContain("[ACTION:");
    expect(narrationText).toContain("Here is the entrance to the heart.");
    expect(narrationText).toContain("Notice how blood enters through the vena cava into this chamber.");

    expect(actions.length).toBe(2);
    expect(actions[0].type).toBe("highlight");
    expect(actions[0].elementId).toBe("right-atrium");
    expect(actions[1].type).toBe("arrow");
    expect(actions[1].elementId).toBe("right-atrium");
    expect(actions[1].toElementId).toBe("right-ventricle");

    // Dispatch actions against the pre-rendered heart page
    const { marks, executedActions } = ActionDispatcher.dispatchActions(
      actions,
      prepared.sessionData.pages[0],
      "heart-diagram"
    );

    expect(marks.length).toBeGreaterThan(0);
    expect(executedActions.length).toBe(2);
    // Verifies layer isolation: marks created on teacher-annotations
    marks.forEach(m => {
      expect(m.layer === "teacher-annotations" || m.annotation === true).toBe(true);
    });
  });

  test("API: POST /api/tutor dynamically orchestrates live classroom turn with CIE marks", async ({ request }) => {
    // 1. Create a prepared classroom session
    const createRes = await request.post("/api/sessions", {
      data: {
        subjectId: "biology",
        chapterId: "cardiovascular-system",
        topicId: "heart-blood-flow",
        studentLevel: "intermediate"
      }
    });
    expect(createRes.status()).toBe(201);
    const { session } = await createRes.json();
    const sessionId = session.id;

    // 2. Ask the tutor a question about right atrium
    const tutorRes = await request.post("/api/tutor", {
      data: {
        sessionId,
        message: "Where does deoxygenated blood first enter the heart?"
      }
    });
    expect(tutorRes.status()).toBe(200);
    const tutorData = await tutorRes.json();
    expect(tutorData.session).toBeDefined();
    expect(tutorData.drew).toBe(true);

    const latestAssistantMessage = tutorData.session.data.messages.filter((m: any) => m.role === "assistant").pop();
    expect(latestAssistantMessage).toBeDefined();
    expect(latestAssistantMessage.content.length).toBeGreaterThan(20);

    // Verifies new teacher annotation marks were added to the active page
    const activePage = tutorData.session.data.pages[0];
    const annotationMarks = activePage.marks.filter((m: any) => m.annotation || m.layer === "teacher-annotations");
    expect(annotationMarks.length).toBeGreaterThan(0);
  });

  test("UI: Live in-class interaction displays dynamic AI teacher explanation and CIE annotations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Start a prepared class via 3-step picker
    await page.getByRole("button", { name: "New session", exact: true }).click();
    await page.getByRole("tab", { name: "3-Step Curriculum Explorer" }).click();
    await page.getByTestId("subject-card-biology").click();
    await page.getByTestId("chapter-item-cardiovascular-system").click();
    await page.getByTestId("start-prepared-class-btn").click();

    // Dialog closes and board appears
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const finishBtn = page.getByRole("button", { name: "Finish drawing" });
    if (await finishBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await finishBtn.click();
    }

    // Submit a student question via the in-class query input
    const queryInput = page.getByPlaceholder("Ask your tutor a question…");
    await expect(queryInput).toBeVisible();
    await queryInput.fill("Walk me through the first step of blood flow");
    await queryInput.press("Enter");

    // Verify response arrives and tutor panel updates
    await expect(page.locator(".tutor-copy")).toBeVisible({ timeout: 10000 });
    const tutorCopyText = await page.locator(".tutor-copy").innerText();
    expect(tutorCopyText.length).toBeGreaterThan(20);

    // Verify annotations layer contains marks rendered in DOM
    const annotationsLayer = page.locator(".canvas-layer-teacher-annotations");
    await expect(annotationsLayer).toBeAttached();
  });
});
