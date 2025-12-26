import { NextRequest, NextResponse } from "next/server";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

export const runtime = "nodejs"; // ⚠️ Graph SDK-д заавал

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
  const graphClient = getGraphClient();

  const audioUrl = `${process.env.DEPLOYED_URL}/audio/voice-message.wav`;

  const payload = {
    prompts: [
      {
        "@odata.type": "#microsoft.graph.mediaPrompt",
        mediaInfo: {
          uri: audioUrl,
          resourceId: `audio_${Date.now()}`,
        },
      },
    ],
    clientContext: `ctx_${Date.now()}`,
  };

  console.log(`🔊 Playing audio: ${audioUrl}`);

  await graphClient
    .api(`/communications/calls/${callId}/playPrompt`)
    .post(payload);
}

// =========================
// Callback handler
// =========================
export async function POST(req: NextRequest) {
  try {
    // 🔹 Webhook validation
    const validationToken = req.nextUrl.searchParams.get("validationToken");

    if (validationToken) {
      return new NextResponse(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const body = await req.json();
    console.log("📞 Notification:", JSON.stringify(body, null, 2));

    if (Array.isArray(body?.value)) {
      for (const notification of body.value) {
        const callId = notification?.resourceData?.id;
        const state = notification?.resourceData?.state;

        console.log(`[Call ${callId}] state = ${state}`);

        // 🎯 ЯГ ЭНД AUDIO PLAY
        if (state === "established" && callId) {
          await playAudio(callId);
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Callback error:", err);
    // ⚠️ Graph retry хийхгүйн тулд заавал 200
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
