/**
 * Phaya.io API Client — Updated June 2026
 * Models: Seedance Pro (Tier 1), Veo 3.1 (Tier 2/3)
 * Prompt: GPT-4o generates professional cinematic prompts
 */

import axios from "axios";
import OpenAI from "openai";
import { generateHailuoVideo, generateHailuoStandard } from "./fal";

const BASE_URL = "https://api.phaya.io/api/v1";
const api = () =>
  axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${process.env.PHAYA_API_KEY!}`, "Content-Type": "application/json" },
    timeout: 120000,
  });

// ── Poll helper ────────────────────────────────────────────────
async function pollStatus(
  endpoint: string, jobId: string,
  maxAttempts = 120, intervalMs = 5000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    const res = await api().get(`${endpoint}/${jobId}`);
    const { status, video_url, image_url, audio_url } = res.data;
    if (status === "completed" || status === "success") {
      return video_url || image_url || audio_url || "";
    }
    if (status === "failed" || status === "error") {
      throw new Error(`Phaya job failed: ${res.data.error || "unknown error"}`);
    }
  }
  throw new Error("Phaya job timed out");
}

// ── GPT-4o: Generate PROFESSIONAL cinematic video prompt ───────
// คีย์: prompt คือสิ่งที่ทำให้คลิปดูมืออาชีพหรือกระจอก
async function generateCinematicPrompt(params: {
  menuName: string;
  menuNameEn?: string;
  description?: string;
  category?: string;
}): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { menuName, menuNameEn, description, category } = params;

  const dish = menuNameEn || menuName;

  const { choices } = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 200,
    temperature: 0.7,
    messages: [{
      role: "system",
      content: `You are an expert food video director for luxury Japanese restaurants.
Write a cinematic video prompt for AI video generation (Seedance model).
The prompt MUST:
- Be 40-80 words in English only
- Describe MOTION first: what moves, how it moves (chopsticks lifting, steam curling, sauce dripping, broth rippling, chef hands, garnish being placed)
- Include lighting: warm bokeh, shallow DOF, golden rim light, soft studio light
- Include camera: slow push in, gentle orbit, top-down with slow zoom, macro close-up
- Feel like a high-end restaurant commercial or Michelin star photography
- NO text, NO watermarks, NO subtitles
Output ONLY the prompt, nothing else.`
    }, {
      role: "user",
      content: `Dish: ${dish}${description ? `\nDetails: ${description}` : ""}${category ? `\nCategory: ${category}` : ""}`
    }]
  });

  return choices[0].message.content?.trim() ||
    `${dish}, luxury Japanese restaurant close-up, chopsticks gently lifting, steam rising gracefully, glistening in warm golden light, shallow depth of field with soft bokeh, slow cinematic push-in, professional food photography`;
}

// ── Seedance Pro (image-to-video) ──────────────────────────────
// 6 credits / 8s — เหมือนถ่ายจริง
async function generateSeedancePro(imageUrl: string, prompt: string): Promise<string> {
  const res = await api().post("/seedance-video/create", {
    image_url: imageUrl,
    prompt,
    duration: "8",
  });
  return pollStatus("/seedance-video/status", res.data.job_id, 80, 5000);
}

// ── Veo 3.1 (Google DeepMind) ─────────────────────────────────
// 15 credits — Google AI คุณภาพสูงสุด
async function generateVeo31(imageUrl: string, prompt: string): Promise<string> {
  const res = await api().post("/veo31-video/create", {
    image_url: imageUrl,
    prompt: prompt + ", 9:16 vertical format",
  });
  return pollStatus("/veo31-video/status", res.data.job_id, 100, 6000);
}

// ── Image-to-Video FFmpeg (Ken Burns) — fallback ──────────────
async function generateImageToVideo(imageUrl: string): Promise<string> {
  const PRESETS = [
    { mode: "center",       speed: 0.002, max_scale: 1.8 },
    { mode: "top_left",     speed: 0.0025, max_scale: 2.0 },
    { mode: "pan_right",    speed: 0.003, max_scale: 1.5, pan_speed: 0.8 },
    { mode: "pan_up",       speed: 0.002, max_scale: 1.6, pan_speed: 0.6 },
  ] as const;
  const preset = PRESETS[Math.floor(Date.now() / 10000) % PRESETS.length];
  const res = await api().post("/image-to-video/create", {
    image_url: imageUrl, duration: 8, image_format: "jpeg",
    zoom: { mode: preset.mode, speed: preset.speed, max_scale: preset.max_scale, pan_speed: "pan_speed" in preset ? preset.pan_speed : 1.0 },
  });
  return pollStatus("/image-to-video/status", res.data.job_id, 40, 2000);
}

// ── MAIN ENTRY POINT ───────────────────────────────────────────
// tier: fast=Seedance, quality=Veo3.1, premium=Veo3.1 enhanced
export async function generateFoodVideoPhaya(params: {
  imageUrl: string;
  menuName: string;
  menuNameEn?: string;
  description?: string;
  category?: string;
  tier: "fast" | "quality" | "premium";
}): Promise<string> {
  const { imageUrl, tier } = params;

  // Generate professional cinematic prompt via GPT-4o
  const prompt = await generateCinematicPrompt({
    menuName: params.menuName,
    menuNameEn: params.menuNameEn,
    description: params.description,
    category: params.category,
  });

  console.log(`[phaya] Tier: ${tier} | Prompt: ${prompt}`);

  if (tier === "fast") {
    // Hailuo Standard 768p — $0.28/6s, ถูกสุด, คุณภาพดี
    if (process.env.FAL_API_KEY) {
      try { return await generateHailuoStandard({ imageUrl, prompt }); }
      catch (e) { console.warn("[phaya] Hailuo Standard failed, fallback Seedance:", e); }
    }
    return generateSeedancePro(imageUrl, prompt);
  }
  if (tier === "quality") {
    // Hailuo Pro 1080p — $0.49/6s, คุณภาพสูง
    if (process.env.FAL_API_KEY) {
      try { return await generateHailuoVideo({ imageUrl, prompt }); }
      catch (e) { console.warn("[phaya] Hailuo Pro failed, fallback Seedance:", e); }
    }
    return generateSeedancePro(imageUrl, prompt);
  }
  // Premium: Veo 3.1 — Google AI สูงสุด
  const premiumPrompt = prompt + ", ultra cinematic, award-winning food photography, Michelin star presentation";
  if (process.env.FAL_API_KEY) {
    try { return await generateHailuoVideo({ imageUrl, prompt: premiumPrompt }); }
    catch (e) { console.warn("[phaya] Hailuo Premium failed, fallback Veo:", e); }
  }
  return generateVeo31(imageUrl, premiumPrompt);
}

// ── TTS (Thai voice) ──────────────────────────────────────────
export async function phayaTTS(text: string): Promise<string> {
  const res = await api().post("/text-to-speech/generate", { prompt: text });
  return pollStatus("/text-to-speech/status", res.data.job_id);
}

// ── Merge audio + video ───────────────────────────────────────
export async function phayaMergeAudioVideo(params: { videoUrl: string; audioUrl: string }): Promise<string> {
  const res = await api().post("/media/merge-audio-video", { video_url: params.videoUrl, audio_url: params.audioUrl });
  return pollStatus("/media/status", res.data.job_id);
}
