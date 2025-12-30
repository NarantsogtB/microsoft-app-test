import { NextRequest, NextResponse } from "next/server";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

export const runtime = "nodejs";

// =========================
// Graph client
// =========================
function getGraphClient() {
  const credential = new ClientSecretCredential(
    process.env.TAB_APP_TENANT_ID!,
    process.env.TAB_APP_CLIENT_ID!,
    process.env.TAB_APP_CLIENT_SECRET!
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  return Client.initWithMiddleware({ authProvider });
}

// =========================
// Play audio in call
// =========================
async function playAudio(callId: string) {
  try {
    const graphClient = getGraphClient();

    // АНХААР: Audio файл нь:
    // 1. WAV format байх ёстой (PCM 16-bit, 16kHz mono эсвэл 8kHz)
    // 2. Publicly accessible HTTPS endpoint дээр байрших ёстой
    // 3. Файл размер хязгаарлагдмал (< 5MB)
    const audioUrl = `https://microsoft-app-test.vercel.app/audio/voice-message-teams.wav`;

    const payload = {
      prompts: [
        {
          "@odata.type": "#microsoft.graph.mediaPrompt",
          mediaInfo: {
            "@odata.type": "#microsoft.graph.mediaInfo",
            uri: audioUrl,
            resourceId: `audio_${Date.now()}`, // Unique ID
          },
        },
      ],
      clientContext: `ctx_${Date.now()}`, // Tracking ID
    };

    console.log(`🔊 Playing audio for call ${callId}: ${audioUrl}`);

    const result = await graphClient
      .api(`/communications/calls/${callId}/playPrompt`)
      .post(payload);

    console.log("✅ PlayPrompt result:", result);
    return result;
  } catch (error: any) {
    console.error("❌ PlayPrompt error:", {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      body: error.body,
    });
    throw error;
  }
}

// =========================
// GET: Webhook validation
// =========================
export async function GET(req: NextRequest) {
  const validationToken = req.nextUrl.searchParams.get("validationToken");

  if (validationToken) {
    console.log("✅ Webhook validation token received:", validationToken);
    // Microsoft Graph-ийн validation request-г хариулах
    return new NextResponse(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("GET method requires validationToken parameter", {
    status: 400,
  });
}

// =========================
// POST: Notification handler
// =========================
export async function POST(req: NextRequest) {
  try {
    // 🔹 Query string validation check (subscription үүсгэх үед)
    const validationToken = req.nextUrl.searchParams.get("validationToken");

    if (validationToken) {
      console.log("✅ POST validation token received:", validationToken);
      return new NextResponse(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 🔹 Notification body авах
    const body = await req.json();
    console.log(
      "📞 Full Notification received:",
      JSON.stringify(body, null, 2)
    );

    // 🔹 clientState шалгах (security)
    if (
      body.value?.[0]?.clientState &&
      body.value[0].clientState !== "secret123"
    ) {
      console.error("❌ Invalid clientState:", body.value[0].clientState);
      return NextResponse.json(
        { error: "Invalid clientState" },
        { status: 403 }
      );
    }

    // 🔹 Notifications боловсруулах
    if (Array.isArray(body?.value)) {
      for (const notification of body.value) {
        const resourceData = notification?.resourceData;
        const callId = resourceData?.id;
        const state = resourceData?.state;
        const changeType = notification?.changeType;

        console.log(
          `[Notification] changeType=${changeType}, callId=${callId}, state=${state}`
        );
        console.log(`[ResourceData]`, JSON.stringify(resourceData, null, 2));

        // 🔊 Дуудлага холбогдсон үед audio тоглуулах
        if (state === "established" && callId) {
          console.log(`🎯 Call established! Playing audio...`);

          // Async-аар audio тоглуулах (notification response-г удаашруулахгүй байх)
          playAudio(callId).catch((err) => {
            console.error(`Failed to play audio for call ${callId}:`, err);
          });
        }

        // Бусад states лог хийх
        if (state === "incoming") {
          console.log("📱 Call is ringing...");
        } else if (state === "terminated") {
          console.log("📴 Call ended");
        }
      }
    }

    // ⚠️ ЧУХАЛ: Microsoft Graph-д ХУРДАН хариу буцаах (3 секундэд багтаах)
    // 200 OK буцаахгүй бол Graph notification дахин илгээнэ
    return NextResponse.json({ accepted: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Callback processing error:", err);

    // ⚠️ Алдаа гарсан ч 200 буцаах (Graph retry хийхгүй байхын тулд)
    return NextResponse.json({ accepted: true }, { status: 200 });
  }
}
