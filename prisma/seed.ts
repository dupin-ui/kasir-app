import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Password disimpan apa adanya (tanpa hashing) sesuai kebutuhan tugas.
  const adminPassword = "admin123";
  const kasirPassword = "kasir123";

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { password: adminPassword },
    create: { name: "Admin Toko", username: "admin", password: adminPassword, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { username: "kasir" },
    update: { password: kasirPassword },
    create: { name: "Kasir 1", username: "kasir", password: kasirPassword, role: "KASIR" },
  });

  const minuman = await prisma.category.upsert({ where: { name: "Minuman" }, update: {}, create: { name: "Minuman" } });
  const makanan = await prisma.category.upsert({ where: { name: "Makanan Ringan" }, update: {}, create: { name: "Makanan Ringan" } });
  const sembako = await prisma.category.upsert({ where: { name: "Sembako" }, update: {}, create: { name: "Sembako" } });

  const products = [
    { name: "Aqua Botol 600ml", sku: "MNM001", price: 4000, stock: 100, categoryId: minuman.id },
    { name: "Teh Pucuk 350ml", sku: "MNM002", price: 5000, stock: 80, categoryId: minuman.id },
    { name: "Kopi Kapal Api Sachet", sku: "MNM003", price: 1500, stock: 150, categoryId: minuman.id },
    { name: "Chitato 68g", sku: "MKN001", price: 10500, stock: 50, categoryId: makanan.id },
    { name: "Indomie Goreng", sku: "MKN002", price: 3000, stock: 200, categoryId: makanan.id },
    { name: "Oreo Original", sku: "MKN003", price: 8500, stock: 60, categoryId: makanan.id },
    { name: "Beras 5kg", sku: "SMB001", price: 65000, stock: 30, categoryId: sembako.id },
    { name: "Minyak Goreng 1L", sku: "SMB002", price: 18000, stock: 40, categoryId: sembako.id },
    { name: "Gula Pasir 1kg", sku: "SMB003", price: 16000, stock: 45, categoryId: sembako.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p });
  }

  console.log("Seed selesai. Login: admin/admin123 atau kasir/kasir123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
