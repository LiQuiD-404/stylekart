
/* ─────────────────────────────────────────────
   Central Product Registry — architecture diagram
   Static illustration, no data dependency
───────────────────────────────────────────── */

const SCHEMA_PRODUCTS = [
  { col: 'sk_code',   note: 'PK',    eg: 'SK-DUP-001',  hi: true  },
  { col: 'name',      note: '',      eg: 'Coral Dupatta', hi: false },
  { col: 'status',    note: '',      eg: 'active',        hi: false },
  { col: 'category',  note: '',      eg: 'Dupatta',       hi: false },
];

const SCHEMA_PLATFORM_CODES = [
  { col: 'sk_code',       note: 'FK → products', eg: 'SK-DUP-001',  hi: true  },
  { col: 'platform',      note: '',              eg: 'warehouse',    hi: false },
  { col: 'location',      note: '',              eg: 'Bhiwandi',     hi: true  },
  { col: 'platform_code', note: '',              eg: 'WH-BHW-0001', hi: false },
  { col: 'code_type',     note: '',              eg: 'product',      hi: false },
  { col: 'active',        note: '',              eg: 'true',         hi: false },
  { col: 'registered_at', note: '',              eg: '2025-04-01',   hi: false },
];

const WH_ROWS = [
  { sk: 'SK-DUP-001', platform: 'warehouse', location: 'Bhiwandi', code: 'WH-BHW-0001', type: 'product' },
  { sk: 'SK-DUP-001', platform: 'warehouse', location: 'Delhi',    code: 'WH-DEL-0023', type: 'product' },
  { sk: 'SK-DUP-001', platform: 'myntra',    location: '—',        code: 'MYN-958933',  type: 'listing' },
  { sk: 'SK-DUP-001', platform: 'ajio',      location: '—',        code: 'AJO-44821',   type: 'listing' },
  { sk: 'SK-DUP-001', platform: 'shopify',   location: '—',        code: 'SK-DUP-001',  type: 'product' },
];

const FLOWS = [
  {
    title: 'Sale',
    color: 'text-green-400',
    border: 'border-green-900',
    bg: 'bg-green-950/20',
    steps: [
      'Platform reports sale with its own ID (e.g. MYN-958933)',
      'CPR resolves MYN-958933 → SK-DUP-001',
      'Query: which warehouse + location holds this SK?',
      'Deduct stock from correct warehouse + location',
      'If multi-warehouse: deduct from the one that fulfilled it',
    ],
  },
  {
    title: 'Return',
    color: 'text-orange-400',
    border: 'border-orange-900',
    bg: 'bg-orange-950/20',
    steps: [
      'Return arrives at warehouse — staff scans barcode',
      'Barcode encodes SK code directly (no WH translation needed)',
      'CPR resolves SK → which location to credit stock back',
      'Platform code on manifest cross-checked for audit trail',
      'Unresolvable code → immediate alert, not silent NSKU_ bucket',
    ],
  },
  {
    title: 'New product onboarding',
    color: 'text-indigo-400',
    border: 'border-indigo-900',
    bg: 'bg-indigo-950/20',
    steps: [
      'Product created → SK code assigned in CPR',
      'Warehouse barcodes printed encoding SK code',
      'On Myntra upload → API returns listing ID → auto-registered in CPR',
      'On Ajio re-upload → old ID marked inactive, new ID registered',
      'Product cannot go live on any platform if SK not in CPR',
    ],
  },
];

const PLATFORMS = [
  { name: 'Shopify',   color: '#4ade80', note: 'Uses SK code directly' },
  { name: 'Myntra',    color: '#fb923c', note: 'listing ID captured on upload' },
  { name: 'Ajio',      color: '#c084fc', note: 'ID refreshed on every re-upload' },
  { name: 'Warehouse', color: '#60a5fa', note: '1 SK → many locations' },
];

