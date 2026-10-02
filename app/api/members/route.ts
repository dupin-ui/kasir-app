import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: semua kasir & admin boleh mengakses (dipakai untuk cari member saat transaksi)
// Bisa difilter dengan ?phone=xxxx untuk pencarian cepat di kasir
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Tidak diizinkan" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  const members = await prisma.member.findMany({
    where: phone ? { phone: { contains: phone } } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}

// POST: hanya admin yang boleh menambah member baru
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const { name, phone } = body;

  if (!name || !phone) {
    return NextResponse.json({ message: "Nama dan nomor HP wajib diisi" }, { status: 400 });
  }

  try {
    const member = await prisma.member.create({ data: { name, phone } });
    return NextResponse.json(member, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: "Nomor HP sudah terdaftar sebagai member" }, { status: 400 });
  }
}
