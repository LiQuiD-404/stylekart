'use client';

import { useState, useMemo } from 'react';
import type { InventoryItem, RiskLevel } from '../types';
import RiskBadge from './RiskBadge';

type SortKey = 'sku' | 'name' | 'warehouse' | 'shopify' | 'myntra' | 'ajio' | 'delta' | 'risk' | 'mappingStatus';
type SortDir = 'asc' | 'desc';

const riskOrder: Record<RiskLevel, number> = { red: 0, amber: 1, green: 2 };
const BUFFER = 0.10;

const nullCell = <span className="text-gray-600">—</span>;

function StockCell({ value, refWH }: { value: number | null; refWH: number | null }) {
  if (value === null) return nullCell;
  if (refWH === null) return <span className="text-gray-300">{value}</span>;
  const diff = value - refWH;
  const color = diff > 2 ? 'text-red-400' : diff < -2 ? 'text-gray-500' : 'text-gray-300';
  return (
    <span className={color}>
      {value}
      {diff > 2  && <span className="ml-1 text-xs opacity-70">+{diff}</span>}
      {diff < -2 && <span className="ml-1 text-xs opacity-50">{diff}</span>}
    </span>
  );
}

type MappingStatus = 'Mapped' | 'Partial' | 'Unmapped' | 'Unknown';

const mappingConfig: Record<MappingStatus, { label: string; className: string }> = {
  Mapped:   { label: 'Mapped',   className: 'bg-gray-800 text-gray-400 border border-gray-700' },
  Partial:  { label: 'Partial',  className: 'bg-amber-950 text-amber-500 border border-amber-900' },
  Unmapped: { label: 'Unmapped', className: 'bg-red-950 text-red-500 border border-red-900' },
  Unknown:  { label: '?',        className: 'bg-gray-800 text-gray-600 border border-gray-700' },
};

function MappingBadge({ status }: { status: MappingStatus }) {
  const { label, className } = mappingConfig[status] ?? mappingConfig.Unknown;
  return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
}

interface Props { data: InventoryItem[] }

