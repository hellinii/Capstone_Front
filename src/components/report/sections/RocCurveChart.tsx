import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface RocCurveChartProps {
  data: { fpr: number[]; tpr: number[] };
  auroc?: number;
}

export function RocCurveChart({ data, auroc }: RocCurveChartProps) {
  const points = data.fpr.map((fpr, i) => ({ fpr, tpr: data.tpr[i] }));

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h3 className="text-sm font-semibold text-slate-700">ROC Curve</h3>
        {auroc !== undefined && (
          <span className="text-xs text-slate-500">AUROC: <strong>{auroc.toFixed(3)}</strong></span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            tickCount={6}
            label={{ value: "FPR (False Positive Rate)", position: "insideBottom", offset: -12, fontSize: 11, fill: "#94a3b8" }}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
          />
          <YAxis
            domain={[0, 1]}
            tickCount={6}
            label={{ value: "TPR (True Positive Rate)", angle: -90, position: "insideLeft", offset: 12, fontSize: 11, fill: "#94a3b8" }}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
          />
          <Tooltip
            formatter={(v: number) => v.toFixed(3)}
            labelFormatter={(v: number) => `FPR: ${Number(v).toFixed(3)}`}
            contentStyle={{ fontSize: 12 }}
          />
          {/* Random classifier baseline */}
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            stroke="#cbd5e1"
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="tpr"
            stroke="#0f766e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