function TableSchema({
  title, rows, highlight,
}: {
  title: string;
  rows: { col: string; note: string; eg: string; hi: boolean }[];
  highlight?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-700 overflow-hidden text-xs font-mono">
      <div className="bg-gray-800 px-3 py-1.5 text-gray-300 font-semibold text-xs tracking-wide border-b border-gray-700">
        {title}
      </div>
      <table className="w-full">
        <tbody>
          {rows.map(r => (
            <tr key={r.col} className={r.hi ? 'bg-indigo-950/40' : ''}>
              <td className={`px-3 py-1 border-b border-gray-800 w-36 ${r.hi ? 'text-indigo-300' : 'text-gray-400'}`}>
                {r.col}
              </td>
              <td className="px-2 py-1 border-b border-gray-800 text-gray-600 w-28 text-xs">
                {r.note}
              </td>
              <td className="px-2 py-1 border-b border-gray-800 text-gray-500 italic">
                {r.eg}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CPRDiagram() {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-gray-200">Central Product Registry — System Design</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          One canonical SK code owns all external IDs. Every system is a consumer, not a peer.
        </p>
      </div>

      {/* ── Architecture diagram ── */}
      <div className="relative">
        {/* CPR centre box */}
        <div className="flex justify-center mb-2">
          <div className="rounded-xl border-2 border-indigo-600 bg-indigo-950/40 px-8 py-4 text-center">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">CPR</p>
            <p className="text-sm font-semibold text-white">Central Product Registry</p>
            <p className="text-xs text-indigo-400 mt-0.5">SK code = canonical ID</p>
          </div>
        </div>

        {/* Connector line down */}
        <div className="flex justify-center">
          <div className="w-px h-6 bg-gray-700" />
        </div>

        {/* Platform nodes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLATFORMS.map(p => (
            <div key={p.name} className="flex flex-col items-center gap-1">
              {/* Connector up */}
              <div className="w-px h-4 bg-gray-700" />
              <div
                className="w-full rounded-lg border px-3 py-2.5 text-center"
                style={{ borderColor: p.color + '55', backgroundColor: p.color + '11' }}
              >
                <p className="text-xs font-semibold" style={{ color: p.color }}>{p.name}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-tight">{p.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 1:M warehouse label */}
        <div className="mt-3 flex justify-end">
          <div className="rounded-lg border border-blue-900 bg-blue-950/20 px-3 py-2 text-xs max-w-xs">
            <p className="text-blue-300 font-semibold mb-1">1 SK → many warehouse locations</p>
            <div className="space-y-0.5 font-mono text-gray-500">
              <p>SK-DUP-001 → WH-<span className="text-blue-400">BHW</span>-0001 (Bhiwandi)</p>
              <p>SK-DUP-001 → WH-<span className="text-blue-400">DEL</span>-0023 (Delhi)</p>
              <p>SK-DUP-001 → WH-<span className="text-blue-400">MUM</span>-0089 (Mumbai)</p>
            </div>
            <p className="text-gray-600 mt-1.5 text-xs">
              Location prefix (BHW / DEL / MUM) baked into WH code.
              Every sale/return attributes to a specific location.
            </p>
          </div>
        </div>
      </div>

      {/* ── Schema ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Database schema</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TableSchema title="products" rows={SCHEMA_PRODUCTS} />
          <TableSchema title="platform_codes" rows={SCHEMA_PLATFORM_CODES} />
        </div>
      </div>

      {/* ── 1:M example rows ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          platform_codes — example rows for SK-DUP-001
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-gray-800 text-gray-500 uppercase tracking-wider text-xs">
                {['sk_code', 'platform', 'location', 'platform_code', 'code_type'].map(h => (
                  <th key={h} className="px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WH_ROWS.map((r, i) => (
                <tr key={i} className={`border-t border-gray-800 ${r.platform === 'warehouse' ? 'bg-blue-950/10' : ''}`}>
                  <td className="px-3 py-2 text-indigo-400">{r.sk}</td>
                  <td className={`px-3 py-2 ${
                    r.platform === 'warehouse' ? 'text-blue-400' :
                    r.platform === 'myntra'    ? 'text-orange-400' :
                    r.platform === 'ajio'      ? 'text-purple-400' : 'text-green-400'
                  }`}>{r.platform}</td>
                  <td className="px-3 py-2 text-gray-400">{r.location}</td>
                  <td className="px-3 py-2 text-gray-300">{r.code}</td>
                  <td className="px-3 py-2 text-gray-600">{r.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600 mt-1.5">
          Warehouse rows have a <span className="text-blue-400">location</span> column — platform rows leave it null.
          Multiple warehouse rows per SK = 1:M relationship.
        </p>
      </div>

      {/* ── Data flows ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Key data flows</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FLOWS.map(f => (
            <div key={f.title} className={`rounded-lg border ${f.border} ${f.bg} p-4`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${f.color}`}>{f.title}</p>
              <ol className="space-y-1.5">
                {f.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-400">
                    <span className={`shrink-0 font-bold ${f.color}`}>{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* ── Current vs proposed ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current state vs CPR</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-red-900 bg-red-950/20 p-4 space-y-2">
            <p className="text-red-400 font-semibold uppercase tracking-wide">Now — spreadsheet</p>
            {[
              '3 disconnected ID systems, no enforced relationship',
              'WH codes manually translated to SK by a person',
              '38.4% of SKUs have no WH code at all',
              'Myntra return IDs can\'t be traced to any SK',
              'Broken ID discovered weeks later in a report',
              'Ajio IDs permanently lost on every re-upload',
            ].map((t, i) => (
              <div key={i} className="flex gap-2 text-gray-400">
                <span className="text-red-600 shrink-0">✗</span>{t}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-green-900 bg-green-950/20 p-4 space-y-2">
            <p className="text-green-400 font-semibold uppercase tracking-wide">CPR</p>
            {[
              'One table, one lookup — any ID resolves to SK in O(1)',
              'Warehouse barcode encodes SK directly, no translation',
              'Location prefix (BHW/DEL) in WH code — 1:M built in',
              'Myntra listing ID captured at upload time via API',
              'Unresolvable ID raises alert at ingestion, not in reports',
              'Ajio ID update is a registry event — old ID marked inactive',
            ].map((t, i) => (
              <div key={i} className="flex gap-2 text-gray-400">
                <span className="text-green-500 shrink-0">✓</span>{t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
