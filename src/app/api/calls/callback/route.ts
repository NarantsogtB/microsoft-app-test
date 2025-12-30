import { NextRequest, NextResponse } from "next/server";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

export const runtime = "nodejs";

// =========================
// Graph client (Caching)
// =========================
let cachedClient: Client | null = null;

function getGraphClient() {
  if (cachedClient) return cachedClient;

  const credential = new ClientSecretCredential(
    process.env.TAB_APP_TENANT_ID!,
    process.env.TAB_APP_CLIENT_ID!,
    process.env.TAB_APP_CLIENT_SECRET!
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  cachedClient = Client.initWithMiddleware({ authProvider });
  return cachedClient;
}

// =========================
// Play audio in call
// =========================
async function playAudio(callId: string) {
  try {
    const graphClient = getGraphClient();
    // Vercel дээрх аудио файлын шууд хаяг
    const audioUrl = `https://microsoft-app-test.vercel.app/audio/voice-message-teams.wav`;

    const payload = {
      prompts: [
        {
          "@odata.type": "#microsoft.graph.mediaPrompt",
          mediaInfo: {
            "@odata.type": "#microsoft.graph.mediaInfo",
            uri: audioUrl,
            resourceId: `audio_${Date.now()}`,
          },
        },
      ],
      clientContext: `ctx_${Date.now()}`,
    };

    console.log(`🔊 Playing audio: ${audioUrl}`);

    const result = await graphClient
      .api(`/communications/calls/${callId}/playPrompt`)
      .post(payload);

    return result;
  } catch (error: any) {
    console.error("❌ PlayPrompt error details:", error.body || error.message);
    throw error;
  }
}

// =========================
// Answer incoming call
// =========================
async function answerCall(callId: string) {
  const graphClient = getGraphClient();
  const payload = {
    callbackUri: `https://microsoft-app-test.vercel.app/api/calls/callback`,
    mediaConfig: {
      "@odata.type": "#microsoft.graph.serviceHostedMediaConfig",
    },
    acceptedModalities: ["audio"],
  };

  console.log(`📞 Answering call: ${callId}`);
  return await graphClient
    .api(`/communications/calls/${callId}/answer`)
    .post(payload);
}

// =========================
// Webhook Validation (GET)
// =========================
export async function GET(req: NextRequest) {
  const validationToken = req.nextUrl.searchParams.get("validationToken");
  if (validationToken) {
    return new NextResponse(validationToken, { status: 200 });
  }
  return new NextResponse("Invalid request", { status: 400 });
}

// =========================
// POST: Notification handler
// =========================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation token check
    const validationToken = req.nextUrl.searchParams.get("validationToken");
    if (validationToken) {
      return new NextResponse(validationToken, { status: 200 });
    }

    if (Array.isArray(body?.value)) {
      for (const notification of body.value) {
        const resourceData = notification?.resourceData;
        const resource = notification?.resource;
        const callId = resource?.split("/").pop();
        const state = resourceData?.state;

        // 1. Incoming: Дуудлага ирэхэд ХАРИУЛАХ
        if (state === "incoming" && callId) {
          console.log("📱 Incoming call detect...");
          await answerCall(callId);
        }

        // 2. Established: Холбогдсон даруйд АУДИО ТОГЛУУЛАХ
        if (state === "established" && callId) {
          console.log("🎯 Call Established. Triggering PlayPrompt...");

          // Microsoft-д медиа сувгаа бэлдэх хугацаа өгөх (2 секунд)
          await new Promise((resolve) => setTimeout(resolve, 2000));

          try {
            const playResult = await playAudio(callId);
            console.log(
              "✅ PlayPrompt request accepted by Microsoft:",
              playResult.id
            );
          } catch (err: any) {
            // Энд ямар алдаа гарч байгааг заавал харах хэрэгтэй
            console.error(
              "❌ PlayPrompt Failed Error Body:",
              JSON.stringify(err.body || err, null, 2)
            );
          }
        }

        if (state === "terminated") {
          console.log("📴 Call ended.");
        }
      }
    }

    // БҮХ ҮЙЛДЭЛ ДУУССАНЫ ДАРАА ХАРИУ БУЦААХ
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("🔥 Global Error:", err.message);
    // Алдаа гарсан ч Microsoft-оос дахин дахин хүсэлт ирүүлэхгүйн тулд 200 буцаасан нь дээр
    return NextResponse.json({ error: err.message }, { status: 200 });
  }
}
