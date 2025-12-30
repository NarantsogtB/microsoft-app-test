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

    console.log(`🔊 Attempting to play audio for call ${callId}`);
    console.log(`📍 Audio URL: ${audioUrl}`);

    const result = await graphClient
      .api(`/communications/calls/${callId}/playPrompt`)
      .post(payload);

    console.log("✅ PlayPrompt successful:", JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error("❌ PlayPrompt failed:", {
      callId,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      body: error.body,
    });
    throw error;
  }
}

// =========================
// Answer incoming call
// =========================
async function answerCall(callId: string) {
  try {
    const graphClient = getGraphClient();

    const payload = {
      callbackUri: `https://microsoft-app-test.vercel.app/api/calls/callback`,
      mediaConfig: {
        "@odata.type": "#microsoft.graph.serviceHostedMediaConfig",
      },
      acceptedModalities: ["audio"],
    };

    console.log(`📞 Answering call ${callId}`);

    const result = await graphClient
      .api(`/communications/calls/${callId}/answer`)
      .post(payload);

    console.log("✅ Call answered:", result);
    return result;
  } catch (error: any) {
    console.error("❌ Answer call failed:", {
      callId,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    });
    throw error;
  }
}

// =========================
// GET: Webhook validation (ховор ашиглагддаг)
// =========================
export async function GET(req: NextRequest) {
  const validationToken = req.nextUrl.searchParams.get("validationToken");

  if (validationToken) {
    console.log("✅ GET validation token:", validationToken);
    return new NextResponse(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("GET requires validationToken", { status: 400 });
}

// =========================
// POST: Notification handler
// =========================
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 🔹 Body уншиж авах
    const body = await req.json();

    console.log("=".repeat(60));
    console.log("📨 INCOMING NOTIFICATION");
    console.log("=".repeat(60));
    console.log(JSON.stringify(body, null, 2));

    // 🔹 Validation token шалгах (subscription үүсгэх үед л ирдэг)
    const validationToken = req.nextUrl.searchParams.get("validationToken");
    if (validationToken) {
      console.log("✅ Validation token in POST:", validationToken);
      return new NextResponse(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 🔹 Notifications боловсруулах
    if (Array.isArray(body?.value)) {
      for (const notification of body.value) {
        const resourceData = notification?.resourceData;
        const callId = resourceData?.id;
        const state = resourceData?.state;
        const changeType = notification?.changeType;

        console.log(`
🔔 Notification Details:
   - Change Type: ${changeType}
   - Call ID: ${callId}
   - State: ${state}
   - Timestamp: ${new Date().toISOString()}
        `);

        // 📞 Орж ирж буй дуудлагыг хүлээн авах
        if (state === "incoming" && callId) {
          console.log("📱 Incoming call detected! Answering...");

          answerCall(callId).catch((err) => {
            console.error(`❌ Failed to answer call ${callId}:`, err);
          });
        }

        // 🔗 Холбогдож байгаа үед
        if (state === "establishing" && callId) {
          console.log("🔄 Call is establishing...");
        }

        // ✅ Холбогдсон үед audio тоглуулах
        if (state === "established" && callId) {
          console.log("🎯 Call ESTABLISHED! Playing audio in 1 second...");

          // 1 секунд хүлээгээд audio тоглуулах (холбогдох хугацаа өгөх)
          setTimeout(() => {
            playAudio(callId).catch((err) => {
              console.error(`❌ Failed to play audio for call ${callId}:`, err);
            });
          }, 1000);
        }

        // 📴 Дуудлага дууссан
        if (state === "terminated" && callId) {
          console.log("📴 Call terminated");

          if (resourceData.resultInfo) {
            console.log("   Result:", resourceData.resultInfo);
          }
        }

        // 🔇 Audio тоглосон мэдээлэл
        if (
          changeType === "deleted" &&
          resourceData["@odata.type"] === "#microsoft.graph.playPromptOperation"
        ) {
          console.log("🔇 PlayPrompt operation completed");
          console.log("   Status:", resourceData.status);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️  Processing time: ${duration}ms`);
    console.log("=".repeat(60));

    // ⚠️ ЧУХАЛ: 3 секундээс богино хугацаанд 200 буцаах
    return NextResponse.json(
      {
        accepted: true,
        timestamp: new Date().toISOString(),
        processingTime: duration,
      },
      { status: 200 }
    );
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error("=".repeat(60));
    console.error("❌ CALLBACK ERROR");
    console.error("=".repeat(60));
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    console.error(`Processing time: ${duration}ms`);
    console.error("=".repeat(60));

    // ⚠️ Алдаа гарсан ч 200 буцаах (retry хийхгүй байх)
    return NextResponse.json(
      {
        accepted: true,
        error: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
