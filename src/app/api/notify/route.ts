import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, teamId, channelId } = await req.json();
    const botId = process.env.BOT_ID!;
    const appUrl = "https://microsoft-app-test.vercel.app";

    if (!accessToken || !teamId || !channelId) {
      return NextResponse.json(
        { error: "accessToken, teamId болон channelId хэрэгтэй" },
        { status: 400 }
      );
    }

    const body = {
      topic: {
        source: "channel",
        value: `teams/${teamId}/channels/${channelId}`,
      },
      activityType: "customNotification",
      previewText: { content: "Шинэ мэдэгдэл ирлээ" },
      templateParameters: [
        { name: "customMessage", value: "Энэ бол тест мэдэгдэл" },
      ],
      linkUrl: `https://teams.microsoft.com/l/entity/${botId}/home?webUrl=${appUrl}`,
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

// GET method ашиглаж Teams + Channels татах
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accessToken = url.searchParams.get("accessToken");

    if (!accessToken) {
      return NextResponse.json(
        { error: "accessToken хэрэгтэй" },
        { status: 400 }
      );
    }

    // User-ийн join хийсэн Teams-г татна
    const teamsRes = await fetch(
      "https://graph.microsoft.com/v1.0/me/joinedTeams",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const teamsData = await teamsRes.json();

    const teamsWithChannels = await Promise.all(
      teamsData.value.map(async (team: any) => {
        const channelsRes = await fetch(
          `https://graph.microsoft.com/v1.0/teams/${team.id}/channels`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const channelsData = await channelsRes.json();
        return {
          id: team.id,
          displayName: team.displayName,
          channels: channelsData.value.map((ch: any) => ({
            id: ch.id,
            displayName: ch.displayName,
          })),
        };
      })
    );

    return NextResponse.json(teamsWithChannels);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
