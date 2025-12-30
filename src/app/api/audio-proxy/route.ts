import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const fileUrl = req.nextUrl.searchParams.get("file");
    if (!fileUrl) {
      return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
    }

    // Dropbox dl=0-г raw файлыг татахад dl=1 болгож өөрчилнө
    const rawUrl = fileUrl.replace(/dl=0$/, "dl=1");

    const res = await fetch(rawUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: 500 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("❌ Audio proxy error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
