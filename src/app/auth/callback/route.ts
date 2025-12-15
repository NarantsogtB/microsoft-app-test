import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code)
    return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const redirectUri = process.env.REDIRECT_URI!;
  const tenantId = process.env.TENANT_ID!;
  const clientId = process.env.CLIENT_ID!;
  const clientSecret = process.env.CLIENT_SECRET!;
  const scope = "User.Read TeamsActivity.Send";

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("scope", scope);
  params.append("code", code);
  params.append("redirect_uri", redirectUri);
  params.append("grant_type", "authorization_code");
  params.append("client_secret", clientSecret);

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    }
  );

  const tokenData = await tokenRes.json();
  return NextResponse.json({ access_token: tokenData.access_token });
}
