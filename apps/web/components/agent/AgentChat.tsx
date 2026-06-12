"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK = [
  "ช่วยเขียน caption สำหรับซาชิมิแซลมอนหน่อย",
  "เมนูไหนควรโพสต์วันศุกร์?",
  "hashtag ที่ดีสำหรับร้านอาหารญี่ปุ่นมีอะไรบ้าง",
  "ช่วยคิดโปรโมชั่นช่วงเย็นหน่อย",
];

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `คุณคือ Zenkai AI — ผู้ช่วยการตลาดของร้านอาหารญี่ปุ่นชื่อ Zenkai
ความเชี่ยวชาญ: เขียน Caption ภาษาไทย, ไอเดียคอนเทนต์ TikTok/Reels, hashtag, โปรโมชั่น, กลยุทธ์โซเชียลมีเดีย
สไตล์: ตอบเป็นภาษาไทย กระชับ ใช้ emoji เล็กน้อย มีตัวเลขและตัวอย่างจริงเสมอ
ห้ามพูดว่า "ดิฉัน" หรือ "ผม" — ใช้ "Zenkai" แทน`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || "ขอโทษ ไม่สามารถตอบได้ตอนนี้";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ เชื่อมต่อไม่ได้ กรุณาลองใหม่" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-0px)] bg-washi-50">

      {/* Header */}
      <div className="bg-sumi-900 px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-beni-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base">Zenkai AI Agent</h1>
          <p className="text-sumi-400 text-xs">ผู้ช่วยการตลาดร้านอาหารญี่ปุ่น</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-seiji-400 rounded-full animate-pulse" />
          <span className="text-seiji-400 text-xs">พร้อมใช้งาน</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-sumi-900 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-black text-2xl">全</span>
            </div>
            <p className="text-sumi-700 font-semibold mb-1">สวัสดีครับ!</p>
            <p className="text-sumi-400 text-sm mb-6">ถามเรื่องคอนเทนต์ แคปชั่น หรือกลยุทธ์ได้เลย</p>
            <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
              {QUICK.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-sm px-4 py-2.5 bg-white border border-washi-200 rounded-xl hover:border-beni-300 hover:bg-beni-50 transition-colors text-sumi-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={clsx("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
              m.role === "user" ? "bg-beni-600" : "bg-sumi-900"
            )}>
              {m.role === "user"
                ? <User className="w-4 h-4 text-white" />
                : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={clsx(
              "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
              m.role === "user"
                ? "bg-beni-600 text-white rounded-tr-sm"
                : "bg-white border border-washi-200 text-sumi-800 rounded-tl-sm shadow-sm"
            )}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-sumi-900 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-washi-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <Loader2 className="w-4 h-4 text-sumi-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-washi-200 flex-shrink-0 mb-16 md:mb-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="ถามเรื่องคอนเทนต์ แคปชั่น โปรโมชั่น..."
            className="flex-1 bg-washi-50 border border-washi-200 rounded-xl px-4 py-3 text-sm text-sumi-800 placeholder-sumi-400 focus:outline-none focus:border-beni-400 transition-colors"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-beni-600 hover:bg-beni-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
