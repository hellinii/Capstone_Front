import type { KpiResult } from "../../../types/finalReport.types";
import { MetricRow } from "../ui/MetricRow";
import { PassBadge } from "../ui/PassBadge";

interface KpiResultSectionProps {
  kpiResults: KpiResult[];
}

// 예시본 6.1 종합 핵심 성능 (KPI) 화이트리스트
const KPI_CORE_IDS = new Set(["M1", "M4", "M20", "M23"]);

export function KpiResultSection({ kpiResults }: KpiResultSectionProps) {
  const kpiCore   = kpiResults.filter((r) => KPI_CORE_IDS.has(r.tcId));
  const kpiDetail = kpiResults.filter((r) => !KPI_CORE_IDS.has(r.tcId));

  return (
    <div className="space-y-8 pt-8">
      {/* 6.1 종합 핵심 성능 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">종합 핵심 성능 (Key Performance Indicators)</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-2 pr-3 text-left font-medium text-slate-500 w-16">Metric ID</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-500">시험항목</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-500 w-28">산출 결과</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-500 w-24">합격 기준</th>
              <th className="py-2 text-left font-medium text-slate-500 w-24">판정</th>
            </tr>
          </thead>
          <tbody>
            {kpiCore.map((r) => (
              <MetricRow
                key={r.tcId}
                tcId={r.tcId}
                name={r.name}
                value={r.value}
                threshold={r.threshold}
                status={r.status}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 6.2 세부 시험항목별 결과 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">세부 시험항목별 결과</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-2 pr-3 text-left font-medium text-slate-500 w-16">Metric ID</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-500">시험항목</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-500 w-28">산출 결과</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-500 w-24">합격 기준</th>
              <th className="py-2 text-left font-medium text-slate-500 w-24">판정</th>
            </tr>
          </thead>
          <tbody>
            {kpiDetail.map((r) => (
              <MetricRow
                key={r.tcId}
                tcId={r.tcId}
                name={r.name}
                value={r.value}
                threshold={r.threshold}
                status={r.status}
              />
            ))}
          </tbody>
        </table>

        {/* Per-class 세부 결과 */}
        {kpiResults.some((r) => r.perClass?.length) && (
          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold text-slate-600">Per-class 세부 결과 (M2 / M3)</p>
            {kpiResults
              .filter((r) => r.perClass?.length)
              .map((r) => (
                <div key={r.tcId} className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">
                    {r.tcId} — {r.name}
                  </p>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-1.5 pr-4 text-left text-xs font-medium text-slate-400">클래스</th>
                        <th className="py-1.5 pr-4 text-left text-xs font-medium text-slate-400">값</th>
                        <th className="py-1.5 text-left text-xs font-medium text-slate-400">판정</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.perClass!.map((pc) => (
                        <tr key={pc.label} className="border-b border-slate-50 last:border-b-0">
                          <td className="py-1.5 pr-4 text-slate-700">{pc.label}</td>
                          <td className="py-1.5 pr-4 font-mono text-slate-900">{pc.value.toFixed(3)}</td>
                          <td className="py-1.5">
                            <PassBadge verdict={pc.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
