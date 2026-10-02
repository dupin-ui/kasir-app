"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";
import SalesChart from "@/components/SalesChart";
import { Wallet, Receipt, Package, AlertTriangle } from "lucide-react";

type Summary = {
  todayRevenue: number;
  todayTransactionCount: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: { id: number; name: string; stock: number; minStock: number }[];
  chartData: { date: string; total: number }[];
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/reports/summary")
      .then((r) => r.json())
      .then(setSummary);
  }, []);

  const cards = summary
    ? [
        { label: "Pendapatan Hari Ini", value: formatRupiah(summary.todayRevenue), icon: Wallet, color: "bg-green-500" },
        { label: "Transaksi Hari Ini", value: summary.todayTransactionCount, icon: Receipt, color: "bg-brand-blue" },
        { label: "Total Produk", value: summary.totalProducts, icon: Package, color: "bg-brand-yellow" },
        { label: "Stok Menipis", value: summary.lowStockCount, icon: AlertTriangle, color: "bg-brand-red" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Ringkasan performa toko kamu hari ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className={`${c.color} text-white rounded-lg p-3`}>
              <c.icon size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-xl font-bold text-gray-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Penjualan 7 Hari Terakhir</h2>
        {summary ? <SalesChart data={summary.chartData} /> : <p className="text-sm text-gray-400">Memuat...</p>}
      </div>

      {summary && summary.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-brand-red" /> Stok Menipis
          </h2>
          <ul className="divide-y divide-gray-100">
            {summary.lowStockProducts.map((p) => (
              <li key={p.id} className="py-2 flex justify-between text-sm">
                <span className="text-gray-700">{p.name}</span>
                <span className="text-brand-red font-medium">Sisa {p.stock}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
