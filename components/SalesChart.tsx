"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/utils";

export default function SalesChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          fontSize={12}
          stroke="#9ca3af"
        />
        <YAxis
          tickFormatter={(v) => `${Math.round(v / 1000)}rb`}
          fontSize={12}
          stroke="#9ca3af"
        />
        <Tooltip formatter={(value: number) => formatRupiah(value)} labelFormatter={(l) => `Tanggal ${l}`} />
        <Line type="monotone" dataKey="total" stroke="#D6001C" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
