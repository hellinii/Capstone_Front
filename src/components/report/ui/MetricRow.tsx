import { PassBadge } from "./PassBadge";
import { cn } from "../../../utils/styling/styles";

interface MetricRowProps {
  tcId: string;
  name: string;
  formula?: string;
  value: number;
  threshold: number;
  status: "pass" | "fail" | "warning";
  className?: string;
}

export function MetricRow({ tcId, name, formula, value, threshold, status, className }: MetricRowProps) {
  const isInfoOnly = threshold === 0;

  return (
    <tr className={cn("border-b border-slate-100 last:border-b-0", className)}>
      <td className="py-2.5 pr-3 font-mono text-xs text-slate-400">{tcId}</td>
      <td className="py-2.5 pr-4 font-medium text-slate-800">{name}</td>
      {formula !== undefined && (
        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{formula}</td>
      )}
      <td className="py-2.5 pr-4 font-semibold tabular-nums text-slate-900">
        {isInfoOnly ? "—" : value.toFixed(3)}
      </td>
      <td className="py-2.5 pr-4 text-slate-500">
        {isInfoOnly ? "정보 제공" : `≥ ${threshold.toFixed(2)}`}
      </td>
      <td className="py-2.5">
        {isInfoOnly ? (
          <span className="text-xs text-slate-400">ℹ</span>
        ) : (
          <PassBadge verdict={status} />
        )}
      </td>
    </tr>
  );
}
