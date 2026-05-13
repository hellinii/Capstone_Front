import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PrCurveChartProps {
  data: { recall: number[]; precision: number[] };
  auprc?: number;
}

export function PrCurveChart({ data, auprc }: PrCurveChartProps) {
  const points = data.recall.map((recall, i) => ({ recall, precision: data.precision[i] }));

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h3 className="text-sm font-semibold text-slate-700">PR Curve</h3>
        {auprc !== undefined && (
          <span className="text-xs text-slate-500">AUPRC: <strong>{auprc.toFixed(3)}</strong></span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="recall"
            type="number"
            domain={[0, 1]}
            tickCount={6}
            label={{ value: "Recall", position: "insideBottom", offset: -12, fontSize: 11, fill: "#94a3b8" }}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
          />
          <YAxis
            domain={[0, 1]}
            tickCount={6}
            label={{ value: "Precision", angle: -90, position: "insideLeft", offset: 12, fontSize: 11, fill: "#94a3b8" }}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
          />
          <Tooltip
            formatter={(v: number) => v.toFixed(3)}
            labelFormatter={(v: number) => `Recall: ${Number(v).toFixed(3)}`}
            contentStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="precision"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
