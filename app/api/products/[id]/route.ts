import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const { name, sku, price, stock, minStock, categoryId, imageUrl } = body;

  try {
    const product = await prisma.product.update({
      where: { id: Number(params.id) },
      data: {
        name,
        sku,
        price: Number(price),
        stock: Number(stock),
        minStock: Number(minStock),
        categoryId: categoryId ? Number(categoryId) : null,
        imageUrl: imageUrl || null,
      },
    });
    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json({ message: "Gagal memperbarui produk" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    await prisma.product.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ message: "Produk dihapus" });
  } catch (e) {
    return NextResponse.json({ message: "Gagal menghapus. Produk mungkin sudah pernah bertransaksi." }, { status: 400 });
  }
}
