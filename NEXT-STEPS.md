# 📋 ที่เหลือมีแค่นี้ (ทำได้จากมือถือ 2 ข้อแรก)

ระบบโค้ดเสร็จ 100% แล้ว — เหลือแค่ "กุญแจ" ที่ต้องเป็นเจ้าของบัญชีทำเอง

## 1. สมัครบริการ (ทำจากมือถือได้)
- [ ] **Phaya** → phaya.io → สมัคร → Dashboard → สร้าง API Key (provider หลักตัวเดียว)
- [ ] **Supabase** → supabase.com → New project → copy URL + anon key + service_role key
- [ ] **Cloudflare R2** → dash.cloudflare.com → R2 → สร้าง bucket `kaizen-media` + API token
- [ ] **OpenAI** → platform.openai.com → API key (มีแล้วข้าม)

## 2. รัน SQL ตั้ง schema (จากมือถือได้)
Supabase Dashboard → SQL Editor → วางเนื้อหาไฟล์ `supabase/migrations/001_init.sql` → Run

## 3. Deploy บน VPS (ตอนถึงคอม — copy ทีละบรรทัด)
```bash
ssh root@IP_ของ_VPS
curl -fsSL https://raw.githubusercontent.com/dream30915/kaizen/main/deploy/vps-setup.sh | bash
nano /opt/kaizen/apps/web/.env.local   # ใส่ key จากข้อ 1
bash /opt/kaizen/deploy/vps-setup.sh   # รันซ้ำ → ระบบออนไลน์
```

## 4. เทสต์คลิปแรก
เปิด `http://IP:3000` → login → อัพรูปอาหารจริง 1 รูป → เลือก tier1 →
รอแจ้งเตือน Telegram → **เช็คฟอนต์ไทยบนคลิปเป็นอย่างแรก**

## หมายเหตุ
- TTS ปิดอยู่ (`ENABLE_TTS=false`) — เปิดหลังเทสต์คลิปเงียบผ่านแล้ว
  และเช็ค path merge กับ phaya.io/docs (ปรับได้ผ่าน `PHAYA_MERGE_PATH`)
- Deploy ผ่าน Vercel (GitHub Actions เดิม) ก็ได้ แต่ **workers ต้องรันบน VPS เสมอ**
  เพราะ Vercel ไม่รองรับ process ค้างยาว
