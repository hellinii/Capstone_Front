/**
 * 지표 값과 목표(임계)값을 방향성에 맞게 비교해 합·불(pass/fail)을 판정.
 *
 * - higherIsBetter=true(기본):  값 ≥ 목표 → pass  (목표=하한)
 * - higherIsBetter=false:       값 ≤ 목표 → pass  (목표=상한, 낮을수록 좋은 지표)
 *
 * 방향성의 단일 출처는 evaluationData.ts 의 MetricDefinition.higherIsBetter 다.
 */
export function evaluateStatus(
  value: number,
  target: number,
  higherIsBetter: boolean,
): "pass" | "fail" {
  const ok = higherIsBetter ? value >= target : value <= target;
  return ok ? "pass" : "fail";
}
