import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, accessToken } = req.body;

  const response = await fetch(
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
          webUrl: "https://microsoft-app-test.vercel.app",
        },
        activityType: "customNotification",
        previewText: { content: "Шинэ мэдэгдэл ирлээ" },
      }),
    }
  );

  const data = await response.json();
  res.status(response.status).json(data);
}
