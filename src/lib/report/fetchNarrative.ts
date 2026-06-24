/**
 * fetchNarrative — /api/generate-narrative 호출 + 응답(snake_case) → 리포트 필드(camelCase) 매핑.
 *
 * graceful degradation: 호출 실패/비정상 응답 시 빈 서술을 반환한다(섹션이 "생성 예정" 안내 표시).
 * verdict/score 는 여기서 다루지 않는다 — 프론트 규칙(computeVerdict)이 권위를 가지며,
 * 호출부에서 ruleConclusion 과 병합한다(백엔드도 verdict 를 fact_sheet 값으로 강제함).
 */
import type {
  InterpretationData,
  NarrativeSource,
  RecommendationNarrative,
} from "../../types/finalReport.types";
import type { ReportRecommendation } from "../../types/report.types";
import type { NarrativeRequestPayload } from "./buildFactSheet";

export interface NarrativeFields {
  interpretation: InterpretationData;
  conclusionText: { benchmark: string; narrative: string; risks: string };
  recommendationNarrative: RecommendationNarrative;
  recommendations: ReportRecommendation[];
  /** 추적용: llm(LLM 생성) | fallback(규칙 폴백) | error(호출 실패) */
  source: NarrativeSource;
}

const EMPTY: NarrativeFields = {
  interpretation: { confusionAnalysis: "", distributionAnalysis: "" },
  conclusionText: { benchmark: "", narrative: "", risks: "" },
  recommendationNarrative: { dataQuality: "", modelOps: "" },
  recommendations: [],
  source: "error",
};

function normalizePriority(v: unknown): ReportRecommendation["priority"] {
  const s = String(v ?? "").toUpperCase();
  if (s === "HIGH" || s === "MEDIUM" || s === "LOW") return s;
  return "MEDIUM";
}

export async function fetchNarrative(
  payload: NarrativeRequestPayload,
): Promise<NarrativeFields> {
  try {
    const resp = await fetch("/api/generate-narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) return EMPTY;

    const n = await resp.json();
    return {
      interpretation: {
        confusionAnalysis: n.interpretation?.confusion_analysis ?? "",
        distributionAnalysis: n.interpretation?.distribution_analysis ?? "",
      },
      conclusionText: {
        benchmark: n.conclusion?.benchmark ?? "",
        narrative: n.conclusion?.narrative ?? "",
        risks: n.conclusion?.risks ?? "",
      },
      recommendationNarrative: {
        dataQuality: n.recommendation_narrative?.data_quality ?? "",
        modelOps: n.recommendation_narrative?.model_ops ?? "",
      },
      recommendations: Array.isArray(n.recommendations)
        ? n.recommendations.map((r: any) => ({
            priority: normalizePriority(r.priority),
            category: String(r.category ?? ""),
            action: String(r.action ?? ""),
            expectedImpact: String(r.expected_impact ?? ""),
          }))
        : [],
      source: n.meta?.source === "llm" ? "llm" : "fallback",
    };
  } catch {
    return EMPTY;
  }
}
