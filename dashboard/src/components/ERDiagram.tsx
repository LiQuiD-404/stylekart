
type FieldTag = 'PK' | 'FK' | 'UNIQUE' | 'MASKED';

interface Field {
  name: string;
  type?: string;
  tags?: FieldTag[];
  ref?: string;
  example: string;
  highlight?: boolean;
}

interface Entity {
  name: string;
  color: string;
  label: string;
  fields: Field[];
}

const TAG_STYLE: Record<FieldTag, string> = {
  PK:     'bg-yellow-900  text-yellow-300  border border-yellow-700',
  FK:     'bg-blue-900    text-blue-300    border border-blue-700',
  UNIQUE: 'bg-gray-800    text-gray-400    border border-gray-600',
  MASKED: 'bg-red-950     text-red-400     border border-red-800',
};

const ENTITIES: Entity[] = [
  {
    name: 'Inventory',
    color: 'indigo',
    label: 'product catalog',
    fields: [
      { name: 'SK_Code',       tags: ['PK'],    example: 'SK-DUP-001',         highlight: true },
      { name: 'Name',                           example: 'Coral Dupatta' },
      { name: 'Status',                         example: 'active' },
      { name: 'Size',                           example: 'Free Size' },
      { name: 'Category',                       example: 'Dupatta' },
      { name: 'RegisteredDate',                 example: '2024-04-23' },
      { name: 'ImageID',       tags: ['FK'],    ref: 'Image.ImageID',   example: 'IMG-001' },
    ],
  },
  {
    name: 'PlatformDetails',
    color: 'blue',
    label: 'external code mapping',
    fields: [
      { name: 'PlatformID',    tags: ['PK'],    example: 'uuid-A',             highlight: true },
      { name: 'SK_Code',       tags: ['FK'],    ref: 'Inventory.SK_Code',       example: 'SK-DUP-001' },
      { name: 'PlatformName',                   example: 'myntra' },
      { name: 'PlatformCode',  tags: ['UNIQUE'],example: 'MYN-958933' },
      { name: 'CodeType',                       example: 'listing' },
      { name: 'Status',                         example: 'active' },
      { name: 'RegisteredDate',                 example: '2024-04-23' },
    ],
  },
  {
    name: 'PlatformExternal',
    color: 'cyan',
    label: 'live stock per location',
    fields: [
      { name: 'ExtID',         tags: ['PK'],    example: 'uuid-B',             highlight: true },
      { name: 'PlatformID',    tags: ['FK'],    ref: 'PlatformDetails.PlatformID', example: 'uuid-A' },
      { name: 'SK_Code',       tags: ['FK'],    ref: 'Inventory.SK_Code',       example: 'SK-DUP-001' },
      { name: 'Location',                       example: 'Bhiwandi' },
      { name: 'Quantity',                       example: '23' },
      { name: 'Type',                           example: 'warehouse' },
      { name: 'LastUpdated',                    example: '2026-02-14 09:12' },
    ],
  },
  {
    name: 'Orders',
    color: 'green',
    label: 'order ledger',
    fields: [
      { name: 'OrderID',           tags: ['PK'],  example: 'ORD-00293',        highlight: true },
      { name: 'SourcePlatformID',  tags: ['FK'],  ref: 'PlatformDetails.PlatformID', example: 'uuid-A' },
      { name: 'ExtID',             tags: ['FK'],  ref: 'PlatformExternal.ExtID',     example: 'uuid-B' },
      { name: 'SK_Code',           tags: ['FK'],  ref: 'Inventory.SK_Code',    example: 'SK-DUP-001' },
      { name: 'CustomerID',        tags: ['FK'],  ref: 'Customer.CustomerID',  example: 'uuid-C' },
      { name: 'PlatformOrderID',                  example: 'MYN-ORD-9182736' },
      { name: 'Status',                           example: 'fulfilled' },
      { name: 'Amount',                           example: '3018' },
      { name: 'Date',                             example: '2026-02-03' },
    ],
  },
  {
    name: 'Returns',
    color: 'orange',
    label: 'return event log',
    fields: [
      { name: 'ReturnID',        tags: ['PK'],   example: 'RET-00091',        highlight: true },
      { name: 'OrderID',         tags: ['FK'],   ref: 'Orders.OrderID',       example: 'ORD-00293' },
      { name: 'SK_Code',         tags: ['FK'],   ref: 'Inventory.SK_Code',    example: 'SK-DUP-001' },
      { name: 'PlatformReturnID',                example: 'MYN-RET-448821' },
      { name: 'ReceivedAt',                      example: 'Bhiwandi' },
      { name: 'Condition',                       example: 'sellable' },
      { name: 'Status',                          example: 'restocked' },
      { name: 'RefundAmount',                    example: '3018' },
      { name: 'Date',                            example: '2026-02-14' },
    ],
  },
  {
    name: 'Customer',
    color: 'pink',
    label: 'customer identity (PII masked)',
    fields: [
      { name: 'CustomerID',   tags: ['PK'],      example: 'uuid-C',           highlight: true },
      { name: 'Name',         tags: ['MASKED'],  example: 'R**** S***' },
      { name: 'Phone',        tags: ['MASKED'],  example: '+91 98XXX XX456' },
      { name: 'Address',      tags: ['MASKED'],  example: 'Mumbai, MH' },
      { name: 'Birthday',     tags: ['MASKED'],  example: '--08-14' },
      { name: 'VIPLevel',                        example: 'bronze | silver | gold' },
      { name: 'TotalPoints',                     example: '318' },
      { name: 'RegisteredOn',                    example: '2024-11-02' },
      { name: 'ReturnCount',                     example: '4' },
    ],
  },
  {
    name: 'Image',
    color: 'gray',
    label: 'centralised asset store',
    fields: [
      { name: 'ImageID',      tags: ['PK'],      example: 'IMG-001',          highlight: true },
      { name: 'Description',                     example: 'Coral Dupatta front' },
      { name: 'Source',                          example: 'cdn.stylekart.io/img/IMG-001.webp' },
      { name: 'Metadata',                        example: '{width:800,format:"webp"}' },
    ],
  },
];

