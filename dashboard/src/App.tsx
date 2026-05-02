import { useState, useEffect } from 'react';
import type { InventoryItem, ReturnItem, MappingEntry, SalesPoint } from './types';
import Header from './components/Header';
import InventoryTable from './components/InventoryTable';
import ReturnsPanel from './components/ReturnsPanel';
import MappingTab from './components/MappingTab';
import ERDiagram from './components/ERDiagram';
import SalesTrend from './components/SalesTrend';
import SyncModal from './components/SyncModal';
import StatBar from './components/StatBar';
import Footer from './components/Footer';

export default function App() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [mapping, setMapping] = useState<MappingEntry[]>([]);
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastSync, setLastSync] = useState('17 Mar 2026, 09:42 IST');
  const [activeTab, setActiveTab] = useState<'inventory' | 'returns' | 'mapping' | 'system'>('inventory');

  useEffect(() => {
    fetch('/data/inventory.json').then(r => r.json()).then(setInventory);
    fetch('/data/returns.json').then(r => r.json()).then(setReturns);
    fetch('/data/mapping.json').then(r => r.json()).then(setMapping);
    fetch('/data/sales.json').then(r => r.json()).then(setSales);
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSyncing(false);
    setLastSync(new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    }));
  };

  const redCount   = inventory.filter(i => i.risk === 'red').length;
  const amberCount = inventory.filter(i => i.risk === 'amber').length;
  const greenCount = inventory.filter(i => i.risk === 'green').length;

  const retRed   = returns.filter(r => r.band === 'red').length;
  const retAmber = returns.filter(r => r.band === 'amber').length;
  const retGreen = returns.filter(r => r.band === 'green').length;
  const totalRetRefund = returns.reduce((s, r) => s + r.refundTotal, 0);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header lastSyncTime={lastSync} onSync={handleSync} syncing={syncing} />

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6 space-y-6">

        {sales.length > 0 && <SalesTrend data={sales} />}

        {redCount > 0 && (
          <div className="flex items-center gap-3 bg-red-950/60 border border-red-800 rounded-xl px-4 py-3">
            <span className="text-red-400 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-300">
                {redCount} SKUs at high oversell risk — estimated exposure ₹{(redCount * 2200).toLocaleString('en-IN')}/month
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Inventory delta &gt;10 units across platforms. Sync now to reconcile.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBar red={redCount} amber={amberCount} green={greenCount} total={inventory.length} label="Inventory Risk" />

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Returns Risk — Feb 2026</p>
            <div className="flex gap-4 mb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{retRed}</p>
                <p className="text-xs text-gray-500 mt-0.5">&gt;30%</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{retAmber}</p>
                <p className="text-xs text-gray-500 mt-0.5">15–30%</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{retGreen}</p>
                <p className="text-xs text-gray-500 mt-0.5">&lt;15%</p>
              </div>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              <div className="bg-red-500 rounded-l-full" style={{ width: `${(retRed / (returns.length || 1)) * 100}%` }} />
              <div className="bg-amber-500" style={{ width: `${(retAmber / (returns.length || 1)) * 100}%` }} />
              <div className="bg-green-500 rounded-r-full flex-1" />
            </div>
            <p className="text-xs text-gray-600 mt-2">{returns.length} unique products</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Business Impact</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Inv. desync loss (est.)</span>
                <span className="text-sm font-bold text-red-400">₹8L / month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Returns refunded (Feb)</span>
                <span className="text-sm font-bold text-amber-400">₹{Math.round(totalRetRefund / 100000 * 10) / 10}L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Overall return rate</span>
                <span className="text-sm font-bold text-amber-400">~31%</span>
              </div>
              <div className="h-px bg-gray-800" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Total op. waste</span>
                <span className="text-sm font-bold text-white">₹14–15L / month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-800">
          {(
            [
              { id: 'inventory', label: 'Inventory Risk', count: inventory.length },
              { id: 'returns',   label: 'Returns',        count: returns.length },
              { id: 'mapping',   label: 'SKU Mapping',    count: mapping.length },
              { id: 'system',    label: 'System Design',  count: 0 },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 text-xs text-gray-600">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'inventory' && (
          <section>
            <p className="text-xs text-gray-600 mb-3">
              Risk driven by oversell only (platform &gt; warehouse) · undersell = stock available, not urgent
            </p>
            {inventory.length > 0 ? (
              <InventoryTable data={inventory} />
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500 text-sm">
                Loading inventory data…
              </div>
            )}
          </section>
        )}

        {activeTab === 'returns' && (
          <section>
            <p className="text-xs text-gray-600 mb-3">
              Color: <span className="text-green-400">Green &lt;15%</span> ·{' '}
              <span className="text-amber-400">Amber 15–30%</span> ·{' '}
              <span className="text-red-400">Red &gt;30%</span>
            </p>
            {returns.length > 0 ? (
              <ReturnsPanel data={returns} />
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500 text-sm">
                Loading returns data…
              </div>
            )}
          </section>
        )}

        {activeTab === 'mapping' && (
          <section>
            {mapping.length > 0 ? (
              <MappingTab data={mapping} />
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500 text-sm">
                Loading mapping data…
              </div>
            )}
          </section>
        )}

        {activeTab === 'system' && (
          <section>
            <ERDiagram />
          </section>
        )}
      </main>

      <Footer />

      <SyncModal open={modalOpen} onClose={handleModalClose} inventoryData={inventory} />
    </div>
  );
}
