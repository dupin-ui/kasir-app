import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const { name, sku, price, stock, minStock, categoryId, imageUrl } = body;

  if (!name || !sku || price == null) {
    return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        price: Number(price),
        stock: Number(stock ?? 0),
        minStock: Number(minStock ?? 5),
        categoryId: categoryId ? Number(categoryId) : null,
        imageUrl: imageUrl || null,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: "SKU sudah digunakan" }, { status: 400 });
  }
}
