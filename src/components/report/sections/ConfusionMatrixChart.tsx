import type { ConfusionMatrixData } from "../../../types/report.types";
import { cn } from "../../../utils/styling/styles";

interface ConfusionMatrixChartProps {
  data: ConfusionMatrixData;
}

export function ConfusionMatrixChart({ data }: ConfusionMatrixChartProps) {
  const { labels, matrix, totalSamples } = data;
  const maxVal = Math.max(...matrix.flat());

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Confusion Matrix</h3>
      <div
        className="inline-grid gap-1 text-sm"
        style={{ gridTemplateColumns: `120px repeat(${labels.length}, minmax(0, 1fr))` }}
      >
        {/* Header row */}
        <div />
        {labels.map((label) => (
          <div key={label} className="py-1.5 text-center text-xs font-medium text-slate-500">
            예측: {label}
          </div>
        ))}

        {/* Data rows */}
        {matrix.map((row, ri) => (
          <>
            <div key={`label-${ri}`} className="flex items-center py-1.5 text-xs font-medium text-slate-500">
              실제: {labels[ri]}
            </div>
            {row.map((count, ci) => {
              const intensity = maxVal > 0 ? count / maxVal : 0;
              const isDiag = ri === ci;
              return (
                <div
                  key={ci}
                  className={cn(
                    "flex flex-col items-center justify-center rounded py-3 text-center",
                    isDiag ? "text-white" : "text-slate-700",
                  )}
                  style={{
                    backgroundColor: isDiag
                      ? `rgba(15, 118, 110, ${0.3 + intensity * 0.7})`
                      : `rgba(239, 68, 68, ${0.05 + intensity * 0.4})`,
                  }}
                >
                  <span className="text-base font-semibold tabular-nums">
                    {count.toLocaleString()}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {((count / totalSamples) * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </>
        ))}
      </div>
      <p className="text-xs text-slate-400">총 샘플 수: {totalSamples.toLocaleString()}건</p>
    </div>
  );
}
