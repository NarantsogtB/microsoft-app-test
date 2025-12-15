import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, accessToken } = await req.json();
    const botId = process.env.BOT_ID!;
    const appUrl = "https://microsoft-app-test.vercel.app"; // өөрийн Vercel URL

    // Graph API-д илгээх body
    const body = {
      topic: {
        source: "user", // user руу notification
        value: userId, // Graph resource path нь userId байх ёстой
      },
      activityType: "customNotification",
      previewText: {
        content: "Шинэ мэдэгдэл ирлээ",
      },
      templateParameters: [
        {
          name: "customMessage",
          value: "Энэ бол тест мэдэгдэл",
        },
      ],
      // Optional: deep link
      // Энэ линк user-д notification дээр дарахад очих URL
      // linkUrl нь Bot ID болон app URL ашиглан Teams-д redirect хийнэ
      linkUrl: `https://teams.microsoft.com/l/entity/${botId}/home?webUrl=${appUrl}`,
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userId}/teamwork/sendActivityNotification`,
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
