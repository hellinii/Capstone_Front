import type { ConfusionMatrixData } from "../../../types/report.types";
import { cn } from "../../../utils/styling/styles";

interface ConfusionMatrixChartProps {
  data: ConfusionMatrixData;
}

export function ConfusionMatrixChart({ data }: ConfusionMatrixChartProps) {
  if (data.multilabelMatrices && data.multilabelMatrices.length > 0) {
    return (
      <div className="space-y-6">
        {data.multilabelMatrices.map((m, idx) => (
          <SingleMatrixChart
            key={idx}
            data={{
              labels: [`Negative (${m.label})`, `Positive (${m.label})`],
              matrix: m.matrix,
              totalSamples: m.totalSamples,
            }}
          />
        ))}
      </div>
    );
  }
  return <SingleMatrixChart data={data} />;
}

function SingleMatrixChart({ data }: ConfusionMatrixChartProps) {
  const { labels, matrix, totalSamples } = data;
  const maxVal = Math.max(...matrix.flat());

  // 오분류 통계 (대각선 외 = 오분류)
  let misclassified = 0;
  let fp = 0; // 예측 Positive, 실제 Negative
  let fn = 0; // 예측 Negative, 실제 Positive
  matrix.forEach((row, ri) => {
    row.forEach((count, ci) => {
      if (ri !== ci) {
        misclassified += count;
        // 이진 분류 가정: 인덱스 0 = Negative, 1 = Positive
        if (labels.length === 2) {
          if (ri === 0 && ci === 1) fp += count;
          if (ri === 1 && ci === 0) fn += count;
        }
      }
    });
  });
  const misclassRate = totalSamples > 0 ? (misclassified / totalSamples) * 100 : 0;

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
      <ul className="space-y-0.5 text-xs text-slate-500">
        <li>총 샘플 수: {totalSamples.toLocaleString()}건</li>
        <li>
          오분류 건수: {misclassified.toLocaleString()}건
          {labels.length === 2 && ` (FP ${fp.toLocaleString()}건 + FN ${fn.toLocaleString()}건)`}
        </li>
        <li>오분류율: {misclassRate.toFixed(1)}%</li>
      </ul>
    </div>
  );
}
