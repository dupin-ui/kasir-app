"use client";

import { formatRupiah, paymentLabel } from "@/lib/utils";

type Item = { productName: string; qty: number; price: number; subtotal: number };
export type ReceiptData = {
  invoiceNo: string;
  createdAt: string;
  cashierName: string;
  memberName?: string | null;
  items: Item[];
  subtotalAmount: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod?: string | null;
  paymentType?: string | null;
};

export default function Receipt({ data }: { data: ReceiptData }) {
  return (
    <div id="receipt-print" className="font-mono text-xs w-72 mx-auto text-gray-800">
      <div className="text-center mb-2">
        <p className="font-bold text-sm">KASIRMART</p>
        <p>Jl. Contoh Raya No. 1, Kota</p>
        <p>=========================</p>
      </div>
      <p>No: {data.invoiceNo}</p>
      <p>Tgl: {new Date(data.createdAt).toLocaleString("id-ID")}</p>
      <p>Kasir: {data.cashierName}</p>
      <p>Metode: {paymentLabel(data.paymentMethod, data.paymentType)}</p>
      {data.memberName && <p>Member: {data.memberName}</p>}
      <p>-------------------------</p>
      {data.items.map((item, idx) => (
        <div key={idx} className="mb-1">
          <p>{item.productName}</p>
          <div className="flex justify-between">
            <span>
              {item.qty} x {formatRupiah(item.price)}
            </span>
            <span>{formatRupiah(item.subtotal)}</span>
          </div>
        </div>
      ))}
      <p>-------------------------</p>
      <div className="flex justify-between">
        <span>SUBTOTAL</span>
        <span>{formatRupiah(data.subtotalAmount)}</span>
      </div>
      {data.discountAmount > 0 && (
        <div className="flex justify-between">
          <span>DISKON ({data.discountPercent}%)</span>
          <span>- {formatRupiah(data.discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>{formatRupiah(data.totalAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span>BAYAR</span>
        <span>{formatRupiah(data.paidAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span>KEMBALI</span>
        <span>{formatRupiah(data.changeAmount)}</span>
      </div>
      <p className="text-center mt-2">=========================</p>
      <p className="text-center">Terima kasih telah berbelanja!</p>
    </div>
  );
}
