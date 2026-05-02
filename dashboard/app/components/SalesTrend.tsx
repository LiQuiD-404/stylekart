'use client';

import type { SalesPoint } from '../types';

const PLATFORMS = [
  { key: 'myntra',  label: 'Myntra',  color: '#fb923c', textClass: 'text-orange-400' },
  { key: 'shopify', label: 'Shopify', color: '#4ade80', textClass: 'text-green-400'  },
  { key: 'ajio',    label: 'Ajio',    color: '#c084fc', textClass: 'text-purple-400' },
] as const;

type PlatformKey = typeof PLATFORMS[number]['key'];

function rev(d: SalesPoint, k: PlatformKey): number {
  if (k === 'myntra')  return d.myntraRevenue;
  if (k === 'shopify') return d.shopifyRevenue;
  return d.ajioRevenue;
}

function fmt(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtAxis(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(0)}Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(0)}L`;
  return `${n}`;
}

function momChip(curr: number, prev: number) {
  if (!prev) return null;
  const pct = ((curr - prev) / prev) * 100;
  const pos = pct >= 0;
  return (
    <span className={`text-xs font-medium ${pos ? 'text-green-400' : 'text-red-400'}`}>
      {pos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

interface Props { data: SalesPoint[] }

export default function SalesTrend({ data }: Props) {
  if (data.length === 0) return null;

  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];

  // SVG line chart
  const PL = 48, PR = 16, PT = 16, PB = 36;
  const VW = 520, VH = 220;
  const cW = VW - PL - PR;
  const cH = VH - PT - PB;

  const maxVal = Math.max(...data.map(d => d.totalRevenue)) * 1.1;
  const yTicks = [0, maxVal / 3, (maxVal / 3) * 2, maxVal];

  const xAt = (i: number) => PL + (i / (data.length - 1)) * cW;
  const yAt = (v: number) => PT + cH - (v / maxVal) * cH;

  const linePath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(v)}`).join(' ');

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 ">

        {/* ── Left: numbers ── */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Sales Trend · {latest.month}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">{fmt(latest.totalRevenue)}</span>
              {momChip(latest.totalRevenue, prev?.totalRevenue)}
              <span className="text-xs text-gray-600">vs {prev?.month}</span>
            </div>
            <p className="text-xs text-gray-700 mt-1">as reported · returns treatment unknown</p>
          </div>

          {/* Platform breakdown */}
          <div className="space-y-2.5">
            {PLATFORMS.map(p => {
              const amount  = rev(latest, p.key);
              const pct     = ((amount / latest.totalRevenue) * 100).toFixed(0);
              const prevAmt = prev ? rev(prev, p.key) : 0;
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${p.textClass}`}>{p.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-200">{fmt(amount)}</span>
                      {momChip(amount, prevAmt)}
                      <span className="text-xs text-gray-600 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: p.color, opacity: 0.7 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Orders + AOV */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Orders</p>
              <p className="text-base font-bold text-gray-200">{latest.totalOrders.toLocaleString('en-IN')}</p>
              <div className="mt-0.5">{momChip(latest.totalOrders, prev?.totalOrders)}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Avg Order Value</p>
              <p className="text-base font-bold text-gray-200">₹{latest.avgOrderValue.toLocaleString('en-IN')}</p>
              <div className="mt-0.5">{momChip(latest.avgOrderValue, prev?.avgOrderValue)}</div>
            </div>
          </div>
        </div>

        {/* ── Right: line chart ── */}
        <div>
          {/* Legend */}
          <div className="flex gap-4 justify-end mb-2">
            {PLATFORMS.map(p => (
              <span key={p.key} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-4 h-px inline-block" style={{ backgroundColor: p.color }} />
                {p.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-4 h-px inline-block bg-white opacity-30" style={{ borderTop: '1px dashed rgba(255,255,255,0.4)' }} />
              Total
            </span>
          </div>

          <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: 300 }} aria-hidden>
            {/* Y grid + labels */}
            {yTicks.map((v, i) => (
              <g key={i}>
                <line x1={PL} x2={VW - PR} y1={yAt(v)} y2={yAt(v)} stroke="#1f2937" strokeWidth={1} />
                <text x={PL - 6} y={yAt(v) + 4} textAnchor="end" fontSize={9} fill="#4b5563">
                  {fmtAxis(Math.round(v))}
                </text>
              </g>
            ))}

            {/* Platform lines */}
            {PLATFORMS.map(p => (
              <g key={p.key}>
                <path
                  d={linePath(data.map(d => rev(d, p.key)))}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {data.map((d, i) => (
                  <circle key={i} cx={xAt(i)} cy={yAt(rev(d, p.key))} r={3} fill={p.color} />
                ))}
              </g>
            ))}

            {/* Total line */}
            <path
              d={linePath(data.map(d => d.totalRevenue))}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              strokeLinejoin="round"
            />
            {data.map((d, i) => (
              <circle key={i} cx={xAt(i)} cy={yAt(d.totalRevenue)} r={2.5} fill="rgba(255,255,255,0.5)" />
            ))}

            {/* X-axis month labels */}
            {data.map((d, i) => (
              <text
                key={i}
                x={xAt(i)}
                y={VH - 6}
                textAnchor="middle"
                fontSize={10}
                fill={i === data.length - 1 ? '#e5e7eb' : '#6b7280'}
              >
                {d.month.replace(' 20', " '")}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
