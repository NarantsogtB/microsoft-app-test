import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, teamId, channelId } = await req.json();
    const botId = process.env.BOT_ID!;
    const appUrl = "https://microsoft-app-test.vercel.app"; // өөрийн Vercel URL

    if (!accessToken || !teamId || !channelId) {
      return NextResponse.json(
        { error: "accessToken, teamId болон channelId хэрэгтэй" },
        { status: 400 }
      );
    }

    const body = {
      topic: {
        source: "channel", // Channel руу notification
        value: `teams/${teamId}/channels/${channelId}`,
      },
      activityType: "customNotification",
      previewText: { content: "Шинэ мэдэгдэл ирлээ" },
      templateParameters: [
        { name: "customMessage", value: "Энэ бол тест мэдэгдэл" },
      ],
      linkUrl: `https://teams.microsoft.com/l/entity/${botId}/home?webUrl=${appUrl}`, // Bot deep link
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
