"use client";

import { useEffect, useState } from "react";
import MemberFormModal from "@/components/MemberFormModal";
import { Plus, Pencil, Trash2, Search, Users, Percent } from "lucide-react";

type Member = { id: number; name: string; phone: string };

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  // Pengaturan diskon global untuk semua member
  const [discountInput, setDiscountInput] = useState("0");
  const [savedDiscount, setSavedDiscount] = useState(0);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountSaved, setDiscountSaved] = useState(false);

  async function load() {
    const res = await fetch("/api/members");
    setMembers(await res.json());
  }

  async function loadSetting() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSavedDiscount(data.memberDiscountPercent);
    setDiscountInput(String(data.memberDiscountPercent));
  }

  useEffect(() => {
    load();
    loadSetting();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Yakin ingin menghapus member ini?")) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.message);
    }
  }

  async function handleSaveDiscount() {
    setSavingDiscount(true);
    setDiscountSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberDiscountPercent: Number(discountInput) }),
    });
    setSavingDiscount(false);
    if (res.ok) {
      const data = await res.json();
      setSavedDiscount(data.memberDiscountPercent);
      setDiscountSaved(true);
      setTimeout(() => setDiscountSaved(false), 2000);
    } else {
      const data = await res.json();
      alert(data.message);
    }
  }

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={22} className="text-brand-red" /> Member Pelanggan
          </h1>
          <p className="text-gray-500 text-sm">Kelola data member dan diskon yang berlaku untuk semua member.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-redDark"
        >
          <Plus size={16} /> Tambah Member
        </button>
      </div>

      {/* Pengaturan diskon global */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Percent size={18} className="text-brand-red" />
          <h2 className="font-semibold text-gray-800">Diskon untuk Semua Member</h2>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Persentase ini otomatis diterapkan ke setiap transaksi kasir saat pelanggan terdaftar sebagai member —
          tidak perlu diatur satu per satu.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-32">
            <input
              type="number"
              min={0}
              max={100}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
          <button
            onClick={handleSaveDiscount}
            disabled={savingDiscount}
            className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {savingDiscount ? "Menyimpan..." : "Simpan Diskon"}
          </button>
          {discountSaved && <span className="text-sm text-green-600">Tersimpan!</span>}
          <span className="text-sm text-gray-400 ml-auto">
            Saat ini berlaku: <span className="font-semibold text-gray-700">{savedDiscount}%</span>
          </span>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau nomor HP..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Nomor HP</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.phone}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(m);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Belum ada member.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <MemberFormModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
