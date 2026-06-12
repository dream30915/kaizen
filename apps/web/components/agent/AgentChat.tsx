"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { clsx } from "clsx";

interface Message { role: "user" | "assistant"; content: string; }

const QUICK = [
  { icon: "🍣", text: "เขียน caption ซาชิมิแซลมอนน่ากินหน่อย" },
  { icon: "📅", text: "ควรโพสต์คอนเทนต์อะไรวันศุกร์เย็น?" },
  { icon: "#️⃣", text: "hashtag ที่ดีสำหรับร้านอาหารญี่ปุ่นในไทย" },
  { icon: "🎯", text: "ไอเดียโปรโมชั่นบุฟเฟ่ต์ช่วงวีคเอนด์" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0,1,2].map(i => (
        <span key={i} className="w-2 h-2 bg-sumi-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);
    setStreaming("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) throw new Error("ไม่สามารถเชื่อมต่อได้");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setStreaming(full);
      }

      setMessages(prev => [...prev, { role: "assistant", content: full }]);
      setStreaming("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
      setStreaming("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-washi-50">

      {/* ── Header ── */}
      <div className="bg-sumi-900 px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-beni-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold text-base">Zenkai AI Agent</h1>
            <span className="text-[10px] bg-kin-600/30 text-kin-300 px-2 py-0.5 rounded-full font-medium tracking-wide">GPT-4o</span>
          </div>
          <p className="text-sumi-400 text-xs">ผู้ช่วยการตลาดร้านอาหารญี่ปุ่น</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setStreaming(""); }}
            className="p-2 text-sumi-400 hover:text-white transition-colors"
            title="ล้างแชท"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-seiji-400 rounded-full animate-pulse" />
          <span className="text-seiji-400 text-xs">Online</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center pt-6 pb-4">
            <div className="w-16 h-16 rounded-2xl bg-sumi-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-black text-3xl leading-none">全</span>
            </div>
            <p className="text-sumi-800 font-semibold mb-1">สวัสดีครับ! 🍣</p>
            <p className="text-sumi-400 text-sm mb-6 leading-relaxed">
              ถามเรื่องคอนเทนต์ แคปชั่น<br />โปรโมชั่น หรือกลยุทธ์โซเชียลได้เลย
            </p>
            <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
              {QUICK.map(q => (
                <button
                  key={q.text}
                  onClick={() => send(q.text)}
                  className="flex items-center gap-2.5 text-left text-sm px-4 py-3 bg-white border border-washi-200 rounded-xl hover:border-beni-300 hover:bg-beni-50 transition-all group shadow-sm"
                >
                  <span className="text-base">{q.icon}</span>
                  <span className="text-sumi-700 group-hover:text-beni-700">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={clsx("flex gap-2.5", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
              m.role === "user" ? "bg-beni-600" : "bg-sumi-900"
            )}>
              {m.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={clsx(
              "max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
              m.role === "user"
                ? "bg-beni-600 text-white rounded-tr-sm"
                : "bg-white border border-washi-200 text-sumi-800 rounded-tl-sm"
            )}>
              {m.content}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {streaming && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sumi-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="max-w-[82%] px-4 py-3 bg-white border border-washi-200 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-sumi-800 shadow-sm whitespace-pre-wrap">
              {streaming}
              <span className="inline-block w-0.5 h-4 bg-beni-400 ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {/* Loading dots (before first stream chunk) */}
        {loading && !streaming && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sumi-900 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-washi-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 pb-safe pt-2 bg-white border-t border-washi-200 flex-shrink-0 pb-20 md:pb-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="ถามเรื่องคอนเทนต์ แคปชั่น โปรโมชั่น..."
            rows={1}
            className="flex-1 bg-washi-50 border border-washi-200 rounded-xl px-4 py-3 text-sm text-sumi-800 placeholder-sumi-400 focus:outline-none focus:border-beni-400 transition-colors resize-none"
            style={{ minHeight: 44, maxHeight: 120 }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-beni-600 hover:bg-beni-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
