// app/auth/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Your code here
  return NextResponse.json({ message: "Hello GET" });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ received: body });
}
