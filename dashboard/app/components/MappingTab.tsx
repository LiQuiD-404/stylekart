'use client';

import { useState, useMemo } from 'react';
import type { MappingEntry } from '../types';

const platforms = [
  {
    key: 'skCode'    as keyof MappingEntry,
    label: 'StyleKart (Internal)',
    prefix: 'SK-',
    color: 'indigo',
    note: null,
  },
  {
    key: 'whCode'    as keyof MappingEntry,
    label: 'Warehouse (Bhiwandi)',
    prefix: 'WH-',
    color: 'blue',
    note: null,
  },
  {
    key: 'myntraCode' as keyof MappingEntry,
    label: 'Myntra',
    prefix: 'MYN-',
    color: 'orange',
    note: null,
  },
  {
    key: 'ajioCode'  as keyof MappingEntry,
    label: 'Ajio',
    prefix: null,
    color: 'purple',
    note: 'Ajio reassigns IDs on every re-upload — mapping not possible without API',
  },
  // Shopify uses the internal SK code directly
  {
    key: 'skCode'    as keyof MappingEntry,
    label: 'Shopify',
    prefix: 'SK-',
    color: 'green',
    note: 'Shopify uses the internal SK code — always in sync with StyleKart',
  },
] as const;

const colorMap: Record<string, { card: string; badge: string; missing: string }> = {
  indigo: { card: 'border-indigo-800 bg-indigo-950/30', badge: 'bg-indigo-900 text-indigo-300', missing: 'border-gray-700 bg-gray-800/40' },
  blue:   { card: 'border-blue-800 bg-blue-950/30',    badge: 'bg-blue-900 text-blue-300',    missing: 'border-gray-700 bg-gray-800/40' },
  orange: { card: 'border-orange-800 bg-orange-950/30',badge: 'bg-orange-900 text-orange-300', missing: 'border-gray-700 bg-gray-800/40' },
  purple: { card: 'border-purple-800 bg-purple-950/30',badge: 'bg-purple-900 text-purple-300', missing: 'border-gray-700 bg-gray-800/40' },
  green:  { card: 'border-green-800 bg-green-950/30',  badge: 'bg-green-900 text-green-300',   missing: 'border-gray-700 bg-gray-800/40' },
};

function PlatformCard({
  label, code, note, color, alwaysMissing,
}: {
  label: string; code: string | null; note: string | null; color: string; alwaysMissing?: boolean;
}) {
  const c = colorMap[color];
  const missing = alwaysMissing || code === null;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${missing ? c.missing : c.card}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        {missing ? (
          <span className="flex items-center gap-1 text-xs font-medium text-red-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Missing
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-green-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Linked
          </span>
        )}
      </div>
      {missing ? (
        <p className="text-xs text-gray-600 italic">{note ?? 'No code assigned'}</p>
      ) : (
        <span className={`inline-block self-start font-mono text-sm px-2 py-1 rounded ${c.badge}`}>
          {code}
        </span>
      )}
    </div>
  );
}

interface Props {
  data: MappingEntry[];
}

export default function MappingTab({ data }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MappingEntry | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Build reverse lookup index: any code → entry
  const index = useMemo(() => {
    const map = new Map<string, MappingEntry>();
    for (const e of data) {
      map.set(e.skCode.toLowerCase(), e);
      if (e.whCode)     map.set(e.whCode.toLowerCase(), e);
      if (e.myntraCode) map.set(e.myntraCode.toLowerCase(), e);
      if (e.ajioCode)   map.set(e.ajioCode.toLowerCase(), e);
    }
    return map;
  }, [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(e =>
      e.skCode.toLowerCase().includes(q) ||
      (e.whCode?.toLowerCase().includes(q)) ||
      (e.myntraCode?.toLowerCase().includes(q)) ||
      (e.ajioCode?.toLowerCase().includes(q)) ||
      e.productName.toLowerCase().includes(q)
    );
  }, [data, query]);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageResults = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setQuery(val);
    setPage(0);
    // Auto-select on exact match
    const exact = index.get(val.trim().toLowerCase());
    setSelected(exact ?? null);
  };

  const statusColor: Record<string, string> = {
    Mapped:   'bg-gray-800 text-gray-400 border border-gray-700',
    Partial:  'bg-amber-950 text-amber-400 border border-amber-800',
    Unmapped: 'bg-red-950 text-red-400 border border-red-900',
  };

  const missingPlatforms = (e: MappingEntry) => {
    const missing = [];
    if (!e.whCode)     missing.push('Warehouse');
    if (!e.myntraCode) missing.push('Myntra');
    missing.push('Ajio'); // always missing
    return missing;
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-gray-200 mb-1">SKU Mapping Lookup</h2>
        <p className="text-xs text-gray-500 mb-4">
          Enter any code — SK, WH, Myntra, or Ajio — to see all linked IDs for that product.
        </p>
        <input
          type="text"
          placeholder="e.g. SK-DUP-001, WH-DUP-0001, MYN-958933, or product name…"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
          autoFocus
        />
      </div>

      {/* Exact match detail card */}
      {selected && (
        <div className="bg-gray-900 rounded-xl border border-indigo-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">{selected.productName}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor[selected.status]}`}>
                {selected.status}
              </span>
            </div>
            {missingPlatforms(selected).length > 0 && (
              <div className="text-right">
                <p className="text-xs text-red-400 font-medium">Missing on:</p>
                <p className="text-xs text-red-600">{missingPlatforms(selected).join(', ')}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <PlatformCard label="StyleKart" code={selected.skCode}     color="indigo" note={null} />
            <PlatformCard label="Shopify"   code={selected.skCode}     color="green"  note="Uses SK code directly" />
            <PlatformCard label="Warehouse" code={selected.whCode}     color="blue"   note={null} />
            <PlatformCard label="Myntra"    code={selected.myntraCode} color="orange" note={null} />
            <PlatformCard
              label="Ajio"
              code={selected.ajioCode}
              color="purple"
              note="Ajio reassigns IDs on every re-upload"
              alwaysMissing={!selected.ajioCode}
            />
          </div>
        </div>
      )}

      {/* Results table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-semibold text-gray-200">
            {query ? `${results.length} results` : `All ${data.length} SKUs`}
          </span>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-gray-600 inline-block" />Mapped
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-amber-600 inline-block" />Partial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-red-700 inline-block" />Unmapped
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">Product</th>
                <th className="px-4 py-2.5 text-left">SK Code</th>
                <th className="px-4 py-2.5 text-left">WH Code</th>
                <th className="px-4 py-2.5 text-left">Myntra Code</th>
                <th className="px-4 py-2.5 text-left">Ajio Code</th>
                <th className="px-4 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageResults.map(e => (
                <tr
                  key={e.skCode}
                  onClick={() => { setSelected(e); setQuery(e.skCode); }}
                  className={`border-b border-gray-800/50 cursor-pointer transition-colors hover:bg-gray-800/50 ${
                    selected?.skCode === e.skCode ? 'bg-indigo-950/30' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 text-gray-200 max-w-[200px] truncate">{e.productName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-indigo-400">{e.skCode}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {e.whCode
                      ? <span className="text-blue-400">{e.whCode}</span>
                      : <span className="text-red-600">—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {e.myntraCode
                      ? <span className="text-orange-400">{e.myntraCode}</span>
                      : <span className="text-red-600">—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <span className="text-gray-600 italic text-xs">Not mappable</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${statusColor[e.status] ?? ''}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
              {pageResults.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500 text-sm">
                    No matching SKUs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-xs text-gray-500">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, results.length)} of {results.length}
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
    </div>
  );
}
