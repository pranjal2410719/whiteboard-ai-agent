import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { learnerMastery } from "@/db/schema";

export interface BKTParameters {
  prior: number; // P(L_0)
  transit: number; // P(T) probability of learning
  guess: number; // P(G)
  slip: number; // P(S)
}

export interface MasteryAssessmentInput {
  workspaceId: string;
  subjectId: string;
  topicId: string;
  conceptId: string;
  isCorrect: boolean;
  misconception?: string;
}

export interface ConceptMasteryProfile {
  conceptId: string;
  subjectId: string;
  topicId: string;
  masteryScore: number;
  confidenceLevel: number;
  misconceptions: string[];
  attemptCount: number;
  lastAssessedAt: string;
}

export class LearnerAdaptiveModel {
  static readonly DEFAULT_BKT: BKTParameters = {
    prior: 0.35,
    transit: 0.12,
    guess: 0.15,
    slip: 0.08,
  };

  /**
   * Updates Bayesian Knowledge Tracing probability of mastery given a student response observation.
   */
  static computeUpdatedMastery(
    currentMastery: number,
    isCorrect: boolean,
    params: BKTParameters = this.DEFAULT_BKT
  ): { posterior: number; nextPrior: number } {
    let posterior: number;
    if (isCorrect) {
      const num = currentMastery * (1 - params.slip);
      const denom = num + (1 - currentMastery) * params.guess;
      posterior = num / (denom || 1e-6);
    } else {
      const num = currentMastery * params.slip;
      const denom = num + (1 - currentMastery) * (1 - params.guess);
      posterior = num / (denom || 1e-6);
    }

    // Forward projection for next learning opportunity: P(L_{t+1}) = P(L_t|Obs) + (1 - P(L_t|Obs)) * P(T)
    const nextPrior = posterior + (1 - posterior) * params.transit;
    return {
      posterior: Math.round(posterior * 1000) / 1000,
      nextPrior: Math.round(nextPrior * 1000) / 1000,
    };
  }

