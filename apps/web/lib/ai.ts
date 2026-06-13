/**
 * AI Caption Generator
 * Primary: Claude Sonnet 4.6 (Anthropic) — Best creative writing 2026
 * Fallback: GPT-4o (OpenAI) — ถ้า Anthropic credits หมด
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface MenuContent {
  hook: string;
  caption: string;
  hashtags: string;
  cta: string;
}

const SYSTEM_PROMPT = `คุณคือผู้เชี่ยวชาญ Social Media Marketing สำหรับร้านอาหารญี่ปุ่นระดับ Premium ชื่อ "Zenkai"
สไตล์การเขียน: อบอุ่น น่ากิน ภาษาไทยสมัยใหม่ มี emoji พอดี ไม่มากเกิน
ต้องสร้าง viral content ที่ทำให้คนอยากมากิน หยุดดูวิดีโอ และแชร์ต่อ

กฎ:
- Hook: ต้องดึงดูดใน 3 วินาทีแรก ใช้คำถาม ตัวเลข หรือ surprise
- Caption: 2-3 ประโยค กระชับ อ่านง่าย น่ากิน
- Hashtags: 8-12 อัน ผสมไทย-อังกฤษ เน้น reach
- CTA: กระตุ้นให้ comment/share/save
ตอบเป็น JSON เท่านั้น ไม่มี markdown`;

const USER_PROMPT = (menuName: string, menuNameEn: string, price: string, description: string, category: string) =>
  `สร้าง caption สำหรับ:
เมนู: ${menuName}${menuNameEn ? ` (${menuNameEn})` : ""}
ราคา: ${price ? `฿${price}` : "ไม่ระบุ"}
หมวด: ${category || "อาหารญี่ปุ่น"}
${description ? `จุดเด่น: ${description}` : ""}

ตอบ JSON รูปแบบนี้เท่านั้น:
{
  "hook": "ประโยค hook ดึงดูด",
  "caption": "caption 2-3 ประโยค",
  "hashtags": "#แฮชแท็ก #รวมกัน",
  "cta": "call to action"
}`;

// ─── Claude Sonnet 4.6 (Primary) ──────────────────────────────
async function generateWithClaude(params: {
  menuName: string; menuNameEn: string; price: string;
  description: string; category: string;
}): Promise<MenuContent> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: USER_PROMPT(params.menuName, params.menuNameEn, params.price, params.description, params.category),
    }],
  });
  const text = (msg.content[0] as { text: string }).text.trim();
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ─── GPT-4o (Fallback) ────────────────────────────────────────
async function generateWithGPT(params: {
  menuName: string; menuNameEn: string; price: string;
  description: string; category: string;
}): Promise<MenuContent> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT(params.menuName, params.menuNameEn, params.price, params.description, params.category) },
    ],
  });
  return JSON.parse(res.choices[0].message.content || "{}");
}

// ─── Main: Claude first, GPT fallback ────────────────────────
export async function generateMenuContent(params: {
  menuName: string;
  menuNameEn?: string;
  price?: string;
  description?: string;
  category?: string;
}): Promise<MenuContent> {
  const p = {
    menuName: params.menuName,
    menuNameEn: params.menuNameEn || "",
    price: params.price || "",
    description: params.description || "",
    category: params.category || "อาหารญี่ปุ่น",
  };

  // ลอง Claude ก่อน — ดีกว่า GPT-4o สำหรับ creative Thai copy
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log("[ai] Using Claude Sonnet 4.6");
      return await generateWithClaude(p);
    } catch (err) {
      console.warn("[ai] Claude failed, falling back to GPT-4o:", err instanceof Error ? err.message : err);
    }
  }

  // Fallback: GPT-4o
  console.log("[ai] Using GPT-4o");
  return await generateWithGPT(p);
}

// ─── Backward compatibility aliases ──────────────────────────
export const generateMenuScript = generateMenuContent;
export function parseMenuContent(json: string): MenuContent {
  try { return JSON.parse(json); }
  catch { return { hook: "", caption: json, hashtags: "", cta: "" }; }
}
