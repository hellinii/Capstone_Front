import type { FinalReportData } from "../../../types/finalReport.types";
import { ConfusionMatrixChart } from "./ConfusionMatrixChart";
import { RocCurveChart } from "./RocCurveChart";
import { PrCurveChart } from "./PrCurveChart";

interface ChartSectionProps {
  charts: FinalReportData["charts"];
}

export function ChartSection({ charts }: ChartSectionProps) {
  return (
    <div className="space-y-10 pt-8">
      <h3 className="text-sm font-semibold text-slate-700">시각화 자료</h3>

      {charts.confusionMatrix && (
        <ConfusionMatrixChart data={charts.confusionMatrix} />
      )}

      <div className="grid gap-10 md:grid-cols-2">
        {charts.rocCurve && (
          <RocCurveChart data={charts.rocCurve} auroc={0.962} />
        )}
        {charts.prCurve && (
          <PrCurveChart data={charts.prCurve} auprc={0.951} />
        )}
      </div>
    </div>
  );
}
