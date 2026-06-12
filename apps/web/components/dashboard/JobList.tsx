"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Clock, Loader2, AlertCircle, Send, RefreshCw, Download, Copy, Play, X } from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface Job {
  id: string;
  menu_name: string;
  menu_name_en?: string;
  price?: number;
  video_tier: "tier1" | "tier2" | "tier3";
  post_to: string[];
  status: "pending" | "processing" | "done" | "error" | "posted";
  video_url?: string;
  script?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  pending:    { icon: Clock,        label: "รอดำเนินการ",    color: "text-sumi-500",  bg: "bg-sumi-100" },
  processing: { icon: Loader2,      label: "กำลังสร้าง...", color: "text-blue-600",  bg: "bg-blue-50",  spin: true },
  done:       { icon: CheckCircle2, label: "เสร็จแล้ว",      color: "text-seiji-600", bg: "bg-seiji-100" },
  error:      { icon: AlertCircle,  label: "ผิดพลาด",        color: "text-beni-600",  bg: "bg-beni-50" },
  posted:     { icon: Send,         label: "โพสต์แล้ว",      color: "text-kin-600",   bg: "bg-kin-50" },
} as const;

const TIER_LABELS = { tier1: "⚡ Template", tier2: "✨ AI Video", tier3: "🎬 Cinematic" };

function parseCaption(script?: string): string {
  if (!script) return "";
  try {
    const d = JSON.parse(script);
    return [d.caption, d.hashtags].filter(Boolean).join("\n\n");
  } catch {
    return script.substring(0, 300);
  }
}

// ─── Video Modal ─────────────────────────────────────────────
function VideoModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <video
          src={url}
          controls
          autoPlay
          className="w-full rounded-2xl shadow-2xl"
          style={{ maxHeight: "80vh" }}
        />
        <div className="mt-3 flex gap-2">
          <a
            href={url}
            download={`${name}.mp4`}
            className="flex-1 flex items-center justify-center gap-2 bg-beni-600 hover:bg-beni-500 text-white text-sm font-semibold py-3 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลด
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────
function JobCard({ job }: { job: Job }) {
  const cfg = STATUS_CONFIG[job.status];
  const Icon = cfg.icon;
  const [showVideo, setShowVideo] = useState(false);
  const [copied, setCopied] = useState(false);
  const caption = parseCaption(job.script);

  const copyCaption = async () => {
    if (!caption) return;
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {showVideo && job.video_url && (
        <VideoModal url={job.video_url} name={job.menu_name} onClose={() => setShowVideo(false)} />
      )}

      <div className="bg-white rounded-2xl border border-washi-200 shadow-sm overflow-hidden">
        <div className="flex gap-0">

          {/* Thumbnail / Status Panel */}
          <div
            className={clsx(
              "w-20 flex-shrink-0 flex items-center justify-center relative",
              job.video_url ? "cursor-pointer bg-sumi-900 hover:bg-sumi-800 transition-colors" : "bg-washi-100"
            )}
            onClick={() => job.video_url && setShowVideo(true)}
          >
            {job.video_url ? (
              <>
                <video src={job.video_url} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              </>
            ) : (
              <Icon className={clsx("w-6 h-6", cfg.color, "spin" in cfg && cfg.spin && "animate-spin")} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sumi-900 text-sm truncate">{job.menu_name}</h3>
                {job.menu_name_en && <p className="text-sumi-400 text-xs truncate">{job.menu_name_en}</p>}
              </div>
              <span className={clsx("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0", cfg.bg, cfg.color)}>
                <Icon className={clsx("w-3 h-3", "spin" in cfg && cfg.spin && "animate-spin")} />
                {cfg.label}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-sumi-400">
              <span>{TIER_LABELS[job.video_tier]}</span>
              {job.price && <><span>·</span><span>฿{job.price.toLocaleString()}</span></>}
              <span>·</span>
              <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: th })}</span>
            </div>

            {job.error_message && (
              <p className="text-xs text-beni-500 mt-2 line-clamp-2">{job.error_message}</p>
            )}

            {/* Actions */}
            {job.video_url && job.status === "done" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowVideo(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sumi-900 hover:bg-sumi-800 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Play className="w-3 h-3 fill-white" />
                  ดูวิดีโอ
                </button>
                <a
                  href={job.video_url}
                  download={`${job.menu_name}.mp4`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-washi-100 hover:bg-washi-200 text-sumi-700 text-xs font-medium rounded-lg transition-colors"
                >
                  <Download className="w-3 h-3" />
                  บันทึก
                </a>
                {caption && (
                  <button
                    onClick={copyCaption}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      copied ? "bg-seiji-100 text-seiji-700" : "bg-washi-100 hover:bg-washi-200 text-sumi-700"
                    )}
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? "คัดลอกแล้ว ✓" : "คัดลอก Caption"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?limit=20&offset=0");
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const t = setInterval(fetchJobs, 8000);
    return () => clearInterval(t);
  }, [fetchJobs]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-beni-400 animate-spin" /></div>;
  if (jobs.length === 0) return (
    <div className="bg-white rounded-2xl border border-washi-200 p-12 text-center">
      <p className="text-sumi-400 text-sm">ยังไม่มีงาน — กดสร้างวิดีโอแรกได้เลย</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-sumi-500">ทั้งหมด {total} งาน</p>
        <button onClick={fetchJobs} className="flex items-center gap-1.5 text-xs text-sumi-400 hover:text-sumi-700">
          <RefreshCw className="w-3.5 h-3.5" />รีเฟรช
        </button>
      </div>
      <div className="space-y-3">
        {jobs.map(job => <JobCard key={job.id} job={job} />)}
      </div>
    </div>
  );
}