const RELATIONSHIPS = [
  { from: 'Inventory',        to: 'PlatformDetails',  via: 'SK_Code',           card: '1 → M', note: 'One SKU → many platform codes (WH, Myntra, Ajio, Shopify)' },
  { from: 'PlatformDetails',  to: 'PlatformExternal', via: 'PlatformID',        card: '1 → M', note: 'One platform code → many stock pools (one per warehouse location)' },
  { from: 'Inventory',        to: 'PlatformExternal', via: 'SK_Code',           card: '1 → M', note: 'Direct link — find all stock locations for a SKU without going through PlatformDetails' },
  { from: 'PlatformDetails',  to: 'Orders',           via: 'SourcePlatformID',  card: '1 → M', note: 'Which platform listing the order came from' },
  { from: 'PlatformExternal', to: 'Orders',           via: 'ExtID',             card: '1 → M', note: 'Which stock pool fulfilled the order — gives warehouse + location for return routing' },
  { from: 'Orders',           to: 'Returns',          via: 'OrderID',           card: '1 → 1', note: 'A return traces back to one order — validates which warehouse should receive it' },
  { from: 'Customer',         to: 'Orders',           via: 'CustomerID',        card: '1 → M', note: 'One customer → many orders. ReturnCount incremented per return' },
  { from: 'Image',            to: 'Inventory',        via: 'ImageID',           card: '1 → M', note: 'One image used across multiple product variants' },
];

interface FlowStep { label: string; detail: string }
interface Flow {
  title: string;
  steps: FlowStep[];
  styles: { border: string; bg: string; title: string; num: string };
}

