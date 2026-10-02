"use client";

import { signOut } from "next-auth/react";
import { ShoppingBasket, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function KasirNavbar({ name, role }: { name: string; role: string }) {
  return (
    <header className="bg-brand-red text-white px-5 py-3 flex items-center justify-between shadow-md sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <ShoppingBasket size={22} />
        <span className="font-bold">KasirMart</span>
        <span className="text-white/70 text-sm hidden sm:inline">— Kasir: {name}</span>
      </div>
      <div className="flex items-center gap-2">
        {role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition px-3 py-1.5 rounded-lg text-sm"
          >
            <LayoutDashboard size={15} /> Panel Admin
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition px-3 py-1.5 rounded-lg text-sm"
        >
          <LogOut size={15} /> Keluar
        </button>
      </div>
    </header>
  );
}
