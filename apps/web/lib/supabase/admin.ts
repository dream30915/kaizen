/**
 * Supabase Admin Client — สำหรับใช้ใน workers / scripts ที่รันนอก Next.js
 *
 * ⚠️ ห้ามใช้ lib/supabase/server.ts ใน worker เด็ดขาด
 * เพราะตัวนั้นเรียก cookies() จาก next/headers ซึ่งมีเฉพาะใน request context
 * ของ Next.js — รันใน tsx worker จะ crash ทันที
 */

import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);
