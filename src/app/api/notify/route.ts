import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { recipientUserId, accessToken } = await req.json();

  const botId = process.env.BOT_ID!;
  const appUrl = "https://microsoft-app-test.vercel.app";

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${recipientUserId}/teamwork/sendActivityNotification`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: {
          source: "entityUrl",
          webUrl: `https://teams.microsoft.com/l/entity/${botId}/home?webUrl=${appUrl}`,
        },
        activityType: "customNotification",
        previewText: { content: "Шинэ мэдэгдэл ирлээ" },
      }),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
