// app/api/notify/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, accessToken } = await req.json();

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userId}/teamwork/sendActivityNotification`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: {
            source: "text",
            value: "Next.js MVP",
            webUrl: "https://microsoft-app-test.vercel.app",
          },
          activityType: "customNotification",
          previewText: { content: "Шинэ мэдэгдэл ирлээ" },
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
