import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.BASIC_AUTH_PASSWORD || "kaizen123";

  if (password !== correct) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = btoa(correct + ":zenkai-session");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("zenkai-auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
    path: "/",
  });
  return res;
}
