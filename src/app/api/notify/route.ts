export async function POST(req: Request) {
  const { userId, accessToken } = await req.json();

  const res = await fetch(
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
          webUrl: process.env.REDIRECT_URI, // Click-д redirect болох URL
        },
        activityType: "customNotification",
        previewText: { content: "Шинэ мэдэгдэл ирлээ" },
      }),
    }
  );

  const data = await res.json();
  return new Response(
    JSON.stringify({ success: res.ok, status: res.status, response: data })
  );
}
