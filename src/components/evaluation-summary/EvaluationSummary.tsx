/**
 * 평가 결과 (Step 5) — 고른 지표의 **값만** 보여준다.
 *
 * **합격/불합격 판정은 여기 없다.** 목표값(`metricDetails[].targetValue`)은 성적서 구간에서
 * 입력하므로 이 시점엔 기준이 없다. `useReportData` 는 목표값이 없으면 `hasThreshold` 를
 * false 로 두고 status 를 기본값 "pass" 로 남기는데(useReportData.ts §1), 그것을 그대로
 * 배지로 띄우면 **아무 기준도 없이 전부 '합격'으로 보인다.** 그래서 status 를 읽지 않는다.
 *
 * 차트는 백엔드가 실제로 내려준 것만 그린다. `charts` 의 세 항목은 전부 `| null` 이고
 * (confusionMatrix=M21, rocCurve·prCurve=binary+확률+M9/M10), null 이면 카드를 숨긴다.
 * 빈 축이나 더미 곡선을 그리지 않는다.
 */
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ConfusionMatrixChart } from "../report/sections/ConfusionMatrixChart";
import { RocCurveChart } from "../report/sections/RocCurveChart";
import { PrCurveChart } from "../report/sections/PrCurveChart";
import type { FinalReportData, KpiResult } from "../../types/finalReport.types";
import {
  NOT_MEASURED,
  VISUAL_ONLY_HINT,
  VISUAL_ONLY_METRIC_IDS,
  formatMetricCell,
  formatMetricPercent,
  formatMetricValue,
} from "../../lib/report/metricValueFormat";

/**
 * 표기 규칙은 버전 비교 화면과 공유한다(lib/report/metricValueFormat.ts) — 같은 평가를
 * 두 화면에서 본 사용자가 서로 다른 숫자로 기억하지 않도록.
 */
function formatValue(result: KpiResult): string {
  if (result.status === "unavailable") return NOT_MEASURED;
  return formatMetricValue(result.value);
}

function formatPercent(result: KpiResult): string | null {
  if (result.status === "unavailable") return null;
  return formatMetricPercent(result.metricId, result.value);
}

/**
 * **비교 입구는 여기 없다.** 종전에는 "Compare versions" 버튼이 있었지만, 그것이 여는
 * 화면은 워크스페이스의 비교 화면과 **완전히 같은 것**이었다 — 지름길일 뿐 자기 역할이
 * 없었다. 게다가 비교는 어느 버전을 세울지 고르는 일에서 시작하는데(최대 3개), 그 선택은
 * 워크스페이스의 모델 카드에서만 할 수 있다. 고를 수 없는 자리에 둔 입구는 사용자를
 * 아무것도 고르지 않은 비교 화면으로 떨어뜨릴 뿐이라 걷어냈다.
 */
interface EvaluationSummaryProps {
  data: FinalReportData;
}

