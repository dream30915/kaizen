"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setError("รหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sumi-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-beni-600 shadow-lg mb-4">
            <span className="text-white font-black text-3xl leading-none">全</span>
          </div>
          <h1 className="text-white font-bold text-2xl tracking-wide">Zenkai</h1>
          <p className="text-sumi-400 text-sm mt-1 tracking-widest uppercase">Menu · AI · Video</p>
        </div>

        {/* Card */}
        <div className="bg-sumi-800 rounded-2xl border border-sumi-700 p-6 shadow-2xl">
          <h2 className="text-white font-semibold mb-5 text-center">เข้าสู่ระบบ</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sumi-400 text-xs mb-1.5 tracking-wide">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-sumi-700 border border-sumi-600 rounded-xl px-4 py-3 text-white placeholder-sumi-500 focus:outline-none focus:border-beni-500 transition-colors"
                autoFocus
                required
              />
            </div>
            {error && (
              <p className="text-beni-400 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-beni-600 hover:bg-beni-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        <p className="text-sumi-500 text-xs text-center mt-4">
          🔒 เชื่อมต่อปลอดภัยด้วย HTTPS
        </p>
      </div>
    </div>
  );
}
