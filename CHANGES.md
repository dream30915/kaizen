# การแก้ไข — 11 มิ.ย. 2026

แก้ครบทุกประเด็นจาก code review: auth, TTS เสียเงินฟรี, provider sprawl,
parsing เปราะ, n8n ซ้ำซ้อน + bug ที่เจอเพิ่มอีก 1 ตัว (worker crash)

## 🔴 Bug ที่เจอเพิ่มระหว่างแก้ (ร้ายแรงสุด)

**Workers ใช้ Supabase client ผิดตัว** — `lib/supabase/server.ts` เรียก `cookies()`
จาก `next/headers` ซึ่งมีเฉพาะใน Next.js request context → รันใน tsx worker จะ
**crash ทันที** แถมเรียกแบบไม่ `await` ด้วย (ได้ Promise มา `.from()` ต่อ = พัง)
ผลคือ job ทำเสร็จแต่ DB ไม่เคยถูก update

→ เพิ่ม `lib/supabase/admin.ts` (plain client) ใช้ใน worker ทั้ง 2 ตัว

## รายการแก้ทั้งหมด

| # | ปัญหา | การแก้ | ไฟล์ |
|---|-------|--------|------|
| 1 | API เปิดโล่ง ไม่มี auth | Basic Auth middleware ครอบทั้งแอพ+API | `middleware.ts` (ใหม่) |
| 2 | TTS gen เสียงแล้วไม่เคย merge ลงคลิป = จ่ายฟรี | ปิด default (`ENABLE_TTS=false`) ถ้าเปิดจะ merge ผ่าน Phaya จริง | `video.worker.ts`, `phaya.ts` |
| 3 | Video provider 4 เจ้า + fallback bug (tier1 fail → เรียก tier1 ซ้ำ) | เหลือ Phaya เป็นหลัก, Creatomate เป็น fallback เดียว, ถอด Kling/Runway | `video.ts` |
| 4 | Parsing script เปราะ (`split("\n")[0]` ได้หัวข้อ ไม่ใช่ hook) | LLM ตอบเป็น JSON (`response_format: json_object`) + `parseMenuContent()` รองรับ job เก่า | `ai.ts` |
| 5 | n8n pipeline ซ้ำกับ worker + URL bug + route ไม่มีจริง | ลบ workflow, เพิ่ม README กำหนดบทบาท n8n = cron เท่านั้น, เพิ่ม route `/api/jobs/[id]` | `n8n/README.md`, `app/api/jobs/[id]/route.ts` |
| 6 | DB insert error ถูกกลืน → job หายจาก dashboard เงียบ ๆ | Fail fast คืน 500 พร้อมข้อความ | `app/api/upload/route.ts` |
| 7 | `PHAYA_API_KEY` ไม่มีใน .env.example ทั้งที่โค้ดใช้เป็น primary | เพิ่มแล้ว + mark Kling/Runway/ElevenLabs เป็น optional | `.env.example` |

## สิ่งที่ต้องทำต่อ (ตามลำดับ)

1. `cp .env.example apps/web/.env.local` แล้วใส่ค่าจริงขั้นต่ำ:
   `SUPABASE_*`, `OPENAI_API_KEY`, `PHAYA_API_KEY`, `R2_*`, `BASIC_AUTH_*`
2. เทสต์คลิปแรก: รัน web + worker → อัพรูปจริง 1 รูป → ดูคลิป tier1 (Phaya FFmpeg)
   **เช็คฟอนต์ไทย/สระ/วรรณยุกต์บนคลิปเป็นอย่างแรก**
3. ⚠️ endpoint `merge-audio-video` ใน `phaya.ts` ตั้งชื่อตามหน้า docs —
   ตรวจ path จริงกับ https://phaya.io/docs ก่อนเปิด `ENABLE_TTS=true`
4. Typecheck ผ่านแล้ว (`tsc --noEmit` ไม่มี error)

## วิธี apply patch

```bash
cd kaizen
git apply kaizen-fixes.patch
# หรือแตก zip ทับ (path ตรงกับ repo)
```