export function EvaluationSummary({ data }: EvaluationSummaryProps) {
  const { kpiResults, charts, meta, latency } = data;
  const sampleCount = resolveSampleCount(data);

  // 고른 지표는 **전부** 값 카드를 받는다.
  //
  // 종전에는 `perClass` 가 붙은 지표를 카드 목록에서 빼고 표로만 그렸다. 그런데
  // `perClass` 는 사용자가 **M22 를 같이 골랐을 때만** 붙는다(useReportData 의
  // `["M2","M3","M4"].includes(metricId) && success_metrics["M22"]`). 그 결과 같은
  // 데이터를 두 번 재도 M22 선택 여부에 따라 Precision 이 "47.6%" 로 보였다가
  // 클래스별 표로만 보여, 값이 달라진 것처럼 읽혔다(사용자 보고, 2026-09-20).
  //
  // 둘은 같은 측정이다 — M2 는 클래스별 정밀도의 macro 평균이라
  // (0.417+0.263+0.508+0.717)/4 = 0.476 으로 정확히 일치한다. 표는 그 **내역**이므로
  // 대표값을 대체하는 게 아니라 아래에 덧붙인다.
  const perClassResults = kpiResults.filter((r) => r.perClass?.length);

  return (
    <main className="px-8 pt-12 pb-24 max-w-[1344px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Evaluation results</h1>
        <p className="text-sm text-muted-foreground">
          Measured values for the metrics you selected. Pass/fail criteria are set later, when you
          prepare the official report.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{meta.taskTypeLabel}</Badge>
        {/* `datasetInfo.sampleCount` 는 사용자가 성적서 구간에서 손으로 적는 값이라
            평가만 한 run 에서는 0 이다. 서버가 확정한 검증 행 수를 먼저 쓰고, 확정값이
            하나도 없으면 배지 자체를 숨긴다 — "0 samples" 는 거짓이다. */}
        {sampleCount !== null && (
          <Badge variant="outline" className="font-mono tabular-nums">
            {sampleCount.toLocaleString()} samples
          </Badge>
        )}
        <Badge variant="outline" className="font-mono tabular-nums">
          {kpiResults.length} metrics
        </Badge>
      </div>

      {/* 지표 값 — 판정 열 없음 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpiResults.map((result) => {
          const percent = formatPercent(result);
          const isVisualOnly =
            VISUAL_ONLY_METRIC_IDS.has(result.metricId) && result.status !== "unavailable";

          return (
            <Card key={result.metricId}>
              <CardContent className="space-y-2 py-5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-muted-foreground">
                    {result.metricId}
                  </span>
                  <span className="text-sm font-medium text-foreground">{result.name}</span>
                </div>

                {/* 행렬·클래스별 표를 돌려주는 지표는 숫자가 없다. 0 을 인쇄하면
                    "Confusion Matrix 0.000" 이라는 없는 측정값이 생긴다. */}
                {isVisualOnly ? (
                  <p className="text-sm text-muted-foreground">
                    {VISUAL_ONLY_HINT[result.metricId] ?? "Shown below."}
                  </p>
                ) : (
                  /* 값은 하나만 보여준다. 종전에는 "47.6% 0.476" 처럼 같은 수를 두 번
                     적었는데, 한 화면에 두 표기가 나란히 있으면 읽는 사람이 둘을 다른
                     값으로 여기거나 어느 쪽이 참인지 되묻게 된다.
                     비율이 아닌 지표(M23 불균형비 등)는 percent 가 null 이라 원값이 나온다. */
                  <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                    {percent ?? formatValue(result)}
                  </span>
                )}

                {result.status === "unavailable" && (
                  <p className="text-xs text-amber-700">
                    Not measurable{result.errorMessage ? `: ${result.errorMessage}` : "."}
                  </p>
                )}

                {result.subMetrics && (
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-2 text-xs">
                    <SubMetric label="Precision" value={result.subMetrics.precision} />
                    <SubMetric label="Recall" value={result.subMetrics.recall} />
                    <SubMetric label="F1" value={result.subMetrics.f1Score} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 클래스별 내역 (M22 를 같이 고른 경우에만 붙는다). 위 카드의 대표값을
          대체하는 게 아니라 그 값이 어떻게 나왔는지를 펼쳐 보여준다. */}
      {perClassResults.map((result) => (
        <Card key={`${result.metricId}-per-class`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              <span className="font-mono text-xs uppercase text-muted-foreground">
                {result.metricId}
              </span>{" "}
              {result.name} by class
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              The card above shows the macro average of these values.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="py-2 pr-4 text-left text-xs font-medium uppercase text-muted-foreground">
                      Class
                    </th>
                    <th className="py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.perClass!.map((pc) => (
                    <tr key={pc.label} className="border-b border-border/50 last:border-b-0">
                      <td className="py-2 pr-4 text-foreground">{pc.label}</td>
                      {/* 바로 위 카드가 같은 지표를 47.6% 로 보여주는데 여기만 0.476 이면
                          같은 값이 다른 수로 읽힌다. 화면 표기는 한 규칙으로 맞춘다
                          (성적서는 "소수점 셋째 자리" 를 스스로 선언하므로 별개다). */}
                      <td className="py-2 text-right font-mono tabular-nums text-foreground">
                        {formatMetricCell(result.metricId, pc.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 차트 — 백엔드가 내려준 것만. null 이면 카드 자체를 렌더하지 않는다. */}
      {charts.confusionMatrix && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Confusion matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfusionMatrixChart data={charts.confusionMatrix} />
          </CardContent>
        </Card>
      )}

      {(charts.rocCurve || charts.prCurve) && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {charts.rocCurve && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">ROC curve</CardTitle>
              </CardHeader>
              <CardContent>
                <RocCurveChart data={charts.rocCurve} auroc={charts.rocCurve.auroc} />
              </CardContent>
            </Card>
          )}
          {charts.prCurve && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Precision-recall curve</CardTitle>
              </CardHeader>
              <CardContent>
                <PrCurveChart data={charts.prCurve} auprc={charts.prCurve.auprc} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {latency && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Inference latency</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SubMetric label="Mean" value={latency.mean} unit="ms" />
            <SubMetric label="P95" value={latency.p95} unit="ms" />
            <SubMetric label="P99" value={latency.p99} unit="ms" />
            <SubMetric label="Max" value={latency.max} unit="ms" />
          </CardContent>
        </Card>
      )}
    </main>
  );
}

/**
 * 실제로 평가된 행 수. 확정된 값이 하나도 없으면 null.
 *
 * 비교 화면(`lib/workspace/modelComparison.ts`)과 같은 우선순위를 쓴다 — 두 화면이
 * 서로 다른 표본 수를 말하면 어느 쪽이 참인지 알 수 없다.
 */
function resolveSampleCount(data: FinalReportData): number | null {
  const candidates = [
    data.validationSummary?.totalRows,
    data.charts?.confusionMatrix?.totalSamples,
    data.datasetInfo?.sampleCount,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function SubMetric({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm tabular-nums text-foreground">
        {value.toFixed(unit ? 1 : 3)}
        {unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}
