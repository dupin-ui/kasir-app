"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Category = { id: number; name: string };
type Product = {
  id?: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  minStock: number;
  categoryId: number | null;
  imageUrl?: string | null;
};

export default function ProductFormModal({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Product>(
    initial ?? { name: "", sku: "", price: 0, stock: 0, minStock: 5, categoryId: null, imageUrl: null }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(initial ?? { name: "", sku: "", price: 0, stock: 0, minStock: 5, categoryId: null, imageUrl: null });
  }, [initial]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.message || "Gagal upload gambar");
      return;
    }
    setForm((f) => ({ ...f, imageUrl: data.url }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = initial?.id ? `/api/products/${initial.id}` : "/api/products";
    const method = initial?.id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Gagal menyimpan produk");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-800">{initial?.id ? "Edit Produk" : "Tambah Produk"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-sm text-gray-600">Gambar Produk</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">Belum ada</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFile}
                  className="text-xs"
                />
                <p className="mt-1">{uploading ? "Mengunggah..." : "JPG/PNG/WEBP, maks. 2MB"}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Nama Produk</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">SKU</label>
              <input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Kategori</label>
              <select
                value={form.categoryId ?? ""}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : null })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">- Pilih -</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600">Harga</label>
              <input
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Stok</label>
              <input
                type="number"
                required
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Stok Min.</label>
              <input
                type="number"
                required
                min={0}
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
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
              disabled={saving || uploading}
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
