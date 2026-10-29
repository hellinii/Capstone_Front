/**
 * 성적서 인쇄(PDF)·발급·정정 발급을 잠글지 — 판정 지점 한 곳(심판 라운드 J6, 계획 14-5).
 *
 * 부르는 곳은 셋이다: 성적서 화면(`pages/report/Report.tsx` — 버튼과 잠금 이유), 발급 훅(`hooks/useIssuance.ts` — 버튼 밖에서
 * 부르는 길), 인쇄 화면(`hooks/useReportData.ts` 의 `useStoredReport`). 셋이 따로 가르면 화면은 잠겼는데 인쇄 탭은 열리는
 * 식의 자기모순이 난다(라운드 함정 "판정 지점 이중화").
 *
 * 규칙
 * - 서술이 끝나지 않았거나(done·held 가 아님) 완성본이 아니면 잠근다 — 판 3 도 지금처럼.
 * - 판 4 성적서는 심판 묶음이 gate "passed" 일 때만 연다. 묶음이 없거나 모양이 틀리면(옛 백엔드 응답 등) "심판 기록 없음",
 *   gate "held" 면 "발급 보류"로 잠근다(닫힌 쪽 기본값 — 심판 설계 5.5 "검증 안 된 보고서는 어떤 경우에도 발급하지 않는다").
 * - 판 판정은 백엔드 서버 발급 검사(`app/issuance/judge_gate.content_is_edition4`)와 같은 닫힌 쪽 규칙이다: contentSchema 가 없으면
 *   판 1, 정수 1·2·3 이면 판 1~3, 그 밖의 값은 모두 판 4 로 본다.
 */
import type { FinalReportData } from "../../types/finalReport.types";

export type ReportLockReason = "narrative" | "judge_held" | "judge_missing";

/** 서술 상태(성적서 훅의 `narrative.phase`). */
export type LockPhase = "none" | "pending" | "done" | "held" | "failed";

/** 판 4 성적서 데이터인가 — 백엔드 발급 검사와 같은 닫힌 쪽 규칙. */
export function isEdition4Content(data: Pick<FinalReportData, "contentSchema">): boolean {
  const schema: unknown = data.contentSchema;
  if (schema === undefined || schema === null) return false;
  return !(typeof schema === "number" && Number.isInteger(schema) && schema >= 1 && schema <= 3);
}

/** 잠금 이유. 열려 있으면 null. */
export function reportLock(
  phase: LockPhase,
  data: Pick<FinalReportData, "contentSchema" | "isEvaluated" | "judge"> | null | undefined,
): ReportLockReason | null {
  if (!data || (phase !== "done" && phase !== "held") || !data.isEvaluated) return "narrative";
  if (!isEdition4Content(data)) return null;
  const gate = data.judge?.gate;
  if (gate === "passed" && phase === "done") return null;
  if (gate === "held" || gate === "passed") return "judge_held";
  return "judge_missing";
}
