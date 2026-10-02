"use client";

import { useMemo } from "react";

// QR palsu untuk simulasi (bukan QR sungguhan, tidak bisa discan).
// Polanya dibuat dari "seed" supaya setiap kode pembayaran punya tampilan berbeda.
export default function FakeQr({ seed, size = 176 }: { seed: string; size?: number }) {
  const N = 25;

  const cells = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let a = h >>> 0;
    const rand = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);

    const out: { x: number; y: number }[] = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (inFinder(x, y)) continue;
        if (rand() > 0.5) out.push({ x, y });
      }
    }
    return out;
  }, [seed]);

  const finder = (ox: number, oy: number) => (
    <g key={`${ox}-${oy}`}>
      <rect x={ox} y={oy} width={7} height={7} fill="#111" />
      <rect x={ox + 1} y={oy + 1} width={5} height={5} fill="#fff" />
      <rect x={ox + 2} y={oy + 2} width={3} height={3} fill="#111" />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${N + 2} ${N + 2}`} shapeRendering="crispEdges" className="bg-white rounded-lg">
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1} height={1} fill="#111" />
      ))}
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
    </svg>
  );
}
