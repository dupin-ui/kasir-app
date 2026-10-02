"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, LineChart, LogOut, ShoppingBasket, ShoppingCart, Users, UserCog } from "lucide-react";

const menu = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk & Stok", icon: Package },
  { href: "/admin/members", label: "Member Pelanggan", icon: Users },
  { href: "/admin/users", label: "Akun Pengguna", icon: UserCog },
  { href: "/admin/reports", label: "Laporan Penjualan", icon: LineChart },
];

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-brand-blue text-white min-h-screen flex flex-col shrink-0">
      <div className="px-5 py-6 flex items-center gap-2 border-b border-white/10">
        <ShoppingBasket size={26} />
        <div>
          <p className="font-bold leading-tight">KasirMart</p>
          <p className="text-xs text-white/60">Panel Admin</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active ? "bg-white text-brand-blue font-semibold" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-white/10">
          <Link
            href="/kasir"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-white/80 hover:bg-white/10"
          >
            <ShoppingCart size={18} />
            Halaman Kasir
          </Link>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-white/60 mb-2">Masuk sebagai {name}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 justify-center bg-white/10 hover:bg-white/20 transition text-sm py-2 rounded-lg"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );
}
