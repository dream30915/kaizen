#!/usr/bin/env bash
# ============================================================
# Kaizen — VPS Production Setup (Ubuntu 22.04/24.04)
# รันบน VPS ครั้งเดียว ติดตั้งทุกอย่างจนระบบออนไลน์:
#
#   curl -fsSL https://raw.githubusercontent.com/dream30915/zenkai/main/deploy/vps-setup.sh | bash
#
# หรือถ้า clone แล้ว:  bash deploy/vps-setup.sh
#
# รันซ้ำได้ (idempotent) — ใช้เป็นคำสั่ง update ได้ด้วย
# ============================================================
set -euo pipefail

APP_DIR="/opt/zenkai"
REPO_URL="https://github.com/dream30915/zenkai.git"
WEB_PORT=3000

log() { echo -e "\n\033[1;32m▶ $1\033[0m"; }

# ------------------------------------------------------------
# 0. ต้องเป็น root หรือมี sudo
# ------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; else SUDO=""; fi

# ------------------------------------------------------------
# 1. Docker + Compose
# ------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "ติดตั้ง Docker..."
  curl -fsSL https://get.docker.com | $SUDO sh
fi

# ------------------------------------------------------------
# 2. Node.js 20
# ------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  log "ติดตั้ง Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
  $SUDO apt-get install -y nodejs
fi

# ------------------------------------------------------------
# 2.5 ฟอนต์ไทย — จำเป็นสำหรับ text overlay บนรูป/คลิป
# ------------------------------------------------------------
if ! fc-list :lang=th 2>/dev/null | grep -q .; then
  log "ติดตั้งฟอนต์ไทย..."
  $SUDO apt-get update -qq && $SUDO apt-get install -y fonts-thai-tlwg fontconfig
fi

# ------------------------------------------------------------
# 3. Clone / Pull repo
# ------------------------------------------------------------
if [ -d "$APP_DIR/.git" ]; then
  log "อัปเดตโค้ดล่าสุดจาก GitHub..."
  cd "$APP_DIR" && git pull --ff-only
else
  log "Clone repo ลง $APP_DIR ..."
  $SUDO mkdir -p "$APP_DIR" && $SUDO chown "$(whoami)" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ------------------------------------------------------------
# 4. Env file
# ------------------------------------------------------------
ENV_FILE="$APP_DIR/apps/web/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  cp "$APP_DIR/.env.example" "$ENV_FILE"
  log "⚠️  สร้าง $ENV_FILE จาก template แล้ว"
  echo "   ต้องใส่ค่าจริงก่อนระบบจะทำงาน:"
  echo "   nano $ENV_FILE"
  echo ""
  echo "   ค่าขั้นต่ำ: SUPABASE_* / OPENAI_API_KEY / PHAYA_API_KEY / R2_* / BASIC_AUTH_*"
  echo "   ใส่เสร็จแล้วรันสคริปต์นี้ซ้ำอีกรอบ"
  exit 0
fi

# กันลืมเปลี่ยนรหัส
if grep -q "เปลี่ยนรหัสนี้ก่อน_deploy" "$ENV_FILE"; then
  echo "❌ ยังไม่ได้เปลี่ยน BASIC_AUTH_PASSWORD ใน $ENV_FILE — เปลี่ยนก่อนแล้วรันใหม่"
  exit 1
fi

# ------------------------------------------------------------
# 5. Docker services (redis, postgres, n8n, rembg)
# ------------------------------------------------------------
log "Start Docker services..."
cd "$APP_DIR" && $SUDO docker compose up -d

# ------------------------------------------------------------
# 6. Build Next.js
# ------------------------------------------------------------
log "Install + Build เว็บ..."
cd "$APP_DIR/apps/web"
npm ci --no-audit --no-fund
set -a; source "$ENV_FILE"; set +a
npm run build

# ------------------------------------------------------------
# 7. systemd services — web + workers
# ------------------------------------------------------------
log "ตั้งค่า systemd services..."

$SUDO tee /etc/systemd/system/zenkai-web.service > /dev/null << UNIT
[Unit]
Description=Kaizen Web (Next.js)
After=network.target docker.service

[Service]
WorkingDirectory=$APP_DIR/apps/web
EnvironmentFile=$ENV_FILE
ExecStart=$(command -v npx) next start -p $WEB_PORT
Restart=always
RestartSec=5
User=$(whoami)

[Install]
WantedBy=multi-user.target
UNIT

$SUDO tee /etc/systemd/system/zenkai-workers.service > /dev/null << UNIT
[Unit]
Description=Kaizen Workers (BullMQ video+post)
After=network.target docker.service zenkai-web.service

[Service]
WorkingDirectory=$APP_DIR/apps/web
EnvironmentFile=$ENV_FILE
ExecStart=$(command -v npm) run workers
Restart=always
RestartSec=5
User=$(whoami)

[Install]
WantedBy=multi-user.target
UNIT

$SUDO systemctl daemon-reload
$SUDO systemctl enable --now zenkai-web zenkai-workers
$SUDO systemctl restart zenkai-web zenkai-workers

# ------------------------------------------------------------
# 8. สรุป
# ------------------------------------------------------------
IP=$(hostname -I | awk '{print $1}')
log "เสร็จแล้ว! 🎉"
echo "  เว็บ:        http://$IP:$WEB_PORT  (login ด้วย BASIC_AUTH_USER/PASSWORD)"
echo "  n8n:         http://$IP:5678"
echo "  ดู log เว็บ:   journalctl -u zenkai-web -f"
echo "  ดู log worker: journalctl -u zenkai-workers -f"
echo ""
echo "  อัปเดตโค้ดรอบหน้า: รัน bash $APP_DIR/deploy/vps-setup.sh ซ้ำ"
echo ""
echo "  💡 แนะนำเพิ่ม: ปิด port ที่ไม่ใช้ด้วย ufw และทำ HTTPS ด้วย Caddy/Cloudflare Tunnel"
