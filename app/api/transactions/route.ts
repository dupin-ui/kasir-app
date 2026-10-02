import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Tidak diizinkan" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { items: { include: { product: true } }, cashier: true, member: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(transactions);
}

const ONLINE_TYPES = ["qris", "gopay", "shopeepay", "dana"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Tidak diizinkan" }, { status: 401 });

  const body = await req.json();
  const { items, paidAmount, memberId, paymentMethod, paymentRef, paymentType: paymentTypeIn } = body as {
    items: { productId: number; qty: number }[];
    paidAmount?: number;
    memberId?: number | null;
    paymentMethod?: "TUNAI" | "ONLINE";
    paymentRef?: string;
    paymentType?: string;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ message: "Keranjang kosong" }, { status: 400 });
  }
  if (items.some((i) => !Number.isInteger(i.qty) || i.qty < 1)) {
    return NextResponse.json({ message: "Jumlah barang tidak valid" }, { status: 400 });
  }

  // Pembayaran online masih SIMULASI (belum terhubung ke payment gateway sungguhan)
  const isOnline = paymentMethod === "ONLINE";
  const ref = isOnline ? String(paymentRef ?? "") : null;
  const paymentType = isOnline ? String(paymentTypeIn ?? "") : null;

  if (isOnline) {
    if (!ref || !ref.startsWith("SIM-")) {
      return NextResponse.json({ message: "Kode pembayaran tidak valid" }, { status: 400 });
    }
    if (!ONLINE_TYPES.includes(paymentType!)) {
      return NextResponse.json({ message: "Jenis pembayaran online tidak valid" }, { status: 400 });
    }
  } else if (typeof paidAmount !== "number" || !Number.isFinite(paidAmount)) {
    return NextResponse.json({ message: "Jumlah uang dibayar tidak valid" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let subtotalAmount = 0;
      const itemData: { productId: number; qty: number; price: number; subtotal: number }[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Produk tidak ditemukan (ID ${item.productId})`);
        if (product.stock < item.qty) throw new Error(`Stok ${product.name} tidak cukup`);

        const subtotal = product.price * item.qty;
        subtotalAmount += subtotal;
        itemData.push({ productId: product.id, qty: item.qty, price: product.price, subtotal });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      let discountPercent = 0;
      if (memberId) {
        const member = await tx.member.findUnique({ where: { id: Number(memberId) } });
        if (member) {
          const setting = await tx.setting.findUnique({ where: { id: 1 } });
          discountPercent = setting?.memberDiscountPercent ?? 0;
        }
      }
      const discountAmount = Math.round((subtotalAmount * discountPercent) / 100);
      const totalAmount = subtotalAmount - discountAmount;

      let finalPaid = paidAmount ?? 0;
      if (isOnline) {
        const used = await tx.transaction.findUnique({ where: { paymentRef: ref! } });
        if (used) throw new Error("Pembayaran ini sudah dipakai untuk transaksi lain");
        finalPaid = totalAmount;
      } else if (finalPaid < totalAmount) {
        throw new Error("Uang bayar kurang dari total belanja");
      }

      const transaction = await tx.transaction.create({
        data: {
          invoiceNo: generateInvoiceNo(),
          cashierId: Number(session.user.id),
          memberId: memberId ? Number(memberId) : null,
          subtotalAmount,
          discountPercent,
          discountAmount,
          totalAmount,
          paidAmount: finalPaid,
          changeAmount: finalPaid - totalAmount,
          paymentMethod: isOnline ? "ONLINE" : "TUNAI",
          paymentRef: ref,
          paymentType,
          items: { create: itemData },
        },
        include: { items: { include: { product: true } }, cashier: true, member: true },
      });

      return transaction;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Transaksi gagal" }, { status: 400 });
  }
}
