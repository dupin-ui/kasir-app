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
  const { name, phone } = body;

  try {
    const member = await prisma.member.update({
      where: { id: Number(params.id) },
      data: { name, phone },
    });
    return NextResponse.json(member);
  } catch (e) {
    return NextResponse.json({ message: "Gagal memperbarui member. Nomor HP mungkin sudah dipakai." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    await prisma.member.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ message: "Member dihapus" });
  } catch (e) {
    return NextResponse.json({ message: "Gagal menghapus. Member mungkin sudah pernah bertransaksi." }, { status: 400 });
  }
}
