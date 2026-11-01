/**
 * 서술 작업 요청(`POST /api/narrative/jobs` 본문) 조립 — 한 곳(판 4 라운드 계획 2.2).
 *
 * 성적서 훅(`useReportData`)과 계약 시험(`factSheetContract.test.ts`)이 이 함수 하나를 쓴다. 종전에는 두 곳이 같은 모양을 따로
 * 적어, 한쪽에만 칸이 생겨도 계약 시험이 실제 요청을 보지 못했다.
 *
 * - 판 신호 `report_edition` 은 바탕 성적서의 찍힌 판(`usesSchema4`)으로만 정한다 — 플래그를 다시 읽지 않는다(판 결정은
 *   `newRunContentSchema()` 한 곳). 판 3 요청에는 키가 없다(백엔드 기본 3 — 판 3 요청 바이트가 지금과 같다).
 * - 키 순서는 task_type · report_purpose · (report_edition) · fact_sheet · (client_inputs).
 * - 본문이 백엔드 상한(2MB)에 가까우면 클래스 단위 칸을 비운다(`fitNarrativePayload`, 유-11).
 * - 판 4 요청에는 심판 읽기 재료를 맨 끝 키로 붙인다(`attachJudgeMaterial`, 심판 라운드 J2). 재료가 상한을 넘거나 붙이면 본문
 *   예산을 넘으면 붙이지 않는다 — 서술은 그대로 가고 심판만 보류(재료 없음)가 된다(413 막다른 길·facts 줄이기로 가지 않게).
 */
import type { FinalReportData } from "../../types/finalReport.types";
import type { FactSheet, NarrativeRequestPayload } from "./buildFactSheet";
import { fitNarrativePayload, payloadBytes } from "./factSheetFit";
import { NARRATIVE_BODY_BUDGET_BYTES } from "./factSheetLimits";
import { buildJudgeMaterialEd4, MAX_JUDGE_MATERIAL_CHARS } from "./edition4/judgeMaterialEd4";
import { usesSchema4 } from "./normalizeReportContent";

export interface NarrativeRequestParts {
  /** 작업 유형(`resolveTaskType` 을 거친 값). */
  taskType: string;
  /** `assembleEvaluatedReport` 가 만든(미리 자른) 사실 시트. */
  factSheet: FactSheet;
  /** 고객이 제공한 입력(`buildClientInputs`). 없으면 키를 두지 않는다. */
  clientInputs?: Record<string, unknown>;
}

export function buildNarrativeRequest(
  baseReport: Pick<FinalReportData, "contentSchema" | "evalScope">,
  parts: NarrativeRequestParts,
): NarrativeRequestPayload {
  return fitNarrativePayload({
    task_type: parts.taskType,
    report_purpose: baseReport.evalScope.reportPurposeKey,
    ...(usesSchema4(baseReport) ? { report_edition: 4 as const } : {}),
    fact_sheet: parts.factSheet,
    ...(parts.clientInputs ? { client_inputs: parts.clientInputs } : {}),
  });
}

/**
 * 판 4 요청에 심판 읽기 재료를 붙인다. `report` 는 이 요청으로 만든 1단계 성적서(보낸 facts 를 담은 저장본 — 화면이 그리는 값과
 * 같아야 재료 글자가 인쇄 글과 같다). 판 3 요청이면 그대로 돌려준다(판 3 요청 바이트가 지금과 같다).
 */
export function attachJudgeMaterial(payload: NarrativeRequestPayload, report: FinalReportData): NarrativeRequestPayload {
  if (payload.report_edition !== 4) return payload;
  const material = buildJudgeMaterialEd4(report);
  if (JSON.stringify(material).length > MAX_JUDGE_MATERIAL_CHARS) return payload;
  const withMaterial = { ...payload, judge_material: material };
  return payloadBytes(withMaterial) <= NARRATIVE_BODY_BUDGET_BYTES ? withMaterial : payload;
}
