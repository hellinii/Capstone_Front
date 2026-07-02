/**
 * 데이터셋 분포 사전 진단 문구 생성 (3절).
 *
 * 가짜 MOCK 진단문("학습-평가 비율 0.80:0.20, Negative 61.8%..." 등) 대신
 * 실제 클래스 분포(metadata.class_distribution)와 불균형 비율(TC23 또는 직접 산출)을
 * 기반으로 사실만 서술한다. (LLM 아님 — 규칙 기반 사실 진술)
 */

export function buildDatasetDiagnosis(
  metadata: { class_distribution?: Record<string, number> } | null | undefined,
  imbalanceRatio?: number,
  droppedRows: number = 0,
): string {
  const dist: Record<string, number> = metadata?.class_distribution ?? {};
  const entries = Object.entries(dist).filter(([, count]) => typeof count === "number");

  const parts: string[] = [];

  if (droppedRows > 0) {
    parts.push(
      `결측치(NaN) 제거 전처리로 인해 전체 행 중 ${droppedRows.toLocaleString()}개 샘플이 평가에서 제외되었다.`,
    );
  }

  if (entries.length > 0) {
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const distText = entries
      .map(
        ([label, count]) =>
          `${label} ${count.toLocaleString()}건(${total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"}%)`,
      )
      .join(", ");
    parts.push(`평가 데이터셋은 총 ${total.toLocaleString()}건이며, 클래스별 분포는 ${distText}이다.`);

    const counts = entries.map(([, count]) => count);
    const minCount = Math.min(...counts);
    const ratio =
      typeof imbalanceRatio === "number"
        ? imbalanceRatio
        : minCount > 0
          ? Math.max(...counts) / minCount
          : 0;

    if (ratio > 0) {
      const balanced = ratio <= 1.5;
      parts.push(
        `클래스 불균형 비율(Imbalance Ratio)은 ${ratio.toFixed(2)}로, ` +
          (balanced
            ? "허용 기준(≤ 1.50) 이내의 균형 상태이다."
            : "허용 기준(1.50)을 초과하여 클래스 불균형에 따른 성능 지표 해석에 주의가 필요하다."),
      );
    }
  }

  if (parts.length === 0) {
    return "데이터셋 분포 정보가 제공되지 않았습니다.";
  }

  return parts.join(" ");
}
