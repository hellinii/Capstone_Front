import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { KpiResult, ValidationResult } from "../../../types/finalReport.types";
import { SectionTitle } from "../ui/SectionTitle";
import { cn } from "../../../utils/styling/styles";

const STATUS_CONFIG = {
  pass:    { icon: CheckCircle2,  color: "text-emerald-500", label: "통과" },
  warning: { icon: AlertTriangle, color: "text-amber-500",   label: "경고" },
  fail:    { icon: XCircle,       color: "text-red-500",     label: "오류" },
} as const;

interface DataValidationSectionProps {
  dataValidation: ValidationResult[];
  kpiResults: KpiResult[];
  totalSamples: number;
}

export function DataValidationSection({
  dataValidation,
  kpiResults,
  totalSamples,
}: DataValidationSectionProps) {
  const errorCount   = dataValidation.filter((r) => r.status === "fail").length;
  const warningCount = dataValidation.filter((r) => r.status === "warning").length;

  return (
    <section className="space-y-8 border-t border-slate-200 py-10">
      <SectionTitle number={6} title="시험 결과" />

      {/* 6.0 시험 수행 요약 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">시험 수행 요약</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-2 pr-4 text-left font-medium text-slate-500">항목</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-500">값</th>
              <th className="py-2 text-left font-medium text-slate-500">비고</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2.5 pr-4 font-semibold text-slate-700">총 검증 수행 건수</td>
              <td className="py-2.5 pr-4 font-semibold text-slate-900">{totalSamples.toLocaleString()}건</td>
              <td className="py-2.5 text-slate-500 text-xs">업로드 데이터 전체 행(row) 수 = 고유 ID 수</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2.5 pr-4 font-semibold text-slate-700">유효 예측 건수</td>
              <td className="py-2.5 pr-4 font-semibold text-slate-900">{totalSamples.toLocaleString()}건</td>
              <td className="py-2.5 text-slate-500 text-xs">누락값·오류 제외 후 실제 metric 산출에 사용된 건수</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2.5 pr-4 font-semibold text-slate-700">제외된 샘플 수</td>
              <td className="py-2.5 pr-4 text-slate-900">0건</td>
              <td className="py-2.5 text-slate-500 text-xs">누락값/오류로 인해 평가에서 제외된 건수</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2.5 pr-4 font-semibold text-slate-700">수행된 시험항목 수</td>
              <td className="py-2.5 pr-4 font-semibold text-slate-900">{kpiResults.length}개</td>
              <td className="py-2.5 text-slate-500 text-xs">
                선택된 Metric ID 목록: {kpiResults.map((r) => r.tcId).join(", ")}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 pr-4 font-semibold text-slate-700">데이터 검증 결과</td>
              <td className="py-2.5 pr-4 text-slate-900">
                오류 {errorCount}건 / 경고 {warningCount}건
              </td>
              <td className="py-2.5 text-slate-500 text-xs">상세 내역은 6.0.1 참조</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6.0.1 데이터 검증 상세 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">데이터 검증 상세 내역</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-2 pr-4 text-left font-medium text-slate-500">검증 항목</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-500 w-20">결과</th>
              <th className="py-2 text-left font-medium text-slate-500">처리 방식</th>
            </tr>
          </thead>
          <tbody>
            {dataValidation.map((row) => {
              const { icon: Icon, color, label } = STATUS_CONFIG[row.status];
              return (
                <tr key={row.checkName} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-2.5 pr-4 text-slate-700">{row.checkName}</td>
                  <td className="py-2.5 pr-4">
                    <span className={cn("flex items-center gap-1.5 font-medium", color)}>
                      <Icon className="size-4" />
                      {label}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600">{row.detail}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
