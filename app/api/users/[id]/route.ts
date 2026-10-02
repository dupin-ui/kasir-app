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
  const { name, username, password } = body;

  const target = await prisma.user.findUnique({ where: { id: Number(params.id) } });
  if (!target) {
    return NextResponse.json({ message: "Akun tidak ditemukan" }, { status: 404 });
  }

  // Akun admin tidak boleh diubah lewat panel ini
  if (target.role !== "KASIR") {
    return NextResponse.json({ message: "Akun admin tidak bisa diubah" }, { status: 403 });
  }

  // Role tidak boleh diubah: kasir tidak bisa dijadikan admin. Field "role" dari client diabaikan.
  const data: any = { name, username };
  if (password && password.length > 0) {
    if (password.length < 4) {
      return NextResponse.json({ message: "Password minimal 4 karakter" }, { status: 400 });
    }
    data.password = password;
  }

  try {
    const user = await prisma.user.update({
      where: { id: Number(params.id) },
      data,
      select: { id: true, name: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ message: "Gagal memperbarui akun. Username mungkin sudah dipakai." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  if (Number(params.id) === Number(session.user.id)) {
    return NextResponse.json({ message: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: Number(params.id) } });
  if (!target) {
    return NextResponse.json({ message: "Akun tidak ditemukan" }, { status: 404 });
  }
  if (target.role !== "KASIR") {
    return NextResponse.json({ message: "Akun admin tidak bisa dihapus" }, { status: 403 });
  }

  try {
    await prisma.user.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ message: "Akun dihapus" });
  } catch (e) {
    return NextResponse.json({ message: "Gagal menghapus. Akun mungkin sudah pernah bertransaksi." }, { status: 400 });
  }
}
