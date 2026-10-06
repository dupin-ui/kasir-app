import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ message: "File tidak ditemukan" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ message: "Format harus JPG, PNG, atau WEBP" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Ukuran gambar maksimal 2MB" }, { status: 400 });
  }

  // Simpan gambar di database, lalu kembalikan alamat untuk menampilkannya
  const image = await prisma.image.create({
    data: { mimeType: file.type, data: Buffer.from(await file.arrayBuffer()) },
  });

  return NextResponse.json({ url: `/api/images/${image.id}` });
}