const FLOWS: Flow[] = [
  {
    title: 'Order flow',
    styles: {
      border: 'border-green-900', bg: 'bg-green-950/20',
      title: 'text-green-400',
      num: 'bg-green-900 border border-green-700 text-green-300',
    },
    steps: [
      { label: 'Order arrives',       detail: 'Myntra sends order MYN-ORD-9182736 with listing code MYN-958933' },
      { label: 'Resolve listing',     detail: "PlatformDetails WHERE PlatformCode = 'MYN-958933' → SK_Code = SK-DUP-001, PlatformID = uuid-A" },
      { label: 'Find stock',          detail: "PlatformExternal WHERE SK_Code = 'SK-DUP-001' AND Type = 'warehouse' → Bhiwandi (ExtID = uuid-B, Qty = 23)" },
      { label: 'Create order',        detail: 'INSERT Orders: SourcePlatformID = uuid-A, ExtID = uuid-B, PlatformOrderID = MYN-ORD-9182736' },
      { label: 'Decrement stock',     detail: 'UPDATE PlatformExternal SET Quantity = 22 WHERE ExtID = uuid-B' },
    ],
  },
  {
    title: 'Return flow',
    styles: {
      border: 'border-orange-900', bg: 'bg-orange-950/20',
      title: 'text-orange-400',
      num: 'bg-orange-900 border border-orange-700 text-orange-300',
    },
    steps: [
      { label: 'Return arrives',      detail: 'Staff scan barcode → resolves to SK-DUP-001' },
      { label: 'Find original order', detail: "Orders WHERE PlatformOrderID = 'MYN-ORD-9182736' → OrderID = ORD-00293, ExtID = uuid-B" },
      { label: 'Validate location',   detail: "PlatformExternal[uuid-B].Location = 'Bhiwandi'. Scan came from Bhiwandi → match ✓" },
      { label: 'Accept & restock',    detail: 'INSERT Returns: ReceivedAt = Bhiwandi, Condition = sellable. UPDATE Qty = 23. ReturnCount += 1' },
      { label: 'Mismatch case',       detail: 'Scan from Delhi ≠ Bhiwandi → Status = pending, stock held for manual review' },
    ],
  },
  {
    title: 'New product onboarding',
    styles: {
      border: 'border-indigo-900', bg: 'bg-indigo-950/20',
      title: 'text-indigo-400',
      num: 'bg-indigo-900 border border-indigo-700 text-indigo-300',
    },
    steps: [
      { label: 'Create in catalog',   detail: 'INSERT Inventory: SK_Code = SK-DUP-042, Name = …, ImageID = IMG-033' },
      { label: 'Register warehouse',  detail: 'INSERT PlatformDetails: PlatformCode = WH-BHW-042, PlatformName = warehouse → PlatformID = uuid-D' },
      { label: 'Set opening stock',   detail: 'INSERT PlatformExternal: PlatformID = uuid-D, Location = Bhiwandi, Quantity = 50' },
      { label: 'List on Myntra',      detail: 'Myntra API response returns MYN-991234. INSERT PlatformDetails: PlatformCode = MYN-991234' },
      { label: 'Ajio ID rotated',     detail: 'Old row → Status = inactive. INSERT new PlatformDetails with new AJO-XXXXX. History preserved.' },
    ],
  },
];

const COLOR_MAP: Record<string, { border: string; badge: string; title: string; bg: string }> = {
  indigo: { border: 'border-indigo-800', badge: 'bg-indigo-900 text-indigo-300', title: 'text-indigo-300', bg: 'bg-indigo-950/20' },
  blue:   { border: 'border-blue-800',   badge: 'bg-blue-900 text-blue-300',     title: 'text-blue-300',   bg: 'bg-blue-950/20'   },
  cyan:   { border: 'border-cyan-800',   badge: 'bg-cyan-900 text-cyan-300',     title: 'text-cyan-300',   bg: 'bg-cyan-950/20'   },
  green:  { border: 'border-green-800',  badge: 'bg-green-900 text-green-300',   title: 'text-green-300',  bg: 'bg-green-950/20'  },
  orange: { border: 'border-orange-800', badge: 'bg-orange-900 text-orange-300', title: 'text-orange-300', bg: 'bg-orange-950/20' },
  pink:   { border: 'border-pink-800',   badge: 'bg-pink-900 text-pink-300',     title: 'text-pink-300',   bg: 'bg-pink-950/20'   },
  gray:   { border: 'border-gray-700',   badge: 'bg-gray-800 text-gray-400',     title: 'text-gray-400',   bg: 'bg-gray-800/20'   },
};

