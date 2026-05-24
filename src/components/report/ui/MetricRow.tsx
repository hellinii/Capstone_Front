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
  // 3가지 표시 모드
  // 1) threshold > 0           → 일반 KPI (값 + 기준 + 판정)
  // 2) threshold == 0 & value>0 → 정보 제공 (MCC 등 — 값은 표시, 기준 "—", "ℹ 정보 제공")
  // 3) threshold == 0 & value==0 → 시각화 참조 (CM/Class별 — 값 "—", 기준 "정보 제공", "ℹ 시각화 참조")
  const isInfoWithValue = threshold === 0 && value > 0;
  const isVisualOnly    = threshold === 0 && value === 0;
  const isThresholded   = threshold > 0;

  return (
    <tr className={cn("border-b border-slate-100 last:border-b-0", className)}>
      <td className="py-2.5 pr-3 font-mono text-xs text-slate-400">{tcId}</td>
      <td className="py-2.5 pr-4 font-medium text-slate-800">{name}</td>
      {formula !== undefined && (
        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{formula}</td>
      )}
      <td className="py-2.5 pr-4 font-semibold tabular-nums text-slate-900">
        {isVisualOnly ? "—" : value.toFixed(3)}
      </td>
      <td className="py-2.5 pr-4 text-slate-500">
        {isThresholded ? `≥ ${threshold.toFixed(2)}` : isInfoWithValue ? "—" : "정보 제공"}
      </td>
      <td className="py-2.5">
        {isThresholded ? (
          <PassBadge verdict={status} />
        ) : (
          <span className="text-xs text-slate-500">
            ℹ {isVisualOnly ? "시각화 참조" : "정보 제공"}
          </span>
        )}
      </td>
    </tr>
  );
}
