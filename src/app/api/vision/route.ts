import { NextResponse } from "next/server";
import { analyzeAndGroundVisual } from "@/lib/vision/visual-analysis";
import type { AnnotationAction, VisionAnalysisRequest } from "@/lib/vision/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let payload: VisionAnalysisRequest = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const target = formData.get("target") as string | null;
      const action = formData.get("action") as string | null;
      const query = formData.get("query") as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        payload.imageBase64 = `data:${file.type || "image/png"};base64,${buffer.toString("base64")}`;
      }
      if (target) payload.target = target;
      if (action) payload.action = action as AnnotationAction;
      if (query) payload.userQuery = query;
    } else {
      const body = await request.json().catch(() => ({}));
      payload = {
        imageBase64: body.imageBase64 || body.image,
        mimeType: body.mimeType,
        target: body.target,
        action: body.action,
        userQuery: body.query || body.userQuery,
        canvasPlacement: body.canvasPlacement,
      };
    }

    if (!payload.imageBase64) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing image payload. Provide 'imageBase64' or multipart 'file'.",
        },
        { status: 400 }
      );
    }

    const keys = {
      gemini: request.headers.get("x-gemini-key"),
      openai: request.headers.get("x-openai-key"),
    };

    const result = await analyzeAndGroundVisual(payload, { keys });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Visual perception analysis failed.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error during visual processing";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
