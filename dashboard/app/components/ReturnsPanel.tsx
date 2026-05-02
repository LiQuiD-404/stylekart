'use client';

import { useState, useMemo } from 'react';
import type { ReturnItem, RiskLevel } from '../types';

const bandConfig: Record<RiskLevel, { text: string; bg: string; rateBadge: string }> = {
  red:   { text: 'text-red-400',   bg: 'bg-red-950/30',   rateBadge: 'text-red-400' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-950/20', rateBadge: 'text-amber-400' },
  green: { text: 'text-green-400', bg: '',                rateBadge: 'text-green-400' },
};

function ConditionBar({ item }: { item: ReturnItem }) {
  const sellW    = item.sellablePct;
  const nonSellW = item.nonSellablePct;
  const unknownW = Math.max(0, 100 - sellW - nonSellW);

  return (
    <div className="space-y-1.5">
      {/* Split bar: emerald = sellable, red = non-sellable, gray = unknown */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-800 gap-px">
        {sellW > 0 && (
          <div className="bg-emerald-500 transition-all" style={{ width: `${sellW}%` }} />
        )}
        {nonSellW > 0 && (
          <div className="bg-red-600 transition-all" style={{ width: `${nonSellW}%` }} />
        )}
        {unknownW > 0 && (
          <div className="bg-gray-600 transition-all flex-1" />
        )}
      </div>

      {/* Labels under the bar */}
      <div className="flex items-center gap-3 text-xs">
        {item.sellableCount > 0 && (
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
            {item.sellablePct}% sellable ({item.sellableCount})
          </span>
        )}
        {item.nonSellableCount > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-sm bg-red-600 inline-block" />
            {item.nonSellablePct}% non-sellable ({item.nonSellableCount})
          </span>
        )}
        {item.unknownCount > 0 && (
          <span className="text-gray-600">{item.unknownCount} unclassified</span>
        )}
      </div>
    </div>
  );
}

interface Props {
  data: ReturnItem[];
}

const PAGE_SIZE = 10;

export default function ReturnsPanel({ data }: Props) {
  const [bandFilter, setBandFilter] = useState<RiskLevel | 'all'>('all');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(0);

  const filtered = useMemo(() => {
    let rows = bandFilter === 'all' ? data : data.filter(r => r.band === bandFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.topReason.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, bandFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filterBtn = (val: RiskLevel | 'all', label: string, cls: string) => (
    <button
      key={val}
      onClick={() => { setBandFilter(val); setPage(0); }}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
        bandFilter === val ? cls : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">Returns Insights — Feb 2026</h2>
        <input
          type="text"
          placeholder="Search product, SKU or reason…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5 w-56 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
        />
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            Sellable
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" />
            Non-sellable
          </span>
        </div>
        <div className="flex gap-2 ml-auto">
          {filterBtn('all', 'All', 'bg-gray-600 text-white')}
          {filterBtn('red', '🔴 >30%', 'bg-red-900 text-red-200')}
          {filterBtn('amber', '🟡 15–30%', 'bg-amber-900 text-amber-200')}
          {filterBtn('green', '🟢 <15%', 'bg-green-900 text-green-200')}
          <span className="text-xs text-gray-500 pl-1">{filtered.length} results</span>
        </div>
      </div>

      <div className="divide-y divide-gray-800/50">
        {visible.map(item => {
          const { bg, rateBadge } = bandConfig[item.band];
          const platformStr = Object.entries(item.platforms)
            .map(([p, c]) => `${p} ×${c}`).join(' · ');

          return (
            <div key={item.sku} className={`px-4 py-3 hover:bg-gray-800/30 transition-colors ${bg}`}>
              <div className="flex items-start gap-4">
                {/* Return rate pill */}
                <div className="shrink-0 text-right w-14 pt-0.5">
                  <span className={`text-lg font-bold ${rateBadge}`}>{item.returnRate}%</span>
                  <p className="text-xs text-gray-600 mt-0.5">return rate</p>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + SKU */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-200 font-medium truncate">{item.name}</span>
                    <span className="text-xs font-mono text-gray-600 shrink-0">
                      {item.sku.startsWith('NSKU_') ? '–' : item.sku}
                    </span>
                  </div>

                  {/* Condition split bar */}
                  <ConditionBar item={item} />

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span>{item.returnCount} returns total</span>
                    {item.refundTotal > 0 && (
                      <span>₹{item.refundTotal.toLocaleString('en-IN')} refunded</span>
                    )}
                    {platformStr && <span>{platformStr}</span>}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Top reason: <span className="text-gray-400">{item.topReason}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No results</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <span className="text-xs text-gray-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 disabled:opacity-30 hover:bg-gray-700"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pg = totalPages <= 7 ? i : (page <= 3 ? i : page >= totalPages - 4 ? totalPages - 7 + i : page - 3 + i);
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 text-xs rounded ${pg === page ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {pg + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 disabled:opacity-30 hover:bg-gray-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
