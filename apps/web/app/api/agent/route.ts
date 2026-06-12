import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM = `คุณคือ Zenkai AI — ผู้ช่วยการตลาดของร้านอาหารญี่ปุ่นชื่อ "Zenkai"

ความเชี่ยวชาญ:
- เขียน Caption ภาษาไทยสำหรับ TikTok, Instagram Reels, Facebook
- คิด Hashtag ที่เหมาะกับร้านอาหารญี่ปุ่นในไทย
- ไอเดียโปรโมชั่น/คอนเทนต์รายวัน
- วิเคราะห์เวลาที่ดีในการโพสต์
- กลยุทธ์การเพิ่ม engagement

สไตล์การตอบ:
- ภาษาไทยเป็นหลัก กระชับ ได้ใจความ
- ใส่ emoji เล็กน้อยให้ดูสนุก
- มีตัวอย่างที่ใช้งานได้จริงเสมอ
- ถ้าถามเรื่อง caption ให้เขียนตัวอย่างมาเลย 2-3 แบบ
- เรียกตัวเองว่า "Zenkai" ไม่ใช่ "ผม" หรือ "ดิฉัน"`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.8,
      stream: true,
    });

    // stream กลับไปให้ client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
