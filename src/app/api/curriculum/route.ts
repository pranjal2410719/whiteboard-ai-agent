import { CurriculumTaxonomy } from "@/lib/curriculum/taxonomy";
import { PreparationEngine } from "@/lib/curriculum/preparation-engine";
import type { PreparationRequest } from "@/lib/curriculum/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const subjectId = url.searchParams.get("subjectId") || "";

  if (query) {
    const hits = CurriculumTaxonomy.search(query);
    return Response.json({
      query,
      results: hits.map(h => ({
        subject: { id: h.subject.id, name: h.subject.name, color: h.subject.color },
        chapter: { id: h.chapter.id, title: h.chapter.title },
        topic: h.topic
      }))
    });
  }

  if (subjectId) {
    const subject = CurriculumTaxonomy.getSubject(subjectId);
    if (!subject) {
      return Response.json({ error: `Subject '${subjectId}' not found.` }, { status: 404 });
    }
    return Response.json({ subject });
  }

  const subjects = CurriculumTaxonomy.getSubjects();
  return Response.json({ subjects });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PreparationRequest;
  const result = PreparationEngine.prepareClassroom(body);
  return Response.json({
    classroomContext: result.classroomContext,
    initialPage: result.sessionData.pages[0],
    suggestedPrompts: result.classroomContext.suggestedPrompts,
    assetKey: result.classroomContext.assetKey
  });
}
