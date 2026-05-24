import type { ReportRecommendation } from "../../../types/report.types";
import type { RecommendationNarrative } from "../../../types/finalReport.types";
import { SectionTitle } from "../ui/SectionTitle";
import { cn } from "../../../utils/styling/styles";

const PRIORITY_CONFIG = {
  HIGH:   { label: "HIGH",   className: "border-red-200 bg-red-50 text-red-700" },
  MEDIUM: { label: "MEDIUM", className: "border-amber-200 bg-amber-50 text-amber-700" },
  LOW:    { label: "LOW",    className: "border-slate-200 bg-slate-50 text-slate-600" },
} as const;

interface RecommendSectionProps {
  recommendations: ReportRecommendation[];
  narrative: RecommendationNarrative;
}

export function RecommendSection({ recommendations, narrative }: RecommendSectionProps) {
  return (
    <section className="space-y-6 border-t border-slate-200 py-10">
      <SectionTitle number={9} title="기술 개선 권고안" />

      {/* 9.1 데이터셋 보완 및 품질 개선 전략 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">데이터셋 보완 및 품질 개선 전략</h3>
        <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-slate-700">"{narrative.dataQuality}"</p>
        </blockquote>
      </div>

      {/* 9.2 모델 고도화 및 운영 관리 가이드 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">모델 고도화 및 운영 관리 가이드</h3>
        <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-slate-700">"{narrative.modelOps}"</p>
        </blockquote>
      </div>

      {/* 권고 표 요약 */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="py-2 pr-3 text-left font-medium text-slate-500 w-24">우선순위</th>
            <th className="py-2 pr-4 text-left font-medium text-slate-500 w-28">분류</th>
            <th className="py-2 pr-4 text-left font-medium text-slate-500">권고 내용</th>
            <th className="py-2 text-left font-medium text-slate-500">기대 효과</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map((rec, i) => {
            const { label, className } = PRIORITY_CONFIG[rec.priority];
            return (
              <tr key={i} className="border-b border-slate-100 last:border-b-0 align-top">
                <td className="py-2.5 pr-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                      className,
                    )}
                  >
                    {label}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-xs text-slate-500">{rec.category}</td>
                <td className="py-2.5 pr-4 text-sm text-slate-800">{rec.action}</td>
                <td className="py-2.5 text-xs text-slate-500">{rec.expectedImpact}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
