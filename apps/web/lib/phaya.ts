/**
 * Phaya.io — Video Generation (All Tiers)
 * Tier 1: Seedance Pro  — 6 credits  (~24 บาท) — เหมือนถ่ายจริง
 * Tier 2: Veo 3.1 Fast  — 15 credits (~60 บาท) — Google AI
 * Tier 3: Veo 3.1 Quality — 50 credits (~200 บาท) — Premium สุด
 */

import axios from "axios";
import OpenAI from "openai";
import { buildProfessionalPrompt, VideoStyle } from "./prompts";

const BASE = "https://api.phaya.io/api/v1";
const api = () => axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${process.env.PHAYA_API_KEY}`, "Content-Type": "application/json" },
  timeout: 120000,
});

// ─── Poll helper ────────────────────────────────────────────
async function poll(endpoint: string, jobId: string, max = 120, ms = 5000): Promise<string> {
  for (let i = 0; i < max; i++) {
    await new Promise(r => setTimeout(r, ms));
    const { data } = await api().get(`${endpoint}/${jobId}`);
    const s = data.status;
    if (s === "completed" || s === "success")
      return data.video_url || data.image_url || data.audio_url || "";
    if (s === "failed" || s === "error")
      throw new Error(`Phaya job failed: ${data.error || "unknown"}`);
  }
  throw new Error("Phaya job timed out");
}

// ─── Professional Prompt Builder ─────────────────────────────
// ใช้ preset library แทน GPT-4o เพื่อความสม่ำเสมอและ quality ระดับมืออาชีพ
// GPT-4o ยังถูกใช้ถ้า ENABLE_GPT_PROMPT=true ใน .env (optional enhancement)
async function buildPrompt(
  menuName: string,
  menuNameEn?: string,
  description?: string,
  category?: string,
  style?: VideoStyle
): Promise<string> {
  // ลอง enhance ด้วย GPT-4o ก่อน (ถ้าเปิดไว้)
  if (process.env.ENABLE_GPT_PROMPT === "true" && process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const base = buildProfessionalPrompt({ menuName, menuNameEn, description, category, style });
      const { choices } = await openai.chat.completions.create({
        model: "gpt-4o", max_tokens: 120, temperature: 0.5,
        messages: [{
          role: "system",
          content: "You are a food video director. Enhance this AI video prompt to be more specific and cinematic. Keep under 100 words. English only. Output enhanced prompt only.",
        }, { role: "user", content: base }],
      });
      return choices[0].message.content?.trim() || base;
    } catch { /* fallback to preset */ }
  }
  // Default: ใช้ preset library (research-based, consistent quality)
  return buildProfessionalPrompt({ menuName, menuNameEn, description, category, style });
}

// ─── Tier 1: Seedance Pro (6 credits / 8s) ──────────────────
async function seedancePro(imageUrl: string, prompt: string): Promise<string> {
  const { data } = await api().post("/seedance-video/create", {
    image_url: imageUrl, prompt, duration: "8",
  });
  return poll("/seedance-video/status", data.job_id, 80, 5000);
}

// ─── Tier 2: Veo 3.1 Fast (15 credits) ──────────────────────
async function veo31Fast(imageUrl: string, prompt: string): Promise<string> {
  const { data } = await api().post("/veo31-video/create", {
    image_url: imageUrl,
    prompt: prompt + ", 9:16 vertical",
  });
  return poll("/veo31-video/status", data.job_id, 100, 6000);
}

// ─── Tier 3: Veo 3.1 Quality (50 credits) ───────────────────
async function veo31Quality(imageUrl: string, prompt: string): Promise<string> {
  const { data } = await api().post("/veo31-video/create", {
    image_url: imageUrl,
    prompt: prompt + ", 9:16 vertical, ultra cinematic, Michelin star, award-winning food photography",
    quality: "quality",
  });
  return poll("/veo31-video/status", data.job_id, 120, 6000);
}

// ─── Image-to-Video FFmpeg (emergency fallback) ──────────────
async function ffmpegFallback(imageUrl: string): Promise<string> {
  const modes = ["center","pan_right","pan_up","top_left"] as const;
  const mode = modes[Math.floor(Date.now() / 10000) % modes.length];
  const { data } = await api().post("/image-to-video/create", {
    image_url: imageUrl, duration: 8, image_format: "jpeg",
    zoom: { mode, speed: 0.002, max_scale: 1.8, pan_speed: 1.0 },
  });
  return poll("/image-to-video/status", data.job_id, 40, 2000);
}

// ─── MAIN ENTRY POINT ─────────────────────────────────────────
export async function generateFoodVideoPhaya(params: {
  imageUrl: string;
  menuName: string;
  menuNameEn?: string;
  description?: string;
  category?: string;
  style?: VideoStyle;
  tier: "fast" | "quality" | "premium";
}): Promise<string> {
  const { imageUrl, menuName, menuNameEn, description, category, style, tier } = params;

  const prompt = await buildPrompt(menuName, menuNameEn, description, category, style);
  console.log(`[phaya] tier=${tier} prompt="${prompt.substring(0, 80)}..."`);

  try {
    if (tier === "fast")    return await seedancePro(imageUrl, prompt);
    if (tier === "quality") return await veo31Fast(imageUrl, prompt);
    /* premium */           return await veo31Quality(imageUrl, prompt);
  } catch (err) {
    // Fallback: ถ้า Phaya credits หมดหรือ error ใช้ FFmpeg
    console.warn("[phaya] AI video failed, using FFmpeg fallback:", err instanceof Error ? err.message : err);
    return ffmpegFallback(imageUrl);
  }
}

// ─── TTS ─────────────────────────────────────────────────────
export async function phayaTTS(text: string): Promise<string> {
  const { data } = await api().post("/text-to-speech/generate", { prompt: text });
  return poll("/text-to-speech/status", data.job_id);
}

// ─── Merge Audio + Video ──────────────────────────────────────
export async function phayaMergeAudioVideo(p: { videoUrl: string; audioUrl: string }): Promise<string> {
  const { data } = await api().post("/media/merge-audio-video", { video_url: p.videoUrl, audio_url: p.audioUrl });
  return poll("/media/status", data.job_id);
}
