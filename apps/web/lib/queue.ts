import { Queue, Job } from "bullmq";

// ----------------------------------------------------------------
// Redis Connection — ใช้ connection object เพื่อหลีกเลี่ยง ioredis version conflict
// ----------------------------------------------------------------
const redisConnection = {
  host: (() => {
    try { return new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname; } catch { return "localhost"; }
  })(),
  port: (() => {
    try { return parseInt(new URL(process.env.REDIS_URL || "redis://localhost:6379").port || "6379"); } catch { return 6379; }
  })(),
};

// ----------------------------------------------------------------
// Job Types
// ----------------------------------------------------------------
export interface VideoJobData {
  jobId: string;
  menuName: string;
  menuNameEn?: string;
  price?: string;
  description?: string;
  videoTier: "tier1" | "tier2" | "tier3";
  postTo: string[];
  imageUrls: string[];
  script: string;
  scheduleAt?: string;
}

// ----------------------------------------------------------------
// Queues
// ----------------------------------------------------------------
export const videoQueue = new Queue<VideoJobData>("video-generation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export const postQueue = new Queue("social-post", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
  },
});

// ----------------------------------------------------------------
// addVideoJob
// ----------------------------------------------------------------
export async function addVideoJob(data: VideoJobData): Promise<Job> {
  const delay = data.scheduleAt
    ? Math.max(0, new Date(data.scheduleAt).getTime() - Date.now())
    : 0;

  return videoQueue.add("generate", data, {
    jobId: data.jobId,
    delay,
    priority: data.videoTier === "tier1" ? 1 : data.videoTier === "tier2" ? 2 : 3,
  });
}

// ----------------------------------------------------------------
// getQueueStats
// ----------------------------------------------------------------
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    videoQueue.getWaitingCount(),
    videoQueue.getActiveCount(),
    videoQueue.getCompletedCount(),
    videoQueue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed };
}

export { redisConnection };
