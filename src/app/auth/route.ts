import { NextResponse } from "next/server";

export async function GET(req: Request) {
  console.log(process.env.REDIRECT_URI);

  const url = `https://login.microsoftonline.com/${
    process.env.TENANT_ID
  }/oauth2/v2.0/authorize?client_id=${
    process.env.CLIENT_ID
  }&response_type=code&redirect_uri=${encodeURIComponent(
    process.env.REDIRECT_URI!
  )}&response_mode=query&scope=User.Read%20TeamsActivity.Send`;

  return NextResponse.redirect(url);
}