export default function InventoryTable({ data }: Props) {
  const [search, setSearch]                   = useState('');
  const [riskFilter, setRiskFilter]           = useState<RiskLevel | 'all'>('all');
  const [sortKey, setSortKey]                 = useState<SortKey>('risk');
  const [sortDir, setSortDir]                 = useState<SortDir>('asc');
  const [page, setPage]                       = useState(0);
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [bufferMode, setBufferMode]           = useState(true);
  const PAGE_SIZE = 10;

  const discontinuedCount = data.filter(d => d.discontinued).length;

  // In buffer mode, reduce platform quantities by 10% before comparing to warehouse.
  // Warehouse is never modified — it reflects true physical stock.
  const resolvedData = useMemo(() => data.map(item => {
    const wh = item.warehouse;
    if (wh === null) return item;

    const buf = (v: number | null) => v !== null ? Math.round(v * (1 - BUFFER)) : null;
    const shopify = bufferMode ? buf(item.shopify) : item.shopify;
    const myntra  = bufferMode ? buf(item.myntra)  : item.myntra;
    const ajio    = bufferMode ? buf(item.ajio)    : item.ajio;

    const deltas: Record<string, number> = {};
    if (shopify !== null) deltas['Shopify'] = shopify - wh;
    if (myntra  !== null) deltas['Myntra']  = myntra  - wh;
    if (ajio    !== null) deltas['Ajio']    = ajio    - wh;

    let worstDelta = 0, worstPlatform = '';
    for (const [p, d] of Object.entries(deltas)) {
      if (d > worstDelta) { worstDelta = d; worstPlatform = p; }
    }
    if (!worstPlatform) {
      for (const [p, d] of Object.entries(deltas)) {
        if (d < worstDelta) { worstDelta = d; worstPlatform = p; }
      }
    }

    const risk: RiskLevel = worstDelta > 10 ? 'red' : worstDelta > 2 ? 'amber' : 'green';
    return {
      ...item,
      shopify, myntra, ajio,
      platformDeltas: deltas,
      worstDelta,
      worstPlatform: worstPlatform || null,
      delta: Math.abs(worstDelta),
      risk,
    };
  }), [data, bufferMode]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let rows = showDiscontinued ? resolvedData : resolvedData.filter(r => !r.discontinued);
    if (riskFilter !== 'all') rows = rows.filter(r => r.risk === riskFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => r.sku.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      let cmp = 0;
      const mappingOrder: Record<MappingStatus, number> = { Unmapped: 0, Partial: 1, Unknown: 2, Mapped: 3 };
      if      (sortKey === 'risk')          cmp = riskOrder[a.risk as RiskLevel] - riskOrder[b.risk as RiskLevel];
      else if (sortKey === 'mappingStatus') cmp = mappingOrder[a.mappingStatus as MappingStatus] - mappingOrder[b.mappingStatus as MappingStatus];
      else if (sortKey === 'delta')         cmp = a.delta - b.delta;
      else if (sortKey === 'warehouse')     cmp = (a.warehouse ?? -1) - (b.warehouse ?? -1);
      else if (sortKey === 'shopify')       cmp = (a.shopify ?? -1)   - (b.shopify ?? -1);
      else if (sortKey === 'myntra')        cmp = (a.myntra ?? -1)    - (b.myntra ?? -1);
      else if (sortKey === 'ajio')          cmp = (a.ajio ?? -1)      - (b.ajio ?? -1);
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [resolvedData, search, riskFilter, sortKey, sortDir, showDiscontinued]);

  const pageData    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-gray-600">
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const filterBtn = (val: RiskLevel | 'all', label: string, activeClass: string) => (
    <button
      key={val}
      onClick={() => { setRiskFilter(val); setPage(0); }}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        riskFilter === val ? activeClass : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  const refWH = (item: InventoryItem) => item.warehouse;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">

      {/* Buffer banner — only in buffer mode */}
      {bufferMode && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-950/30 border-b border-amber-900/50">
          <span className="text-amber-400 text-xs">⚠</span>
          <p className="text-xs text-amber-300/80">
            <span className="font-semibold">10% buffer active — platform quantities shown at 90%.</span>{' '}
            Warehouse reflects true physical stock. Platform numbers are reduced so that
            even at full sell-through, you undersell rather than oversell.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center px-4 py-3 border-b border-gray-800">
        <input
          type="text"
          placeholder="Search SKU or product…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5 w-56 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
        />
        <div className="flex gap-2">
          {filterBtn('all',   `All (${resolvedData.length})`,                                          'bg-gray-600 text-white')}
          {filterBtn('red',   `🔴 High (${resolvedData.filter(d => d.risk === 'red').length})`,        'bg-red-900 text-red-200')}
          {filterBtn('amber', `🟡 Moderate (${resolvedData.filter(d => d.risk === 'amber').length})`,  'bg-amber-900 text-amber-200')}
          {filterBtn('green', `🟢 Aligned (${resolvedData.filter(d => d.risk === 'green').length})`,   'bg-green-900 text-green-200')}
        </div>

        {/* Buffer toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className={`text-xs ${!bufferMode ? 'text-gray-300' : 'text-gray-600'}`}>Actual</span>
          <button
            onClick={() => { setBufferMode(v => !v); setPage(0); }}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${bufferMode ? 'bg-amber-600' : 'bg-gray-700'}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-200 ${bufferMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs ${bufferMode ? 'text-amber-400' : 'text-gray-600'}`}>10% buffer</span>
        </div>

        <button
          onClick={() => { setShowDiscontinued(v => !v); setPage(0); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showDiscontinued ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full inline-block ${showDiscontinued ? 'bg-gray-400' : 'bg-gray-600'}`} />
          {showDiscontinued ? 'Hide' : 'Show'} discontinued ({discontinuedCount})
        </button>

        <span className="text-xs text-gray-500">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
              {([
                ['sku', 'SKU'], ['name', 'Product'],
                ['warehouse', 'Warehouse'],
                ['shopify', bufferMode ? 'Shopify ×0.9' : 'Shopify'],
                ['myntra',  bufferMode ? 'Myntra ×0.9'  : 'Myntra'],
                ['ajio',    bufferMode ? 'Ajio ×0.9'    : 'Ajio'],
                ['delta', 'Δ vs WH'], ['risk', 'Risk'], ['mappingStatus', 'Mapping'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-4 py-2.5 text-left cursor-pointer hover:text-gray-200 select-none whitespace-nowrap"
                >
                  {label}<SortIcon col={key} />
                </th>
              ))}
              <th className="px-4 py-2.5 text-left whitespace-nowrap">Last Sync</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map(item => {
              const isOversell = item.worstDelta > 0;
              const disc       = item.discontinued;
              return (
                <tr
                  key={item.sku}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                    disc       ? 'opacity-40' :
                    item.risk === 'red'   ? 'bg-red-950/20' :
                    item.risk === 'amber' ? 'bg-amber-950/10' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-indigo-400">{item.sku}</td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <span className={disc ? 'text-gray-500 line-through' : 'text-gray-200'}>{item.name}</span>
                    {disc && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700 font-medium">
                        discontinued
                      </span>
                    )}
                  </td>

                  {/* Warehouse column — always shows true physical stock */}
                  <td className="px-4 py-2.5">
                    {item.warehouse !== null
                      ? <span className="text-gray-300 font-medium">{item.warehouse}</span>
                      : nullCell}
                  </td>

                  <td className="px-4 py-2.5"><StockCell value={item.shopify} refWH={refWH(item)} /></td>
                  <td className="px-4 py-2.5"><StockCell value={item.myntra}  refWH={refWH(item)} /></td>
                  <td className="px-4 py-2.5"><StockCell value={item.ajio}    refWH={refWH(item)} /></td>

                  {/* Delta */}
                  <td className="px-4 py-2.5">
                    {item.worstDelta === 0 ? (
                      <span className="text-green-400 font-bold">±0</span>
                    ) : isOversell ? (
                      <span className="flex flex-col gap-0.5">
                        <span className={`font-bold text-sm ${item.delta > 10 ? 'text-red-400' : 'text-amber-400'}`}>
                          +{item.worstDelta}
                        </span>
                        {item.worstPlatform && (
                          <span className="text-xs font-semibold text-red-500">
                            {item.worstPlatform} ▲ oversell
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="flex flex-col gap-0.5">
                        <span className="text-gray-500 text-sm">{item.worstDelta}</span>
                        {item.worstPlatform && (
                          <span className="text-xs text-gray-600">{item.worstPlatform} undersell</span>
                        )}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2.5"><RiskBadge level={item.risk as RiskLevel} /></td>
                  <td className="px-4 py-2.5">
                    <MappingBadge status={item.mappingStatus as MappingStatus} />
                    {item.mappingStatus !== 'Mapped' && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {!item.whCode && !item.myntraCode ? 'No platform codes' :
                         !item.myntraCode ? 'No Myntra code' : 'No WH code'}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{item.lastSync ?? '—'}</td>
                </tr>
              );
            })}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500 text-sm">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
