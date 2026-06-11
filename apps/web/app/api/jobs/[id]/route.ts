import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/jobs/[id] — ดึง job เดี่ยวตาม id (ใช้ poll สถานะจากหน้าเว็บ)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: "ไม่พบ job นี้" }, { status: 404 });
    }

    return NextResponse.json({ job: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
