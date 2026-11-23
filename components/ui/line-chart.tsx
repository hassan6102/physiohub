"use client";

import { useId } from "react";

export type ChartPoint = { label: string; value: number };

/** Dependency-free SVG line chart (time flows left to right). Only draws real data points. */
export function LineChart({
  data,
  min = 0,
  max,
  color = "#1D7180",
  unit = "",
  height = 180,
  title,
}: {
  data: ChartPoint[];
  min?: number;
  max?: number;
  color?: string;
  unit?: string;
  height?: number;
  title: string;
}) {
  const id = useId();
  if (data.length === 0) return null;

  const W = 600;
  const H = height;
  const pad = { l: 36, r: 12, t: 14, b: 28 };
  const top = max ?? Math.max(...data.map((d) => d.value), min + 1);
  const range = top - min || 1;
  const x = (i: number) => pad.l + (data.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (data.length - 1));
  const y = (v: number) => pad.t + (1 - (v - min) / range) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const ticks = [min, min + range / 2, top];
  const step = Math.ceil(data.length / 6);

  return (
    <figure dir="ltr" className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby={id}>
        <title id={id}>{title}</title>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E5EDF0" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#71818B">
              {Math.round(t * 10) / 10}
            </text>
          </g>
        ))}
        {data.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.value)} r="4" fill="#fff" stroke={color} strokeWidth="2.5">
              <title>{`${d.label}: ${d.value}${unit}`}</title>
            </circle>
            {i % step === 0 && (
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#71818B">
                {d.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
}
