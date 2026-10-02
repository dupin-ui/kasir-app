export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function generateInvoiceNo(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INV-${stamp}-${rand}`;
}

export function paymentLabel(method?: string | null, type?: string | null): string {
  if (method !== "ONLINE") return "Tunai";
  const names: Record<string, string> = {
    qris: "QRIS",
    gopay: "GoPay",
    shopeepay: "ShopeePay",
    dana: "DANA",
    bank_transfer: "Transfer Bank",
    echannel: "Mandiri Bill",
    credit_card: "Kartu Kredit",
    cstore: "Minimarket",
  };
  return type ? `Online (${names[type] ?? type})` : "Online";
}
