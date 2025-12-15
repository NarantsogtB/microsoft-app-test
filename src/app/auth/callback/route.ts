import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  const params = new URLSearchParams();
  params.append("client_id", process.env.CLIENT_ID!);
  params.append("scope", "User.Read TeamsActivity.Send");
  params.append("code", code!);
  params.append("redirect_uri", process.env.REDIRECT_URI!);
  params.append("grant_type", "authorization_code");
  params.append("client_secret", process.env.CLIENT_SECRET!);

  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      body: params,
    }
  );

  const data = await res.json();

  // access_token = delegated token
  return NextResponse.json(data);
}
