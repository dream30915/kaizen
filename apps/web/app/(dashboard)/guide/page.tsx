export const metadata = { title: "วิธีใช้งาน — Zenkai" };

const steps = [
  {
    num: 1,
    icon: "📸",
    title: "ถ่ายรูปอาหาร",
    desc: "ถ่าย 3-5 รูปต่อเมนู แสงดี จัดจานให้เรียบร้อย ถ่ายมุม 45 องศาจะได้ผลดีที่สุด",
  },
  {
    num: 2,
    icon: "🤖",
    title: "AI เขียน Script",
    desc: "GPT-4o จะสร้าง Hook, Caption และ Hashtag ภาษาไทยให้อัตโนมัติ",
  },
  {
    num: 3,
    icon: "🎬",
    title: "Phaya สร้างวิดีโอ",
    desc: "วิดีโอขนาด 9:16 (แนวตั้ง) พร้อมข้อความและ Ken Burns effect ใช้เวลา ~10 วิ",
  },
  {
    num: 4,
    icon: "💾",
    title: "ดาวน์โหลดและโพสต์",
    desc: "ดาวน์โหลดคลิปจากหน้า 'งานทั้งหมด' แล้วโพสต์บน TikTok, Reels, Facebook ได้เลย",
  },
];

const tiers = [
  { tier: "Tier 1", icon: "⚡", speed: "~10 วิ", quality: "ดี", use: "โพสต์ทุกวัน", color: "bg-blue-50 border-blue-200" },
  { tier: "Tier 2", icon: "🎬", speed: "~2 นาที", quality: "สวยมาก", use: "เมนูพิเศษ", color: "bg-purple-50 border-purple-200" },
  { tier: "Tier 3", icon: "👑", speed: "~5 นาที", quality: "Premium", use: "โปรโมชั่นใหญ่", color: "bg-amber-50 border-amber-200" },
];

const tips = [
  { icon: "💡", text: "แสงธรรมชาติหรือไฟขาวสะอาดให้ผลดีที่สุด" },
  { icon: "📐", text: "ถ่ายแนวตั้ง (Portrait) พอดีกับ TikTok/Reels 9:16" },
  { icon: "🍽️", text: "จัดจานให้เรียบร้อยก่อนถ่ายทุกครั้ง" },
  { icon: "🚫", text: "หลีกเลี่ยงพื้นหลังรกหรือมีคนเดินผ่าน" },
  { icon: "🔢", text: "อัพ 3-5 รูปต่อเมนูเพื่อให้คลิปมีหลายมุม" },
];

const faqs = [
  {
    q: "คลิปออกมา error ทำไง?",
    a: "ลองกดสร้างใหม่อีกครั้ง Phaya อาจ timeout ชั่วคราว ถ้ายังพังให้แจ้ง admin",
  },
  {
    q: "คลิปไม่สวยพอ?",
    a: "เปลี่ยนมาใช้ Tier 2 หรือถ่ายรูปใหม่ให้สว่างและชัดขึ้น",
  },
  {
    q: "เว็บเข้าไม่ได้?",
    a: "ตรวจสอบว่า URL มี http:// นำหน้า: http://72.61.125.87",
  },
  {
    q: "อยากเพิ่มเมนูใหม่ไว้ใช้บ่อย?",
    a: "ไปที่ 'คลังเมนู' แล้วกดเพิ่มเมนู ครั้งหน้าไม่ต้องกรอกข้อมูลใหม่",
  },
];

export default function GuidePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📖 วิธีใช้งาน Zenkai</h1>
        <p className="text-gray-500 mt-1">ถ่ายรูปอาหาร → ได้คลิปพร้อมโพสต์ภายใน 2 นาที</p>
      </div>

      {/* Pipeline Steps */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ขั้นตอนการทำงาน</h2>
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-sakura-50 flex items-center justify-center text-xl flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {s.num}. {s.title}
                </p>
                <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">เลือก Tier วิดีโอ</h2>
        <div className="space-y-3">
          {tiers.map((t) => (
            <div key={t.tier} className={`rounded-2xl border p-4 ${t.color}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  {t.icon} {t.tier}
                </span>
                <span className="text-xs bg-white rounded-full px-3 py-1 border text-gray-600">
                  {t.use}
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span>⏱ {t.speed}</span>
                <span>✨ {t.quality}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">💡 แนะนำเริ่มด้วย Tier 1 ก่อนเสมอ</p>
      </section>

      {/* Tips */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">เคล็ดลับถ่ายรูปให้คลิปสวย</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {tips.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <span className="text-lg">{t.icon}</span>
              <p className="text-sm text-gray-700">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">คำถามที่พบบ่อย</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="font-medium text-gray-900 text-sm">❓ {f.q}</p>
              <p className="text-gray-500 text-sm mt-1.5">→ {f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Start CTA */}
      <div className="bg-sakura-50 border border-sakura-100 rounded-2xl p-6 text-center">
        <p className="text-2xl mb-2">🍣</p>
        <p className="font-semibold text-gray-900">พร้อมสร้างคลิปแรกแล้ว!</p>
        <p className="text-sm text-gray-500 mt-1">กดปุ่ม "สร้างวิดีโอ" ในเมนูซ้ายได้เลย</p>
      </div>
    </div>
  );
}
