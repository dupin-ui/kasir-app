"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { formatRupiah } from "@/lib/utils";
import Receipt, { ReceiptData } from "@/components/Receipt";
import FakeQr from "@/components/FakeQr";
import { Search, Plus, Minus, Trash2, ShoppingCart, X, UserCheck, UserX, Banknote, QrCode } from "lucide-react";

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: { id: number; name: string } | null;
};
type CartItem = { product: Product; qty: number };
type Member = { id: number; name: string; phone: string };
type Category = { id: number; name: string };

export default function KasirPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [payMethod, setPayMethod] = useState<"TUNAI" | "ONLINE">("TUNAI");
  const [onlineType, setOnlineType] = useState<"qris" | "gopay" | "shopeepay" | "dana">("qris");
  const [simPayment, setSimPayment] = useState<{ code: string; type: string; expiresAt: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Hitung mundur masa berlaku kode pembayaran simulasi
  useEffect(() => {
    if (!simPayment) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((simPayment.expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [simPayment]);

  // Member & diskon global (diatur admin, berlaku sama untuk semua member)
  const [memberDiscountPercent, setMemberDiscountPercent] = useState(0);
  const [memberPhone, setMemberPhone] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [memberSearching, setMemberSearching] = useState(false);
  const [memberError, setMemberError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => setMemberDiscountPercent(s.memberDiscountPercent ?? 0));
  }, []);

  function reloadProducts() {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }

  const filtered = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())) &&
      (selectedCategory === null || p.category?.id === selectedCategory)
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [cart]
  );
  const discountPercent = member ? memberDiscountPercent : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = subtotal - discountAmount;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      if (product.stock < 1) return prev;
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const newQty = i.qty + delta;
          if (newQty > i.product.stock) return i;
          return { ...i, qty: newQty };
        })
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(productId: number) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  async function handleFindMember() {
    setMemberError("");
    if (!memberPhone.trim()) return;
    setMemberSearching(true);
    const res = await fetch(`/api/members?phone=${encodeURIComponent(memberPhone.trim())}`);
    const data: Member[] = await res.json();
    setMemberSearching(false);

    const exactMatch = data.find((m) => m.phone === memberPhone.trim()) ?? data[0];
    if (!exactMatch) {
      setMemberError("Member tidak ditemukan. Cek kembali nomor HP-nya.");
      setMember(null);
      return;
    }
    setMember(exactMatch);
  }

  function clearMember() {
    setMember(null);
    setMemberPhone("");
    setMemberError("");
  }

  const paid = Number(paidAmount) || 0;
  const change = paid - total;

  function showReceipt(data: any) {
    setReceipt({
      invoiceNo: data.invoiceNo,
      createdAt: data.createdAt,
      cashierName: session?.user?.name ?? "Kasir",
      memberName: data.member?.name ?? null,
      items: data.items.map((it: any) => ({
        productName: it.product.name,
        qty: it.qty,
        price: it.price,
        subtotal: it.subtotal,
      })),
      subtotalAmount: data.subtotalAmount,
      discountPercent: data.discountPercent,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      changeAmount: data.changeAmount,
      paymentMethod: data.paymentMethod,
      paymentType: data.paymentType,
    });

    setCart([]);
    setPaidAmount("");
    setPayMethod("TUNAI");
    setSimPayment(null);
    setCheckoutOpen(false);
    clearMember();
    reloadProducts();
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setSimPayment(null);
    setProcessing(false);
    setError("");
  }

  const cartPayload = () => cart.map((i) => ({ productId: i.product.id, qty: i.qty }));

  // Pembayaran tunai
  async function handleCheckout() {
    setError("");
    if (paid < total) {
      setError("Uang bayar kurang dari total belanja.");
      return;
    }
    setProcessing(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartPayload(),
        paidAmount: paid,
        memberId: member?.id ?? null,
        paymentMethod: "TUNAI",
      }),
    });

    const data = await res.json();
    setProcessing(false);

    if (!res.ok) {
      setError(data.message || "Transaksi gagal");
      return;
    }
    showReceipt(data);
  }

  // ---- Pembayaran online (SIMULASI) ----
  function createSimPayment() {
    setError("");
    const code = `SIM-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setSimPayment({ code, type: onlineType, expiresAt: Date.now() + 5 * 60 * 1000 });
  }

  async function confirmSimPayment() {
    if (!simPayment) return;
    if (secondsLeft <= 0) {
      setError("Kode pembayaran sudah kedaluwarsa. Buat kode baru.");
      return;
    }
    setError("");
    setProcessing(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartPayload(),
        memberId: member?.id ?? null,
        paymentMethod: "ONLINE",
        paymentType: simPayment.type,
        paymentRef: simPayment.code,
      }),
    });
    const data = await res.json();
    setProcessing(false);

    if (!res.ok) {
      setError(data.message || "Transaksi gagal");
      return;
    }
    showReceipt(data);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Daftar produk */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk atau scan SKU..."
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            autoFocus
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
              selectedCategory === null
                ? "bg-brand-red text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
                selectedCategory === c.id
                  ? "bg-brand-red text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock < 1}
              className="bg-white rounded-xl shadow-sm p-3 text-left hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="h-24 rounded-lg bg-gradient-to-br from-brand-blue/10 to-brand-red/10 flex items-center justify-center mb-2 text-2xl overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  "🛒"
                )}
              </div>
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{p.name}</p>
              <p className="text-xs text-gray-400">{p.category?.name ?? "-"}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-bold text-brand-red">{formatRupiah(p.price)}</p>
                <p className="text-[10px] text-gray-400">Stok {p.stock}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-10 text-sm">Produk tidak ditemukan.</p>
          )}
        </div>
      </div>

      {/* Keranjang */}
      <div className="bg-white rounded-xl shadow-sm p-4 h-fit lg:sticky lg:top-20 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart size={18} className="text-brand-red" />
          <h2 className="font-semibold text-gray-800">Keranjang</h2>
        </div>

        {/* Cari member */}
        <div className="mb-3 border border-gray-200 rounded-lg p-2.5">
          {!member ? (
            <>
              <p className="text-xs text-gray-500 mb-1.5">Member? Cari dengan nomor HP</p>
              <div className="flex gap-1.5">
                <input
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindMember()}
                  placeholder="08xxxxxxxxxx"
                  className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <button
                  onClick={handleFindMember}
                  disabled={memberSearching}
                  className="bg-brand-blue text-white px-3 rounded-lg text-sm disabled:opacity-60"
                >
                  {memberSearching ? "..." : "Cari"}
                </button>
              </div>
              {memberError && <p className="text-xs text-red-500 mt-1">{memberError}</p>}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck size={16} className="text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                  <p className="text-xs text-green-600">Diskon member {memberDiscountPercent}%</p>
                </div>
              </div>
              <button onClick={clearMember} className="text-gray-400 hover:text-red-500 shrink-0 p-1">
                <UserX size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 max-h-[40vh] overflow-y-auto pr-1">
          {cart.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Keranjang masih kosong.</p>}
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                <p className="text-xs text-gray-400">{formatRupiah(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeQty(item.product.id, -1)}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm">{item.qty}</span>
                <button
                  onClick={() => changeQty(item.product.id, 1)}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={() => removeItem(item.product.id)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t mt-3 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-700">{formatRupiah(subtotal)}</span>
          </div>
          {member && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Diskon Member ({discountPercent}%)</span>
              <span className="text-green-600">- {formatRupiah(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-1">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="font-bold text-gray-800">{formatRupiah(total)}</span>
          </div>
        </div>

        <button
          onClick={() => setCheckoutOpen(true)}
          disabled={cart.length === 0}
          className="mt-3 w-full bg-brand-red hover:bg-brand-redDark disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg text-sm"
        >
          Bayar
        </button>
      </div>

      {/* Modal checkout */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-800">Pembayaran</h3>
              <button onClick={closeCheckout} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">{formatRupiah(subtotal)}</span>
              </div>
              {member && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Diskon Member ({discountPercent}%)</span>
                  <span className="text-green-600">- {formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Total Belanja</span>
                <span className="font-bold text-gray-800">{formatRupiah(total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setPayMethod("TUNAI"); setSimPayment(null); setError(""); }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition ${
                    payMethod === "TUNAI" ? "bg-brand-blue text-white border-brand-blue" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Banknote size={16} /> Tunai
                </button>
                <button
                  type="button"
                  onClick={() => { setPayMethod("ONLINE"); setError(""); }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition ${
                    payMethod === "ONLINE" ? "bg-brand-blue text-white border-brand-blue" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <QrCode size={16} /> QRIS / E-Wallet
                </button>
              </div>

              {payMethod === "TUNAI" ? (
                <>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Uang Dibayar</label>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(String(total))}
                    className="text-xs font-medium bg-brand-yellow/30 text-brand-redDark px-2.5 py-1 rounded-md hover:bg-brand-yellow/50"
                  >
                    Uang Pas
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                  autoFocus
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kembalian</span>
                <span className={`font-bold ${change < 0 ? "text-red-500" : "text-green-600"}`}>
                  {formatRupiah(Math.max(change, 0))}
                </span>
              </div>
                </>
              ) : (
                <div className="space-y-3">
                  {!simPayment ? (
                    <>
                      <p className="text-xs text-gray-500">Pilih metode pembayaran pelanggan:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ["qris", "QRIS"],
                          ["gopay", "GoPay"],
                          ["shopeepay", "ShopeePay"],
                          ["dana", "DANA"],
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setOnlineType(value)}
                            className={`py-2 rounded-lg text-sm border transition ${
                              onlineType === value
                                ? "border-brand-red bg-red-50 text-brand-redDark font-semibold"
                                : "border-gray-300 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-gray-200 p-4 text-center space-y-2">
                      <p className="text-xs font-semibold text-brand-redDark uppercase tracking-wide">
                        {simPayment.type === "qris" ? "QRIS" : simPayment.type === "gopay" ? "GoPay" : simPayment.type === "shopeepay" ? "ShopeePay" : "DANA"}
                        {" "}&middot; Mode Simulasi
                      </p>
                      <div className="flex justify-center">
                        <div className={secondsLeft <= 0 ? "opacity-30" : ""}>
                          <FakeQr seed={simPayment.code} />
                        </div>
                      </div>
                      <p className="font-bold text-gray-800">{formatRupiah(total)}</p>
                      <p className="text-[11px] text-gray-400 break-all">{simPayment.code}</p>
                      <p className={`text-sm font-medium ${secondsLeft <= 0 ? "text-red-500" : "text-gray-600"}`}>
                        {secondsLeft <= 0
                          ? "Kode kedaluwarsa"
                          : `Berlaku ${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`}
                      </p>
                      <p className="text-[11px] text-gray-400">QR ini hanya simulasi dan tidak bisa discan. Tidak ada uang sungguhan.</p>
                    </div>
                  )}
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {payMethod === "TUNAI" ? (
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full bg-brand-blue hover:opacity-90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm"
                >
                  {processing ? "Memproses..." : "Selesaikan Transaksi"}
                </button>
              ) : !simPayment ? (
                <button
                  onClick={createSimPayment}
                  className="w-full bg-brand-blue hover:opacity-90 text-white font-semibold py-2.5 rounded-lg text-sm"
                >
                  Buat Kode Pembayaran
                </button>
              ) : secondsLeft <= 0 ? (
                <button
                  onClick={createSimPayment}
                  className="w-full bg-brand-blue hover:opacity-90 text-white font-semibold py-2.5 rounded-lg text-sm"
                >
                  Buat Kode Baru
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={confirmSimPayment}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm"
                  >
                    {processing ? "Memproses..." : "Simulasikan: Pelanggan Sudah Bayar"}
                  </button>
                  <button
                    onClick={() => { setSimPayment(null); setError(""); }}
                    disabled={processing}
                    className="w-full text-xs text-gray-500 hover:text-gray-700"
                  >
                    Batalkan pembayaran
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal struk setelah transaksi berhasil */}
      {receipt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-800">Transaksi Berhasil</h3>
              <button onClick={() => setReceipt(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <Receipt data={receipt} />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setReceipt(null)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-brand-blue text-white rounded-lg py-2 text-sm font-medium hover:opacity-90"
                >
                  Cetak Struk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
