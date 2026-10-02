"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingBasket, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Username atau password salah.");
      return;
    }

    // Ambil session untuk cek role lalu redirect
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/kasir");
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-red p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-brand-red px-6 py-8 text-center text-white">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <ShoppingBasket size={30} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">KasirMart</h1>
          <p className="text-white/80 text-sm mt-1">Sistem Kasir Minimarket</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Username</label>
            <div className="mt-1 relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-brand-redDark transition text-white font-semibold py-2.5 rounded-lg disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
