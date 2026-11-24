import { deleteSession, fail, getSession, updateSession, validId, workspaceId } from "@/lib/store";
import type { BoardMark } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  if (!validId(id)) return fail("Invalid session ID", 400);
  const owner = await workspaceId();
  const session = await getSession(id, owner);
  if (!session) return fail("Session not found", 404);
  return Response.json({ session });
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
  if (!validId(id)) return fail("Invalid session ID", 400);
  const owner = await workspaceId();
  const session = await getSession(id, owner);
  if (!session) return fail("Session not found", 404);

  const body = await request.json().catch(() => ({}));
  const data = { ...session.data };

  if (typeof body.saved === "boolean") {
    data.saved = body.saved;
  }

  if (typeof body.pageIndex === "number" && Number.isFinite(body.pageIndex)) {
    data.pageIndex = Math.max(0, Math.min(data.pages.length - 1, body.pageIndex));
  }

  if (typeof body.pageId === "string" && Array.isArray(body.ink)) {
    const pageId = body.pageId;
    const ink = body.ink as BoardMark[];
    if (data.pages.some(p => p.id === pageId)) {
      data.pages = data.pages.map(p => p.id === pageId ? { ...p, ink } : p);
    } else {
      data.recordingInk = { ...(data.recordingInk || {}), [pageId]: ink };
    }
  }

  if (body.data && typeof body.data === "object") {
    Object.assign(data, body.data);
  }

  const updated = await updateSession(id, owner, data);
  return Response.json({ session: updated });
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  if (!validId(id)) return fail("Invalid session ID", 400);
  const owner = await workspaceId();
  const success = await deleteSession(id, owner);

  if (!success) return fail("Session not found", 404);
  return Response.json({ ok: true });
}
