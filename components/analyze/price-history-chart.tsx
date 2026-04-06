import type { PriceHistoryPoint } from "@/lib/realprice/types";
import { formatCurrency } from "@/lib/realprice/utils";

interface PriceHistoryChartProps {
  history: PriceHistoryPoint[];
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const width = 540;
  const height = 220;
  const padding = 18;
  const prices = history.map((point) => point.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const span = Math.max(maxPrice - minPrice, 1);

  const points = history.map((point, index) => {
    const x = padding + (index / Math.max(history.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.price - minPrice) / span) * (height - padding * 2);
    return { ...point, x, y };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${path} L ${points[points.length - 1]?.x ?? width - padding} ${height - padding} L ${points[0]?.x ?? padding} ${height - padding} Z`;

  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-slate-950/55 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Price history</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Last 10 checkpoints</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Range</p>
          <p className="mt-1 text-sm text-slate-300">
            {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full overflow-visible">
        <defs>
          <linearGradient id="priceArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(77,226,168,0.45)" />
            <stop offset="100%" stopColor="rgba(77,226,168,0.01)" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((tick) => {
          const y = padding + tick * (height - padding * 2);
          return (
            <line
              key={tick}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(148,163,184,0.16)"
              strokeDasharray="4 6"
            />
          );
        })}

        <path d={areaPath} fill="url(#priceArea)" />
        <path d={path} fill="none" stroke="#4de2a8" strokeWidth="3" strokeLinecap="round" />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#081118" stroke="#7dd3fc" strokeWidth="2" />
            <text x={point.x} y={height - 2} fill="#64748b" fontSize="11" textAnchor="middle">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
