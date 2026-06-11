import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateMenuScript } from "@/lib/ai";

// POST /api/generate — สร้าง script ฝ่ายเดียวโดยไม่อัปโหลดรูป
const GenerateSchema = z.object({
  menuName: z.string().min(1, "ชื่อเมนูห้ามว่าง"),
  menuNameEn: z.string().optional(),
  price: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const script = await generateMenuScript(parsed.data);
    return NextResponse.json({ script });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
