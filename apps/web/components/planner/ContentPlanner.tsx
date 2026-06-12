"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, ChevronRight, Clock, TrendingUp, Calendar } from "lucide-react";
import { clsx } from "clsx";

interface ContentIdea {
  time: string;
  platform: string;
  menuIdea: string;
  angle: string;
  caption: string;
  hashtags: string;
  tip: string;
}

interface DayPlan {
  date: string;
  theme: string;
  ideas: ContentIdea[];
}

const DAYS_TH = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
const MONTHS_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function todayTH() {
  const d = new Date();
  return `วัน${DAYS_TH[d.getDay()]}ที่ ${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear()+543}`;
}

const PLATFORM_COLOR: Record<string, string> = {
  TikTok:    "bg-sumi-900 text-white",
  Reels:     "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  Facebook:  "bg-blue-600 text-white",
  "LINE OA": "bg-green-500 text-white",
};

export default function ContentPlanner() {
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);

  async function generatePlan() {
    setLoading(true);
    setPlan(null);
    setExpanded(0);

    const today = new Date();
    const dayName = DAYS_TH[today.getDay()];
    const month = MONTHS_TH[today.getMonth()];

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `วันนี้คือวัน${dayName} เดือน${month}

ช่วยวางแผนคอนเทนต์สำหรับร้านอาหารญี่ปุ่น "Zenkai" วันนี้ทั้งวัน

ตอบเป็น JSON เท่านั้น โครงสร้างนี้:
{
  "theme": "ธีมประจำวัน 1 ประโยค",
  "ideas": [
    {
      "time": "เช้า 8:00",
      "platform": "TikTok",
      "menuIdea": "ชื่อเมนูที่ควรโปรโมท",
      "angle": "มุมมองการนำเสนอ เช่น 'เบื้องหลังเชฟ' หรือ 'ก่อน-หลัง'",
      "caption": "ตัวอย่าง caption ภาษาไทย 2-3 ประโยค",
      "hashtags": "#แฮชแท็ก 5 อัน",
      "tip": "เคล็ดลับถ่ายคลิปนี้ 1 ประโยค"
    }
  ]
}

ให้มีทั้งหมด 4 ไอเดีย แต่ละช่วงเวลา: เช้า สาย บ่าย เย็น
เน้นให้เหมาะกับวัน${dayName}โดยเฉพาะ
platforms ใช้: TikTok, Reels, Facebook, LINE OA (สลับกัน)`
        }]
      }),
    });

    // Read streaming response
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value);
    }

    try {
      const clean = full.replace(/```json|```/g, "").trim();
      const data = JSON.parse(clean);
      setPlan({ date: todayTH(), ...data });
    } catch {
      // retry parse from first { to last }
      const start = full.indexOf("{");
      const end = full.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try {
          const data = JSON.parse(full.slice(start, end + 1));
          setPlan({ date: todayTH(), ...data });
        } catch { /* ignore */ }
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-washi-50">

      {/* Header */}
      <div className="bg-sumi-900 px-5 pt-8 pb-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sumi-400 text-xs tracking-widest uppercase mb-1">AI Content Planner</p>
            <h1 className="text-white font-bold text-2xl">แผนคอนเทนต์</h1>
            <p className="text-sumi-300 text-sm mt-1">{todayTH()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-beni-600 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-24">

        {/* Generate Button */}
        {!plan && !loading && (
          <div className="bg-white rounded-2xl border border-washi-200 shadow-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sumi-900 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-kin-400" />
            </div>
            <h2 className="font-semibold text-sumi-900 mb-1">ให้ AI คิดแผนวันนี้</h2>
            <p className="text-sumi-400 text-sm mb-5 leading-relaxed">
              GPT-4o จะวิเคราะห์วันและเวลา<br />แล้วแนะนำคอนเทนต์ที่เหมาะที่สุด
            </p>
            <button
              onClick={generatePlan}
              className="w-full bg-beni-600 hover:bg-beni-500 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              สร้างแผนคอนเทนต์วันนี้
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-washi-200 shadow-sm p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-sumi-500 text-sm">
              <Sparkles className="w-4 h-4 text-beni-400 animate-pulse" />
              AI กำลังคิดแผนคอนเทนต์...
            </div>
            <div className="mt-4 flex justify-center gap-1.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 bg-beni-300 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Plan */}
        {plan && (
          <div className="space-y-3">
            {/* Theme banner */}
            <div className="bg-sumi-900 rounded-2xl px-5 py-4 flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-sumi-400 text-xs">ธีมวันนี้</p>
                <p className="text-white font-semibold text-sm">{plan.theme}</p>
              </div>
              <button
                onClick={generatePlan}
                className="ml-auto p-2 text-sumi-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Ideas */}
            {plan.ideas.map((idea, i) => (
              <div key={i} className="bg-white rounded-2xl border border-washi-200 shadow-sm overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-4"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="w-10 h-10 rounded-xl bg-sumi-900 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-kin-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-sumi-900">{idea.time}</span>
                      <span className={clsx("text-[11px] font-bold px-2 py-0.5 rounded-full", PLATFORM_COLOR[idea.platform] || "bg-sumi-100 text-sumi-700")}>
                        {idea.platform}
                      </span>
                    </div>
                    <p className="text-sumi-600 text-xs mt-0.5 font-medium">{idea.menuIdea}</p>
                  </div>
                  <ChevronRight className={clsx("w-4 h-4 text-sumi-400 transition-transform flex-shrink-0", expanded === i && "rotate-90")} />
                </button>

                {/* Expanded */}
                {expanded === i && (
                  <div className="px-4 pb-4 space-y-3 border-t border-washi-100 pt-3">
                    <div className="bg-washi-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-sumi-400 uppercase tracking-wide mb-1">มุมนำเสนอ</p>
                      <p className="text-sumi-800 text-sm">{idea.angle}</p>
                    </div>
                    <div className="bg-washi-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-sumi-400 uppercase tracking-wide mb-1">Caption</p>
                      <p className="text-sumi-800 text-sm leading-relaxed">{idea.caption}</p>
                    </div>
                    <div className="bg-kin-50 rounded-xl p-3">
                      <p className="text-kin-600 text-xs">{idea.hashtags}</p>
                    </div>
                    <div className="bg-seiji-100 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base">💡</span>
                      <p className="text-seiji-700 text-xs leading-relaxed">{idea.tip}</p>
                    </div>
                    <a
                      href="/upload"
                      className="flex items-center justify-center gap-2 w-full bg-beni-600 hover:bg-beni-500 text-white text-sm font-semibold py-3 rounded-xl transition-all"
                    >
                      สร้างคลิปนี้เลย →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
