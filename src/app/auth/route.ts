import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const tenantId = process.env.TENANT_ID!;
  const clientId = process.env.CLIENT_ID!;
  const redirectUri = process.env.REDIRECT_URI!;
  const scope = "User.Read TeamsActivity.Send";

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_mode=query&scope=${encodeURIComponent(scope)}&state=12345`;

  return NextResponse.redirect(authUrl);
}
