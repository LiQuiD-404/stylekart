import type { RiskLevel } from '../types';

const config: Record<RiskLevel, { label: string; className: string; dot: string }> = {
  red:   { label: 'High Risk',  className: 'bg-red-950 text-red-300 border border-red-800',     dot: 'bg-red-400' },
  amber: { label: 'Moderate',   className: 'bg-amber-950 text-amber-300 border border-amber-800', dot: 'bg-amber-400' },
  green: { label: 'Aligned',    className: 'bg-green-950 text-green-300 border border-green-800', dot: 'bg-green-400' },
};

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const { label, className, dot } = config[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
