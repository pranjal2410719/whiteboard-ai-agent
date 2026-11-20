import { fail, workspaceId } from "@/lib/store";
import { LearnerAdaptiveModel } from "@/lib/lam/adaptive-model";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const owner = await workspaceId();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;

    const profiles = await LearnerAdaptiveModel.getProfiles(owner, subjectId, topicId);
    const adaptiveDirectives = LearnerAdaptiveModel.generateAdaptiveDirectives(profiles);

    return Response.json({
      profiles,
      adaptiveDirectives,
      count: profiles.length,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to retrieve learner mastery profile", 500);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await workspaceId();
    const body = await request.json().catch(() => ({}));

    const { subjectId, topicId, conceptId, isCorrect, misconception } = body;

    if (!subjectId || typeof subjectId !== "string") {
      return fail("subjectId is required");
    }
    if (!topicId || typeof topicId !== "string") {
      return fail("topicId is required");
    }
    if (!conceptId || typeof conceptId !== "string") {
      return fail("conceptId is required");
    }
    if (typeof isCorrect !== "boolean") {
      return fail("isCorrect must be a boolean");
    }

    const profile = await LearnerAdaptiveModel.recordAssessment({
      workspaceId: owner,
      subjectId: subjectId.trim(),
      topicId: topicId.trim(),
      conceptId: conceptId.trim(),
      isCorrect,
      misconception: typeof misconception === "string" && misconception.trim() ? misconception.trim() : undefined,
    });

    return Response.json({
      success: true,
      profile,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to record learner assessment", 500);
  }
}