function EntityCard({ entity }: { entity: Entity }) {
  const c = COLOR_MAP[entity.color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between gap-3">
        <p className={`text-sm font-bold font-mono ${c.title}`}>{entity.name}</p>
        <span className="text-xs text-gray-600 italic">{entity.label}</span>
      </div>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-gray-800/60">
            <th className="px-3 py-1.5 text-left text-gray-600 font-normal w-36">field</th>
            <th className="px-2 py-1.5 text-left text-gray-600 font-normal w-28">constraints</th>
            <th className="px-2 py-1.5 text-left text-gray-600 font-normal">e.g.</th>
          </tr>
        </thead>
        <tbody>
          {entity.fields.map(f => (
            <tr key={f.name} className={`border-b border-gray-800/50 ${f.highlight ? 'bg-gray-800/40' : ''}`}>
              <td className={`px-3 py-1.5 ${f.highlight ? 'text-white font-semibold' : 'text-gray-300'}`}>
                {f.name}
              </td>
              <td className="px-2 py-1.5">
                <div className="flex flex-wrap gap-1 items-center">
                  {f.tags?.map(t => (
                    <span key={t} className={`px-1.5 py-0.5 rounded text-xs font-medium ${TAG_STYLE[t]}`}>{t}</span>
                  ))}
                  {f.tags?.includes('FK') && f.ref && (
                    <span className="text-gray-600 text-xs">→ {f.ref}</span>
                  )}
                </div>
              </td>
              <td className="px-2 py-1.5 text-amber-500/70 italic text-xs">
                {f.example}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ERDiagram() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-gray-200">StyleKart — Entity Relationship Diagram</h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-3xl">
          Seven tables, one canonical key. Every external ID — warehouse codes, Myntra listings, Ajio codes —
          resolves through <span className="text-indigo-400 font-mono">Inventory.SK_Code</span>.
          Identity (what a product is) is separated from state (how much stock exists where).
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          {(Object.entries(TAG_STYLE) as [FieldTag, string][]).map(([tag, cls]) => (
            <span key={tag} className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Entity cards */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tables</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {ENTITIES.map(e => <EntityCard key={e.name} entity={e} />)}
        </div>
      </div>

      {/* Relationships */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Relationships</p>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">From</th>
                <th className="px-4 py-2.5 text-left">To</th>
                <th className="px-4 py-2.5 text-left">Via</th>
                <th className="px-4 py-2.5 text-left">Cardinality</th>
                <th className="px-4 py-2.5 text-left">Why</th>
              </tr>
            </thead>
            <tbody>
              {RELATIONSHIPS.map((r, i) => {
                const fromColor = COLOR_MAP[ENTITIES.find(e => e.name === r.from)?.color ?? 'gray'];
                const toColor   = COLOR_MAP[ENTITIES.find(e => e.name === r.to)?.color ?? 'gray'];
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className={`px-4 py-2.5 font-mono font-semibold ${fromColor.title}`}>{r.from}</td>
                    <td className={`px-4 py-2.5 font-mono font-semibold ${toColor.title}`}>{r.to}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-400">{r.via}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">{r.card}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flows */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key flows</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {FLOWS.map(f => (
            <div key={f.title} className={`rounded-xl border ${f.styles.border} ${f.styles.bg} p-4`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${f.styles.title}`}>{f.title}</p>
              <ol className="space-y-3">
                {f.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={`shrink-0 w-5 h-5 rounded-full ${f.styles.num} text-xs font-bold flex items-center justify-center mt-0.5`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-300">{s.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed font-mono">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
