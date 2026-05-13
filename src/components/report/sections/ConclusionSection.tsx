import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { ConclusionData } from "../../../types/finalReport.types";
import { SectionTitle } from "../ui/SectionTitle";
import { cn } from "../../../utils/styling/styles";

const VERDICT_CONFIG = {
  PASS: {
    label: "최종 합격",
    icon: CheckCircle2,
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    iconColor: "text-emerald-500",
  },
  CONDITIONAL_PASS: {
    label: "조건부 합격",
    icon: AlertTriangle,
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    iconColor: "text-amber-500",
  },
  FAIL: {
    label: "최종 불합격",
    icon: XCircle,
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    iconColor: "text-red-500",
  },
} as const;

interface ConclusionSectionProps {
  conclusion: ConclusionData;
}

export function ConclusionSection({ conclusion }: ConclusionSectionProps) {
  const config = VERDICT_CONFIG[conclusion.verdict];
  const Icon = config.icon;

  return (
    <section className="space-y-8 border-t border-slate-200 py-10">
      <SectionTitle number={8} title="종합 진단 소견" />

      {/* 판정 배너 */}
      <div className={cn("rounded-xl border p-5 flex items-center gap-4", config.bg)}>
        <Icon className={cn("size-8 shrink-0", config.iconColor)} />
        <div className="flex-1">
          <p className={cn("text-lg font-bold", config.text)}>{config.label}</p>
        </div>
        <span className="font-mono text-2xl font-bold text-slate-700">
          {conclusion.score.toFixed(1)}%
        </span>
      </div>

      {/* 8.1 도메인 성능 벤치마크 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">도메인 성능 벤치마크</h3>
        <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-slate-700">
            "{conclusion.benchmark}"
          </p>
        </blockquote>
      </div>

      {/* 8.2 전반적 성능 및 일반화 능력 총평 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">전반적 성능 및 일반화 능력 총평</h3>
        <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-slate-700">
            "{conclusion.narrative}"
          </p>
        </blockquote>
      </div>

      {/* 8.3 기술적 취약점 및 잠재적 리스크 요약 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">기술적 취약점 및 잠재적 리스크 요약</h3>
        <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-slate-700">
            "{conclusion.risks}"
          </p>
        </blockquote>
      </div>
    </section>
  );
}
