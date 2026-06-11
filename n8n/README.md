# n8n — บทบาทใน Kaizen

## ทำไมไม่มี main-pipeline.json แล้ว

Workflow เดิม (`main-pipeline.json`) ถูกถอดออก เพราะ:

1. **ซ้ำซ้อน** — BullMQ workers (`apps/web/workers/`) ทำหน้าที่ทั้ง pipeline อยู่แล้ว
   (gen video → update DB → post queue → แจ้ง Telegram) workflow เดิมแจ้ง Telegram ซ้ำอีกรอบ
2. **มี bug** — HTTP node ยิงไป `/api/jobs/={{jobId}}` ซึ่ง URL ผิด syntax
   (ตอนนี้ route `/api/jobs/[id]` ถูกเพิ่มแล้ว ถ้าจะใช้ ให้ยิง `/api/jobs/{{$json.jobId}}`)

## หลักการแบ่งงาน

- **BullMQ workers** = pipeline หลัก (event-driven, ต่อ job)
- **n8n** = งานตามตารางเวลา (cron) เท่านั้น เช่น:
  - Daily post: ทุกเช้า 10:00 เลือกเมนูจากตาราง `menus` → ยิง POST `/api/upload`
  - Weekly summary: สรุปยอด engagement ส่ง Telegram ทุกวันจันทร์

## หมายเหตุการยิง API จาก n8n

ทุก route มี Basic Auth แล้ว — ใน HTTP Request node ให้ตั้ง
Authentication: Basic Auth ด้วยค่าจาก `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`

## Workflow ที่มีให้: daily-post-reminder.json

Starter template: ทุกวัน 10:00 → ดึง /api/menus → แจ้งเตือน Telegram ให้โพสต์คอนเทนต์

⚠️ ก่อนใช้ ต้องตั้งใน n8n UI:
1. Credential แบบ Basic Auth (ใช้ค่า BASIC_AUTH_USER/PASSWORD) ผูกกับ node "ดึงรายการเมนู"
2. Credential Telegram Bot ผูกกับ node แจ้งเตือน
3. เปิด workflow เป็น Active หลังตรวจใน UI แล้ว
