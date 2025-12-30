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
// Play audio
// =========================
async function playAudio(callId: string) {
  const client = getGraphClient();

  const audioUrl =
    "https://microsoft-app-test.vercel.app/audio/voice-message-teams.wav";

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

  console.log(`🔊 Playing audio for call ${callId}`);
  return client.api(`/communications/calls/${callId}/playPrompt`).post(payload);
}

// =========================
// GET: validation
// =========================
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("validationToken");
  if (token) {
    return new NextResponse(token, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new NextResponse("OK");
}

// =========================
// POST: notifications
// =========================
export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const body = await req.json();

    console.log("=".repeat(60));
    console.log("📨 INCOMING NOTIFICATION");
    console.log(JSON.stringify(body, null, 2));

    if (!Array.isArray(body?.value)) {
      return NextResponse.json({ ok: true });
    }

    for (const notification of body.value) {
      const resource = notification.resourceUrl || notification.resource;
      const callId = resource?.split("/").pop();
      const state = notification.resourceData?.state;
      const changeType = notification.changeType;

      console.log(`
🔔 Notification:
   - Call ID: ${callId}
   - State: ${state}
   - Change: ${changeType}
      `);

      // ✅ Call fully connected → play audio
      if (state === "established" && callId) {
        console.log("🎯 Call established → playing audio in 1s");

        setTimeout(() => {
          playAudio(callId).catch((err) =>
            console.error("❌ playAudio failed:", err)
          );
        }, 1000);
      }

      // 📴 Call ended
      if (state === "terminated") {
        console.log("📴 Call terminated");
      }
    }

    console.log(`⏱️ Processing ${Date.now() - start}ms`);
    console.log("=".repeat(60));

    // ⚠️ Always return 200
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ CALLBACK ERROR:", err);
    return NextResponse.json({ ok: true });
  }
}
