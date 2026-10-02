"use client";

import { useEffect, useState } from "react";
import { formatRupiah, paymentLabel } from "@/lib/utils";
import { FileDown } from "lucide-react";

type TxItem = { id: number; qty: number; price: number; subtotal: number; product: { name: string } };
type Tx = {
  id: number;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentType: string | null;
  createdAt: string;
  cashier: { name: string };
  member: { name: string } | null;
  items: TxItem[];
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/transactions?${params.toString()}`);
    setTransactions(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalItemsSold = transactions.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0),
    0
  );

  function exportCsv() {
    const rows = [
      ["No Invoice", "Tanggal", "Kasir", "Metode", "Total", "Dibayar", "Kembalian"],
      ...transactions.map((t) => [
        t.invoiceNo,
        new Date(t.createdAt).toLocaleString("id-ID"),
        t.cashier.name,
        paymentLabel(t.paymentMethod, t.paymentType),
        String(t.totalAmount),
        String(t.paidAmount),
        String(t.changeAmount),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-penjualan.csv";
    a.click();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
          <p className="text-gray-500 text-sm">Riwayat transaksi dan ringkasan penjualan.</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <FileDown size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500">Dari Tanggal</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="block mt-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Sampai Tanggal</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="block mt-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={load}
          className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90"
        >
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500">Total Pendapatan</p>
          <p className="text-xl font-bold text-gray-800">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500">Total Item Terjual</p>
          <p className="text-xl font-bold text-gray-800">{totalItemsSold}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">No Invoice</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Kasir</th>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Metode</th>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{t.invoiceNo}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleString("id-ID")}</td>
                <td className="px-4 py-3 text-gray-500">{t.cashier.name}</td>
                <td className="px-4 py-3 text-gray-500">{t.member?.name ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{paymentLabel(t.paymentMethod, t.paymentType)}</td>
                <td className="px-4 py-3 text-gray-500">{t.items.reduce((s, i) => s + i.qty, 0)} pcs</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">{formatRupiah(t.totalAmount)}</td>
              </tr>
            ))}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada transaksi pada rentang ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
