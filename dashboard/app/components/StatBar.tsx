interface StatBarProps {
  red: number;
  amber: number;
  green: number;
  total: number;
  label: string;
}

export default function StatBar({ red, amber, green, total, label }: StatBarProps) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">{label}</p>
      <div className="flex gap-4 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-400">{red}</p>
          <p className="text-xs text-gray-500 mt-0.5">High Risk</p>
        </div>
        <div className="w-px bg-gray-700" />
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-400">{amber}</p>
          <p className="text-xs text-gray-500 mt-0.5">Moderate</p>
        </div>
        <div className="w-px bg-gray-700" />
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">{green}</p>
          <p className="text-xs text-gray-500 mt-0.5">Aligned</p>
        </div>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="bg-red-500 rounded-l-full" style={{ width: `${(red / total) * 100}%` }} />
        <div className="bg-amber-500" style={{ width: `${(amber / total) * 100}%` }} />
        <div className="bg-green-500 rounded-r-full flex-1" />
      </div>
      <p className="text-xs text-gray-600 mt-2">{total} total SKUs</p>
    </div>
  );
}
