import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSnapToken } from "@/lib/midtrans";

// POST: hitung total belanja di server, lalu minta token Snap ke Midtrans
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Tidak diizinkan" }, { status: 401 });

  const { items, memberId } = (await req.json()) as {
    items: { productId: number; qty: number }[];
    memberId?: number | null;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ message: "Keranjang kosong" }, { status: 400 });
  }
  if (items.some((i) => !Number.isInteger(i.qty) || i.qty < 1)) {
    return NextResponse.json({ message: "Jumlah barang tidak valid" }, { status: 400 });
  }

  let subtotal = 0;
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) {
      return NextResponse.json({ message: `Produk tidak ditemukan (ID ${item.productId})` }, { status: 400 });
    }
    if (product.stock < item.qty) {
      return NextResponse.json({ message: `Stok ${product.name} tidak cukup` }, { status: 400 });
    }
    subtotal += product.price * item.qty;
  }

  let discountPercent = 0;
  if (memberId) {
    const member = await prisma.member.findUnique({ where: { id: Number(memberId) } });
    if (member) {
      const setting = await prisma.setting.findUnique({ where: { id: 1 } });
      discountPercent = setting?.memberDiscountPercent ?? 0;
    }
  }
  const total = subtotal - Math.round((subtotal * discountPercent) / 100);
  if (total < 1) {
    return NextResponse.json({ message: "Total belanja tidak valid" }, { status: 400 });
  }

  const orderId = `KM-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  try {
    const token = await createSnapToken(orderId, total);
    return NextResponse.json({ token, orderId, total });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Gagal membuat pembayaran" }, { status: 502 });
  }
}
