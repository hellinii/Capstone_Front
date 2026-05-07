/**
 * 컬럼 매핑 헬퍼
 *
 * 이 모듈은 Step 5 (Column Mapping) 전용 유틸리티 함수들을 제공합니다.
 * 매핑 상태를 기반으로 시각적 상태 라벨(예: "Missing", "Conflict", "Matched")과
 * 디자인 톤 색상을 계산합니다.
 */
import type { RequiredColumnDisplay } from "../../data/evaluationData";
import type { MappingRow } from "../../types/mapping.types";

/**
 * Get a human-readable status label for a required column role based on how many columns map to it.
 */
export function getRoleStatusLabel(role: RequiredColumnDisplay, matchedCount: number) {
  if (matchedCount === 0) {
    return { label: "Missing", tone: "destructive" as const };
  }
  if (role.code === "prob_class_*" || role.code === "prob_label_*") {
    return { label: `${matchedCount} mapped`, tone: "secondary" as const };
  }
  if (matchedCount > 1) {
    return { label: "Conflict", tone: "destructive" as const };
  }
  return { label: "Mapped", tone: "secondary" as const };
}

/**
 * Determine the visual match state for a single mapping row.
 */
export function getRowMatchState(row: MappingRow, duplicate: boolean) {
  if (duplicate) {
    return { label: "Conflict", tone: "destructive" as const };
  }
  if (row.confirmedRole === null) {
    return { label: "Unmapped", tone: "destructive" as const };
  }
  if (row.modified) {
    return { label: "Changed", tone: "secondary" as const };
  }
  if (row.warnings.length > 0) {
    return { label: "Needs Review", tone: "outline" as const };
  }
  return { label: "Matched", tone: "secondary" as const };
}
