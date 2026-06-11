/**
 * File Storage — Supabase Storage (bucket: media)
 *
 * เปลี่ยนจาก Cloudflare R2 → Supabase Storage เพราะ:
 * - ใช้ Supabase อยู่แล้ว (DB) ไม่ต้องสมัคร/จัดการ key เพิ่มอีกเจ้า
 * - Free tier 1GB เพียงพอ (เก็บรูปเมนู + ไฟล์เสียงชั่วคราว)
 * - bucket "media" เป็น public → Phaya ดึงรูปไปทำคลิปได้ตรง ๆ
 *
 * ใช้ REST API ตรง ๆ (ไม่พึ่ง SDK) เพื่อให้ทำงานได้ทั้งใน Next.js และ worker
 */

const SUPABASE_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.STORAGE_BUCKET || "media";

// ----------------------------------------------------------------
// uploadToR2 — ชื่อเดิมคงไว้เพื่อไม่ต้องแก้ผู้เรียกทุกจุด
// อัปโหลดไฟล์ขึ้น Supabase Storage แล้วคืน public URL
// ----------------------------------------------------------------
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL()}/storage/v1/object/${BUCKET}/${key}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY()}`,
        apikey: SERVICE_KEY(),
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Storage upload failed (${res.status}): ${detail}`);
  }

  return `${SUPABASE_URL()}/storage/v1/object/public/${BUCKET}/${key}`;
}

export const uploadFile = uploadToR2;

// ----------------------------------------------------------------
// getPresignedUrl — signed URL ชั่วคราว (เผื่อใช้กับไฟล์ private ในอนาคต)
// ----------------------------------------------------------------
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL()}/storage/v1/object/sign/${BUCKET}/${key}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY()}`,
        apikey: SERVICE_KEY(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    }
  );
  if (!res.ok) throw new Error(`Sign URL failed (${res.status})`);
  const data = (await res.json()) as { signedURL: string };
  return `${SUPABASE_URL()}/storage/v1${data.signedURL}`;
}
