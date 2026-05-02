
import { useEffect, useState } from 'react';

interface HeaderProps {
  lastSyncTime: string;
  onSync: () => void;
  syncing: boolean;
}

export default function Header({ lastSyncTime, onSync, syncing }: HeaderProps) {
  const [now, setNow] = useState('');
  useEffect(() => {
    setNow(new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }));
  }, []);

  return (
    <header className="bg-gray-950 border-b border-gray-800">
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              StyleKart <span className="text-indigo-400">Ops Dashboard</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{now}</p>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div className="text-xs text-gray-400">
            <span className="text-gray-500">Last sync </span>
            <span className="text-gray-300 font-medium">{lastSyncTime}</span>
          </div>
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Inventory
            </>
          )}
        </button>
      </div>
    </header>
  );
}
