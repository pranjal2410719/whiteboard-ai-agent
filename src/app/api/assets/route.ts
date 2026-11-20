import { NextResponse } from "next/server";
import { getAvailableAssets, getAssetById } from "@/lib/assets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const asset = getAssetById(id);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    return NextResponse.json({ asset });
  }

  const assets = getAvailableAssets();
  return NextResponse.json({ assets });
}
