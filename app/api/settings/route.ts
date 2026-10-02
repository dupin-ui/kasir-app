import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: admin & kasir boleh baca (kasir perlu tahu persen diskon member saat transaksi)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Tidak diizinkan" }, { status: 401 });

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, memberDiscountPercent: 0 },
  });

  return NextResponse.json(setting);
}

// PUT: hanya admin yang boleh mengubah persen diskon member (berlaku untuk semua member)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  const { memberDiscountPercent } = await req.json();
  const discount = Number(memberDiscountPercent);
  if (isNaN(discount) || discount < 0 || discount > 100) {
    return NextResponse.json({ message: "Diskon harus angka 0-100%" }, { status: 400 });
  }

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update: { memberDiscountPercent: discount },
    create: { id: 1, memberDiscountPercent: discount },
  });

  return NextResponse.json(setting);
}
