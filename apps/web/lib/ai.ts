/**
 * AI Content Generation — structured JSON output
 *
 * เดิม: ให้ LLM ตอบเป็น text แบบมีหัวข้อ (HOOK:/CAPTION:) แล้วใช้ string parsing แกะ
 * ซึ่งเปราะมาก (บรรทัดแรกของ script คือหัวข้อ ไม่ใช่เนื้อหา ทำให้ text บนคลิปผิด)
 *
 * ใหม่: บังคับ JSON ด้วย response_format แล้ว parse ตรง ๆ
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MenuContent {
  hook: string; // 3 วิแรก — ขึ้นเป็น text บนคลิป
  body: string; // ใจความหลักของ script
  cta: string; // call to action
  caption: string; // caption สำหรับโพสต์
  hashtags: string; // "#tag1 #tag2 ..."
}

interface ScriptInput {
  menuName: string;
  menuNameEn?: string;
  price?: string;
  description?: string;
}

const DEFAULT_HASHTAGS = "#อาหารญี่ปุ่น #Japanesefood #อร่อยบอกต่อ #ร้านอาหารญี่ปุ่น";

// ----------------------------------------------------------------
// generateMenuContent — สร้างคอนเทนต์เป็น structured object
// ----------------------------------------------------------------
export async function generateMenuContent(input: ScriptInput): Promise<MenuContent> {
  const { menuName, menuNameEn, price, description } = input;

  const prompt = `คุณคือ copywriter ร้านอาหารญี่ปุ่น เชี่ยวชาญเขียนคอนเทนต์ TikTok / Instagram Reels

ข้อมูลเมนู:
- ชื่อ: ${menuName}${menuNameEn ? ` (${menuNameEn})` : ""}
- ราคา: ${price ? `${price} บาท` : "ไม่ระบุ"}
- รายละเอียด: ${description || "ไม่มี"}

สร้างคอนเทนต์สำหรับคลิปสั้น 15-30 วินาที ภาษาไทยกระชับ เหมาะกับคนไทยอายุ 18-35 ปี

ตอบเป็น JSON object เท่านั้น โครงสร้างนี้เป๊ะ ๆ:
{
  "hook": "ประโยคเปิด 3 วิแรก ดึงดูดมาก สั้นไม่เกิน 60 ตัวอักษร (จะขึ้นเป็นข้อความบนคลิป)",
  "body": "ใจความหลัก 1-2 ประโยค",
  "cta": "call to action 1 ประโยค",
  "caption": "ข้อความสำหรับโพสต์ 2-3 ประโยค",
  "hashtags": "#แฮชแท็ก คั่นด้วยช่องว่าง 5-8 อัน"
}`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "ตอบเป็น JSON object ที่ valid เท่านั้น ห้ามมีข้อความอื่น" },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 600,
    temperature: 0.8,
  });

  const raw = res.choices[0].message.content || "{}";
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(raw);
  } catch {
    // ถ้า parse ไม่ได้จริง ๆ (ไม่ควรเกิดกับ json_object mode) ใช้ fallback
  }

  return {
    hook: str(data.hook) || menuName,
    body: str(data.body),
    cta: str(data.cta),
    caption: str(data.caption) || menuName,
    hashtags: normalizeHashtags(data.hashtags),
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeHashtags(h: unknown): string {
  if (Array.isArray(h)) {
    return h
      .map((t) => String(t).trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ");
  }
  if (typeof h === "string" && h.trim()) return h.trim();
  return DEFAULT_HASHTAGS;
}

// ----------------------------------------------------------------
// generateMenuScript — wrapper สำหรับเก็บลง DB (คอลัมน์ script เดิม)
// เก็บเป็น JSON string เพื่อไม่ต้องแก้ schema
// ----------------------------------------------------------------
export async function generateMenuScript(input: ScriptInput): Promise<string> {
  const content = await generateMenuContent(input);
  return JSON.stringify(content);
}

// ----------------------------------------------------------------
// parseMenuContent — แปลง script จาก DB กลับเป็น object
// รองรับทั้ง JSON (job ใหม่) และ text แบบเก่า (job ที่ค้างใน DB)
// ----------------------------------------------------------------
export function parseMenuContent(script: string): MenuContent {
  // 1) ลอง parse เป็น JSON ก่อน (format ใหม่)
  try {
    const data = JSON.parse(script);
    if (data && typeof data === "object" && (data.hook || data.caption)) {
      return {
        hook: str(data.hook),
        body: str(data.body),
        cta: str(data.cta),
        caption: str(data.caption),
        hashtags: normalizeHashtags(data.hashtags),
      };
    }
  } catch {
    // ไม่ใช่ JSON — เป็น script แบบเก่า
  }

  // 2) Legacy text format (HOOK:/BODY:/CAPTION:/HASHTAGS:)
  const lines = script.split("\n");
  const section = (label: string): string => {
    const idx = lines.findIndex((l) => l.toUpperCase().includes(label));
    if (idx >= 0) {
      for (let i = idx + 1; i < lines.length; i++) {
        const t = lines[i].replace(/^\[|\]$/g, "").trim();
        if (t) return t;
      }
    }
    return "";
  };

  return {
    hook: section("HOOK") || lines.find((l) => l.trim())?.trim().substring(0, 80) || "",
    body: section("BODY"),
    cta: section("CTA"),
    caption: section("CAPTION") || script.substring(0, 200),
    hashtags: section("HASHTAG") || DEFAULT_HASHTAGS,
  };
}

// ----------------------------------------------------------------
// generateMenuCaption — caption สั้นสำหรับ LINE/Facebook (คงเดิม)
// ----------------------------------------------------------------
export async function generateMenuCaption(input: ScriptInput): Promise<string> {
  const { menuName, menuNameEn, price, description } = input;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `เขียน caption สั้น 2-3 ประโยคสำหรับ Facebook/LINE ร้านอาหารญี่ปุ่น
เมนู: ${menuName}${menuNameEn ? ` (${menuNameEn})` : ""}
ราคา: ${price ? `${price} บาท` : ""}
รายละเอียด: ${description || ""}

ตอบเฉพาะ caption เท่านั้น ไม่ต้องอธิบาย`,
      },
    ],
    max_tokens: 150,
    temperature: 0.7,
  });

  return res.choices[0].message.content || "";
}
