// Helper Midtrans (Snap + cek status). Tanpa SDK, cukup fetch.
// Key berawalan "SB-" otomatis memakai server Sandbox, selain itu Production.

function serverKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum diisi di file .env");
  return key;
}

function isSandbox(): boolean {
  return serverKey().startsWith("SB-");
}

function authHeader(): string {
  return "Basic " + Buffer.from(serverKey() + ":").toString("base64");
}

export type MidtransStatus = {
  status_code?: string;
  status_message?: string;
  transaction_status?: string;
  fraud_status?: string;
  gross_amount?: string;
  payment_type?: string;
  order_id?: string;
};

// Membuat token Snap untuk membuka popup pembayaran di browser kasir
export async function createSnapToken(orderId: string, grossAmount: number): Promise<string> {
  const url = isSandbox()
    ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
    : "https://app.midtrans.com/snap/v1/transactions";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
      expiry: { unit: "minutes", duration: 15 },
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    const msg = Array.isArray(data.error_messages) ? data.error_messages.join(", ") : "";
    throw new Error(msg || "Gagal membuat pembayaran di Midtrans");
  }
  return data.token as string;
}

// Cek status pembayaran langsung ke Midtrans (server ke server), tidak percaya data dari browser
export async function getPaymentStatus(orderId: string): Promise<MidtransStatus> {
  const base = isSandbox() ? "https://api.sandbox.midtrans.com" : "https://api.midtrans.com";
  const res = await fetch(`${base}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: authHeader() },
    cache: "no-store",
  });
  const data: MidtransStatus = await res.json().catch(() => ({}));
  if (data.status_code === "404" || res.status === 404) {
    throw new Error("Pembayaran tidak ditemukan di Midtrans");
  }
  return data;
}

export function isPaid(status: MidtransStatus): boolean {
  return (
    status.transaction_status === "settlement" ||
    (status.transaction_status === "capture" && status.fraud_status === "accept")
  );
}
