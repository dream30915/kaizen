/**
 * Professional Food Video Prompt Library
 * Research-based: ASMR, Cinematic, Money Shot, Behind the Scenes
 * สำหรับร้านอาหารญี่ปุ่น Zenkai
 */

export type VideoStyle =
  | "cinematic"    // โฆษณา high-end
  | "asmr"         // เสียง + texture detail
  | "money_shot"   // moment ที่ดราม่าสุด
  | "bts"          // behind the scenes
  | "reveal"       // เปิดเผยจาน / plating
  | "pour"         // ราดซอส/น้ำซุป

export interface PromptPreset {
  style: VideoStyle
  label: string
  icon: string
  desc: string
  build: (dish: string, desc?: string) => string
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    style: "cinematic",
    label: "Cinematic",
    icon: "🎬",
    desc: "สไตล์โฆษณา Michelin — แสงทอง กล้อง slow push-in",
    build: (dish, desc) =>
      `${dish} Japanese restaurant luxury food commercial, extreme macro close-up, ` +
      `glistening ingredients with perfect plating${desc ? `, ${desc}` : ""}, ` +
      `shallow depth of field with soft warm bokeh background, golden rim backlight, ` +
      `slow cinematic push-in, dark moody restaurant atmosphere, ` +
      `steam rising gently, appetizing highlights, Michelin star presentation, ` +
      `hyper-realistic, 9:16 vertical, no text overlay, no subtitles`,
  },
  {
    style: "asmr",
    label: "ASMR",
    icon: "🎵",
    desc: "เสียง + texture detail — viral บน TikTok",
    build: (dish, desc) =>
      `Extreme macro ASMR food video of ${dish}${desc ? ` with ${desc}` : ""}, ` +
      `ultra-detailed crispy and glossy textures catching warm side-backlight, ` +
      `chopsticks lifting gently, natural sound design — crisp crunch, gentle sizzle, ` +
      `soft steam hiss, broth surface ripples in slow motion, ` +
      `shallow depth of field, dark high-contrast background, ` +
      `food dripping and stretching, hyper-realistic texture, 9:16 vertical, no text`,
  },
  {
    style: "money_shot",
    label: "Money Shot",
    icon: "💥",
    desc: "moment ที่ดราม่าสุด — ตะเกียบหยิบ/ซอสหยด/ไฟลุก",
    build: (dish, desc) =>
      `The ultimate money shot of ${dish}: ` +
      `chopsticks slowly lifting from the dish, sauce dripping back in slow motion, ` +
      `steam rising dramatically, ingredients glistening under warm golden backlight, ` +
      `${desc ? desc + ", " : ""}` +
      `extreme macro with razor-thin depth of field, ` +
      `background completely blurred with warm amber bokeh, ` +
      `cinematic 240fps slow motion reveal, dark premium restaurant ambiance, ` +
      `professional food photography lighting, 9:16 vertical, no text overlay`,
  },
  {
    style: "bts",
    label: "Behind the Scenes",
    icon: "👨‍🍳",
    desc: "เชฟทำอาหาร — สร้าง trust และ engagement",
    build: (dish, desc) =>
      `Behind-the-scenes Japanese restaurant kitchen: chef's hands expertly preparing ${dish}` +
      `${desc ? `, ${desc}` : ""}, ` +
      `skilled knife work in close-up, fresh ingredients arranged on wooden cutting board, ` +
      `steam rising from hot pan, professional kitchen atmosphere, ` +
      `warm overhead lighting with soft side fill, shallow depth of field, ` +
      `authentic documentary style, 9:16 vertical, no text`,
  },
  {
    style: "reveal",
    label: "Plating Reveal",
    icon: "🍽️",
    desc: "เปิดเผยจาน — overhead shot สวยงาม",
    build: (dish, desc) =>
      `Elegant plating reveal of ${dish}${desc ? ` — ${desc}` : ""}: ` +
      `top-down overhead shot slowly pushing in, ` +
      `chef's hand places the final garnish with precision, ` +
      `arranged on premium ceramic plate or wooden board, ` +
      `soft directional studio lighting, ingredients glistening and fresh, ` +
      `fine dining aesthetic, dark textured background, ` +
      `final frame holds on the completed dish with gentle steam, ` +
      `cinematic food editorial style, 9:16 vertical, no text`,
  },
  {
    style: "pour",
    label: "Pour Shot",
    icon: "💧",
    desc: "ราดซอส/น้ำซุปลงจาน — viral มากบน Reels",
    build: (dish, desc) =>
      `Ultra-slow-motion pour shot: rich glossy sauce cascading over ${dish}` +
      `${desc ? `, ${desc}` : ""}, ` +
      `amber liquid streaming in slow motion with droplets catching backlight, ` +
      `sauce spreading and pooling, steam rising as hot liquid hits food, ` +
      `macro close-up with extreme shallow depth of field, ` +
      `warm golden rim light, dark premium background, ` +
      `droplets hanging in the air, hyper-realistic liquid physics, ` +
      `240fps slow motion, 9:16 vertical, no text overlay`,
  },
]

// ─── Category-aware enhancements ─────────────────────────────
const CATEGORY_BOOST: Record<string, string> = {
  "ซูชิ":        "nigiri with glistening fish surface, seasoned shari rice, wasabi and pickled ginger",
  "ซาชิมิ":      "sliced sashimi with vibrant fresh color, shiso leaf, grated wasabi, premium seafood",
  "ราเมน":       "steaming tonkotsu broth, springy noodles, chashu pork, jammy marinated egg, nori",
  "เทปันยากิ":   "sizzling on iron griddle, chef performance, dramatic flames, premium wagyu or seafood",
  "ของหวาน":     "delicate Japanese dessert, mochi or matcha, elegant plating, soft pastel tones",
  "เครื่องดื่ม": "Japanese drink with ice, condensation droplets, vibrant color, garnish detail",
  "ชุดอาหาร":    "Japanese set meal, multiple dishes arranged elegantly, premium presentation",
}

// ─── MAIN: Build professional prompt ─────────────────────────
export function buildProfessionalPrompt(params: {
  menuName: string
  menuNameEn?: string
  description?: string
  category?: string
  style?: VideoStyle
}): string {
  const { menuName, menuNameEn, description, category, style = "cinematic" } = params
  const dish = menuNameEn ? `${menuNameEn} (${menuName})` : menuName
  const categoryBoost = category ? CATEGORY_BOOST[category] || "" : ""
  const fullDesc = [description, categoryBoost].filter(Boolean).join(", ")
  const preset = PROMPT_PRESETS.find(p => p.style === style) || PROMPT_PRESETS[0]
  return preset.build(dish, fullDesc || undefined)
}
