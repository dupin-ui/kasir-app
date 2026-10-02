import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: hanya admin yang boleh melihat daftar akun (yang ditampilkan hanya akun KASIR)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { role: "KASIR" },
    select: { id: true, name: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

// POST: admin hanya boleh membuat akun KASIR (role dipaksa KASIR di server)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const { name, username, password } = body;

  if (!name || !username || !password) {
    return NextResponse.json({ message: "Nama, username, dan password wajib diisi" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ message: "Password minimal 4 karakter" }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: { name, username, password, role: "KASIR" },
      select: { id: true, name: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: "Username sudah dipakai" }, { status: 400 });
  }
}
