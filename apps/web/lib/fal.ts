/**
 * fal.ai Video Generation — Hailuo 2.3 (MiniMax)
 * 1080p: $0.49/6s | 768p: $0.28/6s
 */
import { createFalClient } from "@fal-ai/client";

function getClient() {
  return createFalClient({ credentials: process.env.FAL_API_KEY || "" });
}

export async function generateHailuoVideo(params: { imageUrl: string; prompt: string }): Promise<string> {
  const fal = getClient();
  const result = await fal.subscribe("fal-ai/minimax-video/image-to-video", {
    input: { image_url: params.imageUrl, prompt: params.prompt, duration: 6, resolution: "1080p" },
    pollInterval: 5000,
    timeout: 180000,
    logs: false,
  });
  const data = result.data as { video?: { url?: string } };
  if (!data?.video?.url) throw new Error("Hailuo: no video URL returned");
  return data.video.url;
}

export async function generateHailuoStandard(params: { imageUrl: string; prompt: string }): Promise<string> {
  const fal = getClient();
  const result = await fal.subscribe("fal-ai/minimax-video/image-to-video", {
    input: { image_url: params.imageUrl, prompt: params.prompt, duration: 6, resolution: "768p" },
    pollInterval: 5000,
    timeout: 120000,
    logs: false,
  });
  const data = result.data as { video?: { url?: string } };
  if (!data?.video?.url) throw new Error("Hailuo Standard: no video URL returned");
  return data.video.url;
}
