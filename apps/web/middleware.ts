/**
 * Basic Auth Middleware — ครอบทั้ง dashboard และทุก API route
 *
 * เหตุผล: เดิม /api/upload และ /api/jobs เปิดโล่ง ใครเจอ URL ก็ยิง request
 * เผาเครดิต OpenAI/Phaya ได้ทันที
 *
 * วิธีใช้: ตั้ง BASIC_AUTH_USER และ BASIC_AUTH_PASSWORD ใน .env.local
 * - Browser จะเด้ง prompt ให้ login ครั้งเดียว แล้วจำไว้ทั้ง session
 * - เรียก API ตรง ๆ: ใส่ header  Authorization: Basic base64(user:pass)
 *
 * Production ที่ยังไม่ตั้งค่า → block ทั้งแอพ (กันลืม)
 * Dev (NODE_ENV !== production) ที่ยังไม่ตั้งค่า → ปล่อยผ่าน
 */

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        "ยังไม่ได้ตั้งค่า BASIC_AUTH_USER / BASIC_AUTH_PASSWORD — ตั้งค่าก่อน deploy",
        { status: 503 }
      );
    }
    return NextResponse.next(); // dev mode — allow
  }

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(":");
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (u === user && p === pass) {
        return NextResponse.next();
      }
    } catch {
      // invalid base64 — ตกลงไป 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="kaizen"' },
  });
}

export const config = {
  // ครอบทุกอย่างยกเว้น static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