  /**
   * Persists a student concept assessment to the database, updating BKT mastery and misconceptions.
   */
  static async recordAssessment(input: MasteryAssessmentInput): Promise<ConceptMasteryProfile> {
    const existing = await db
      .select()
      .from(learnerMastery)
      .where(
        and(
          eq(learnerMastery.workspaceId, input.workspaceId),
          eq(learnerMastery.subjectId, input.subjectId),
          eq(learnerMastery.topicId, input.topicId),
          eq(learnerMastery.conceptId, input.conceptId)
        )
      )
      .limit(1);

    const prevScore = existing[0] ? existing[0].masteryScore : this.DEFAULT_BKT.prior;
    const { nextPrior } = this.computeUpdatedMastery(prevScore, input.isCorrect);

    const misconceptions = existing[0]?.misconceptions ? [...existing[0].misconceptions] : [];
    if (input.misconception && !misconceptions.includes(input.misconception)) {
      misconceptions.push(input.misconception);
    } else if (input.isCorrect && misconceptions.length > 0) {
      // Correct answer resolves oldest misconception
      misconceptions.shift();
    }

    const attemptCount = existing[0] ? existing[0].attemptCount + 1 : 1;
    const confidence = Math.min(1.0, 0.4 + attemptCount * 0.15);

    if (existing[0]) {
      try {
        const [updated] = await db
          .update(learnerMastery)
          .set({
            masteryScore: nextPrior,
            confidenceLevel: confidence,
            misconceptions,
            attemptCount,
            lastAssessedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(learnerMastery.id, existing[0].id))
          .returning();

        if (updated) {
          return {
            conceptId: updated.conceptId,
            subjectId: updated.subjectId,
            topicId: updated.topicId,
            masteryScore: updated.masteryScore,
            confidenceLevel: updated.confidenceLevel,
            misconceptions: updated.misconceptions || [],
            attemptCount: updated.attemptCount,
            lastAssessedAt: updated.lastAssessedAt.toISOString(),
          };
        }
      } catch {}

      return {
        conceptId: existing[0].conceptId,
        subjectId: existing[0].subjectId,
        topicId: existing[0].topicId,
        masteryScore: nextPrior,
        confidenceLevel: confidence,
        misconceptions,
        attemptCount,
        lastAssessedAt: new Date().toISOString(),
      };
    }

    try {
      const [inserted] = await db
        .insert(learnerMastery)
        .values({
          workspaceId: input.workspaceId,
          subjectId: input.subjectId,
          topicId: input.topicId,
          conceptId: input.conceptId,
          masteryScore: nextPrior,
          confidenceLevel: confidence,
          misconceptions,
          attemptCount: 1,
        })
        .returning();

      if (inserted) {
        return {
          conceptId: inserted.conceptId,
          subjectId: inserted.subjectId,
          topicId: inserted.topicId,
          masteryScore: inserted.masteryScore,
          confidenceLevel: inserted.confidenceLevel,
          misconceptions: inserted.misconceptions || [],
          attemptCount: inserted.attemptCount,
          lastAssessedAt: inserted.lastAssessedAt.toISOString(),
        };
      }
    } catch {}

    return {
      conceptId: input.conceptId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      masteryScore: nextPrior,
      confidenceLevel: confidence,
      misconceptions,
      attemptCount: 1,
      lastAssessedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves student mastery profiles for a given workspace/topic.
   */
  static async getProfiles(
    workspaceId: string,
    subjectId?: string,
    topicId?: string
  ): Promise<ConceptMasteryProfile[]> {
    const conditions = [eq(learnerMastery.workspaceId, workspaceId)];
    if (subjectId) conditions.push(eq(learnerMastery.subjectId, subjectId));
    if (topicId) conditions.push(eq(learnerMastery.topicId, topicId));

    try {
      const rows = await db
        .select()
        .from(learnerMastery)
        .where(and(...conditions))
        .orderBy(desc(learnerMastery.updatedAt))
        .limit(100);

      return (rows || []).map((r) => ({
        conceptId: r.conceptId,
        subjectId: r.subjectId,
        topicId: r.topicId,
        masteryScore: r.masteryScore,
        confidenceLevel: r.confidenceLevel,
        misconceptions: r.misconceptions || [],
        attemptCount: r.attemptCount,
        lastAssessedAt: r.lastAssessedAt instanceof Date ? r.lastAssessedAt.toISOString() : String(r.lastAssessedAt || new Date().toISOString()),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Generates dynamic pedagogical prompt directives tailored to the student's mastery profile.
   */
  static generateAdaptiveDirectives(profiles: ConceptMasteryProfile[]): string {
    if (!profiles.length) {
      return "[LEARNER ADAPTIVE MODEL: Initial Assessment]\nStudent has no prior recorded attempts. Begin with foundational conceptual scaffolding.";
    }

    const struggling = profiles.filter((p) => p.masteryScore < 0.5 || p.misconceptions.length > 0);
    const mastered = profiles.filter((p) => p.masteryScore >= 0.85);

    let directive = `[LEARNER ADAPTIVE MODEL: Active Cognitive Profile]\n`;
    directive += `Mastered Concepts (${mastered.length}): ${mastered.map((m) => m.conceptId).join(", ") || "None yet"}.\n`;

    if (struggling.length > 0) {
      directive += `Areas Needing Remediation (${struggling.length}):\n`;
      struggling.forEach((s) => {
        directive += `• Concept '${s.conceptId}': Mastery=${Math.round(s.masteryScore * 100)}%`;
        if (s.misconceptions.length > 0) {
          directive += ` (Active Misconception: ${s.misconceptions.join("; ")})`;
        }
        directive += `\n`;
      });
      directive += `Instructional Directive: Prioritize visual diagrams and concrete analogies for struggling concepts before introducing advanced derivations.`;
    } else {
      directive += `Instructional Directive: Student exhibits strong conceptual fluency. Accelerate pace, challenge with edge cases and rigorous practice questions.`;
    }

    return directive;
  }
}
