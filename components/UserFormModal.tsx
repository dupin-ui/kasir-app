"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type UserData = { id?: number; name: string; username: string; password: string; role: "ADMIN" | "KASIR" };

export default function UserFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: (Omit<UserData, "password"> & { password?: string }) | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UserData>(
    initial ? { ...initial, password: "" } : { name: "", username: "", password: "", role: "KASIR" }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ? { ...initial, password: "" } : { name: "", username: "", password: "", role: "KASIR" });
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = initial?.id ? `/api/users/${initial.id}` : "/api/users";
    const method = initial?.id ? "PUT" : "POST";

    if (!initial?.id && form.password.length < 4) {
      setSaving(false);
      setError("Password minimal 4 karakter");
      return;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Gagal menyimpan akun");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-800">{initial?.id ? "Edit Akun" : "Tambah Akun"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-sm text-gray-600">Nama Lengkap</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Password {initial?.id && <span className="text-gray-400">(kosongkan jika tidak diubah)</span>}
            </label>
            <input
              type="text"
              required={!initial?.id}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={initial?.id ? "••••••••" : ""}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Role</label>
            <input
              disabled
              value={form.role === "ADMIN" ? "Admin" : "Kasir"}
              className="w-full mt-1 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand-blue text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
