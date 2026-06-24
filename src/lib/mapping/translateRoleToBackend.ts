/**
 * 프론트 컬럼 역할(confirmedRole) → 백엔드 ColumnRole 문자열 변환.
 *
 * 평가(useReportData → /api/evaluate)와 검증(DataValidation → /api/validate-data)
 * 양쪽에서 공유한다. 과거 두 곳에 동일 로직이 복사되어 있어 latency 역할이 한쪽에만
 * 반영되는 drift 버그가 발생했으므로, 단일 출처로 통합한다.
 */
export function translateRoleToBackend(role: string | null, taskType: string): string {
  if (!role) return "ignore";
  if (role === "id") return "sample_id";
  if (role === "ignore") return "ignore";
  if (role === "latency") return "latency"; // 모든 task_type 공통 (선택)

  if (taskType === "binary") {
    if (role === "y_true") return "y_true";
    if (role === "y_pred") return "y_pred";
    if (role === "score") return "score_positive";
  } else if (taskType === "multiclass") {
    if (role === "y_true") return "y_true";
    if (role === "y_pred") return "y_pred";
    if (role === "prob_class_*") return "prob_per_class";
  } else if (taskType === "multilabel") {
    if (role === "y_true") return "true_labels";
    if (role === "y_pred") return "pred_labels";
    if (role === "prob_label_*") return "score_per_label";
  }
  return "ignore";
}
