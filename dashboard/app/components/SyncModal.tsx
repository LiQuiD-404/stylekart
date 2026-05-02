'use client';

import { useEffect, useState } from 'react';
import type { InventoryItem } from '../types';

interface SyncResult {
  fixed: number;
  stillRed: number;
  diffs: Array<{ sku: string; name: string; before: number; after: number }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  inventoryData: InventoryItem[];
}

export default function SyncModal({ open, onClose, inventoryData }: Props) {
  const [phase, setPhase] = useState<'loading' | 'done'>('loading');
  const [result, setResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase('loading');
    setResult(null);

    const timer = setTimeout(() => {
      const redItems = inventoryData.filter(i => i.risk === 'red');
      const sampled = redItems.slice(0, 6);
      const fixed = Math.floor(redItems.length * 0.72);
      const diffs = sampled.map(item => ({
        sku: item.sku,
        name: item.name,
        before: item.delta,
        after: Math.max(0, Math.floor(item.delta * 0.15)),
      }));
      setResult({ fixed, stillRed: redItems.length - fixed, diffs });
      setPhase('done');
    }, 2800);

    return () => clearTimeout(timer);
  }, [open, inventoryData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={phase === 'done' ? onClose : undefined} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg">
        {phase === 'loading' ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg className="animate-spin h-14 w-14 text-indigo-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Reconciling Inventory</h3>
            <p className="text-sm text-gray-400">Pulling counts from Shopify, Myntra & Ajio…</p>
            <div className="mt-6 space-y-2">
              {['Shopify API', 'Myntra API', 'Ajio API', 'Warehouse WMS'].map((src, i) => (
                <div key={src} className="flex items-center gap-3 text-sm text-gray-400">
                  <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{src}</span>
                </div>
              ))}
            </div>
          </div>
        ) : result ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Sync Complete</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-green-950/50 border border-green-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{result.fixed}</p>
                <p className="text-xs text-green-600 mt-1">SKUs reconciled</p>
              </div>
              <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{result.stillRed}</p>
                <p className="text-xs text-red-600 mt-1">Still need attention</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Sample diffs resolved</p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {result.diffs.map(d => (
                <div key={d.sku} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-300 truncate">{d.name}</p>
                    <p className="text-xs font-mono text-gray-600">{d.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <span className="text-red-400 font-bold">Δ{d.before}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-green-400 font-bold">Δ{d.after}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-600 text-center">
              Production: this would call <code className="text-indigo-400">/api/inventory/reconcile</code>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
