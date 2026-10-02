import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [todayTx, totalProducts, recentTx] = await Promise.all([
    prisma.transaction.findMany({ where: { createdAt: { gte: startOfToday } } }),
    prisma.product.count(),
    prisma.transaction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { totalAmount: true, createdAt: true },
    }),
  ]);

  const todayRevenue = todayTx.reduce((sum, t) => sum + t.totalAmount, 0);

  // Susun data grafik 7 hari terakhir
  const chartMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    chartMap[key] = 0;
  }
  for (const t of recentTx) {
    const key = t.createdAt.toISOString().slice(0, 10);
    if (chartMap[key] !== undefined) chartMap[key] += t.totalAmount;
  }
  const chartData = Object.entries(chartMap).map(([date, total]) => ({ date, total }));

  const allProducts = await prisma.product.findMany();
  const lowStockList = allProducts.filter((p) => p.stock <= p.minStock);

  return NextResponse.json({
    todayRevenue,
    todayTransactionCount: todayTx.length,
    totalProducts,
    lowStockCount: lowStockList.length,
    lowStockProducts: lowStockList.slice(0, 5),
    chartData,
  });
}
