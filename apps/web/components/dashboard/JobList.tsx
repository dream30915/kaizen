"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Send,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Job {
  id: string;
  menu_name: string;
  menu_name_en?: string;
  price?: number;
  video_tier: "tier1" | "tier2" | "tier3";
  post_to: string[];
  status: "pending" | "processing" | "done" | "error" | "posted";
  video_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "รอดำเนินการ",
    color: "text-gray-500",
    bg: "bg-gray-100",
  },
  processing: {
    icon: Loader2,
    label: "กำลังประมวลผล",
    color: "text-blue-600",
    bg: "bg-blue-50",
    spin: true,
  },
  done: {
    icon: CheckCircle2,
    label: "เสร็จแล้ว",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  error: {
    icon: AlertCircle,
    label: "เกิดข้อผิดพลาด",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  posted: {
    icon: Send,
    label: "โพสต์แล้ว",
    color: "text-sakura-600",
    bg: "bg-sakura-50",
  },
} as const;

const TIER_LABELS = {
  tier1: "Template ⚡",
  tier2: "AI Video ✨",
  tier3: "Cinematic 🎬",
} as const;

// ----------------------------------------------------------------
// JobCard
// ----------------------------------------------------------------
function JobCard({ job }: { job: Job }) {
  const cfg = STATUS_CONFIG[job.status];
  const Icon = cfg.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {job.menu_name}
            </h3>
            {job.menu_name_en && (
              <span className="text-xs text-gray-400 truncate">
                ({job.menu_name_en})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{TIER_LABELS[job.video_tier]}</span>
            {job.price && <span>฿{job.price.toLocaleString()}</span>}
            <span>
              {formatDistanceToNow(new Date(job.created_at), {
                addSuffix: true,
                locale: th,
              })}
            </span>
          </div>
          {job.post_to.length > 0 && (
            <div className="flex gap-1 mt-2">
              {job.post_to.map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 capitalize"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          {job.error_message && (
            <p className="text-xs text-red-500 mt-2 line-clamp-2">
              {job.error_message}
            </p>
          )}
        </div>

        <div
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0",
            cfg.bg,
            cfg.color
          )}
        >
          <Icon
            className={clsx(
              "w-3.5 h-3.5",
              "spin" in cfg && cfg.spin && "animate-spin"
            )}
          />
          {cfg.label}
        </div>
      </div>

      {job.video_url && job.status === "done" && (
        <a
          href={job.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-xs text-sakura-600 hover:underline"
        >
          ▶ ดูวิดีโอ
        </a>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// JobList
// ----------------------------------------------------------------
export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/jobs?limit=20&offset=0");
      if (!res.ok) throw new Error("โหลดข้อมูลไม่ได้");
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    // Poll every 10s for active jobs
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-sakura-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchJobs}
          className="mt-3 text-xs text-red-500 hover:underline"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">
          ยังไม่มีงาน — เริ่มจากการอัปโหลดเมนูก่อน
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">ทั้งหมด {total} งาน</p>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          รีเฟรช
        </button>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
