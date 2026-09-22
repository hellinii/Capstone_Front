/**
 * 한 모델의 버전별 평가를 나란히 놓는 화면.
 *
 * **아무 판정도 하지 않는다.** 증감 화살표·색·"개선됨" 같은 표기를 넣지 않았고,
 * "같은 데이터로 보입니다" 같은 문장도 없다. 두 가지 이유다.
 *   ① 숫자가 올랐다고 좋은 것인지는 모델과 용도를 아는 사람만 판단할 수 있다.
 *   ② "같은 데이터인가"는 우리가 확언할 수 없다 — 멀티레이블의 클래스 분포는
 *      레이블 등장 횟수라 `{A,B},{}` 와 `{A},{B}` 가 똑같이 `A:1, B:1` 로 보인다.
 * 그래서 표본 수·클래스 목록·클래스별 개수·파일명을 **사실 그대로** 위에 깔아두고,
 * 비교할 만한 상황인지는 사용자가 보고 정하게 한다.
 *
 * 파일명은 보여주되 판단 근거로 쓰지 않는다 — 같은 파일을 다른 이름으로 저장하는 일도,
 * 같은 이름의 다른 파일을 올리는 일도 흔하다.
 */
import { Link } from "react-router";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ConfusionMatrixChart } from "../report/sections/ConfusionMatrixChart";
import { formatCreatedAt } from "../../utils/format/format";
import { NOT_MEASURED, formatMetricCell } from "../../lib/report/metricValueFormat";
import type {
  ComparisonColumn,
  ComparisonPerClassMetric,
  ModelComparison as ModelComparisonData,
} from "../../lib/workspace/modelComparison";

export function ModelComparison({ comparison }: { comparison: ModelComparisonData }) {
  const { columns, metricRows, taskType } = comparison;

  // 멀티레이블은 한 샘플이 레이블 여러 개를 갖는다 — 합계가 표본 수를 넘으므로
  // '클래스별 개수'라고 부르면 사용자가 표본 수와 대조하다 혼란을 겪는다.
  const countsLabel = taskType === "multilabel" ? "Label occurrences" : "Samples per class";

  return (
    <div className="space-y-6">
      <Card className="rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Evaluation data</CardTitle>
          <p className="text-sm text-muted-foreground">
            What each version was measured on. Results are only comparable when these match — that
            call is yours to make.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-44 py-2 pr-4 text-left text-xs font-medium uppercase text-muted-foreground">
                    Property
                  </th>
                  {columns.map((column) => (
                    <th key={column.runId} className="min-w-[180px] py-2 pr-4 text-left">
                      <VersionHeading column={column} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <DatasetRow label="Samples" columns={columns}>
                  {(column) => (
                    <span className="font-mono tabular-nums">
                      {column.dataset.sampleCount === null
                        ? NOT_MEASURED
                        : column.dataset.sampleCount.toLocaleString()}
                    </span>
                  )}
                </DatasetRow>

                <DatasetRow label="Classes" columns={columns}>
                  {(column) =>
                    column.dataset.classLabels.length === 0 ? (
                      NOT_MEASURED
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {column.dataset.classLabels.map((label) => (
                          <Badge key={label} variant="outline" className="font-normal">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )
                  }
                </DatasetRow>

                <DatasetRow label={countsLabel} columns={columns}>
                  {(column) => <ClassCounts counts={column.dataset.classCounts} />}
                </DatasetRow>

                <DatasetRow label="File" columns={columns} last>
                  {(column) => (
                    <span className="break-all text-muted-foreground">
                      {column.dataset.fileName}
                    </span>
                  )}
                </DatasetRow>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Evaluation results</CardTitle>
          <p className="text-sm text-muted-foreground">
            Measured values per version, newest first. {NOT_MEASURED} means the metric was not
            selected or could not be measured in that run.
          </p>
        </CardHeader>
        <CardContent>
          {metricRows.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              No measured metrics are stored for this model yet. Open an evaluation to run it.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="w-44 py-2 pr-4 text-left text-xs font-medium uppercase text-muted-foreground">
                      Version
                    </th>
                    {metricRows.map((metric) => (
                      <th
                        key={metric.metricId}
                        className="min-w-[110px] py-2 pr-4 text-right text-xs font-medium text-muted-foreground"
                      >
                        <div className="font-mono uppercase">{metric.metricId}</div>
                        <div className="font-normal normal-case">{metric.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column) => (
                    <tr key={column.runId} className="border-b border-border/50 last:border-b-0">
                      <td className="py-3 pr-4 align-top">
                        <VersionHeading column={column} />
                      </td>
                      {metricRows.map((metric) => (
                        <td
                          key={metric.metricId}
                          className="py-3 pr-4 text-right align-top font-mono tabular-nums text-foreground"
                        >
                          {metric.metricId in column.metricValues
                            ? formatMetricCell(metric.metricId, column.metricValues[metric.metricId])
                            : NOT_MEASURED}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfusionMatrixSection columns={columns} />
      <PerClassSection columns={columns} metrics={comparison.perClassMetrics} />
    </div>
  );
}

/**
 * 버전별 오차 행렬(M21).
 *
 * 숫자 한 칸으로 줄일 수 없는 값이라 위 표에는 "See below" 만 들어간다. 여기서 실제
 * 행렬을 보여준다 — 어느 클래스가 어느 클래스로 새는지는 이 그림에만 있다.
 *
 * **가로가 아니라 세로로 쌓는다.** 행렬 하나가 클래스 수에 비례해 넓어져(4클래스면
 * 540px 남짓) 셋을 나란히 두면 화면 밖으로 밀린다. 가로 스크롤로 오가며 대조하느니
 * 위아래로 두는 편이 읽힌다.
 */
function ConfusionMatrixSection({ columns }: { columns: ComparisonColumn[] }) {
  const withMatrix = columns.filter((column) => column.confusionMatrix);
  if (withMatrix.length === 0) return null;

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Confusion matrices</CardTitle>
        <p className="text-sm text-muted-foreground">
          M21 has no single number, so it is drawn per version here. Only versions that selected it
          appear.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {withMatrix.map((column) => (
          <div key={column.runId} className="space-y-2">
            <VersionHeading column={column} />
            <ConfusionMatrixChart data={column.confusionMatrix!} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * 클래스별 세부 성능(M22 를 함께 고른 경우의 M2·M3·M4).
 *
 * 클래스가 행, 버전이 열이다. 위 결과 표와 축이 반대인데, 여기서 궁금한 것이
 * "어느 **클래스**가 나아졌나"라서 클래스를 세로로 세우는 편이 읽힌다.
 */
function PerClassSection({
  columns,
  metrics,
}: {
  columns: ComparisonColumn[];
  metrics: ComparisonPerClassMetric[];
}) {
  if (metrics.length === 0) return null;

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Per-class metrics</CardTitle>
        <p className="text-sm text-muted-foreground">
          M22 breaks these metrics down by class. {NOT_MEASURED} means that class was not measured
          in that run.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric) => (
          <div key={metric.metricId} className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              <span className="font-mono text-xs uppercase text-muted-foreground">
                {metric.metricId}
              </span>{" "}
              {metric.name}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="w-44 py-2 pr-4 text-left text-xs font-medium uppercase text-muted-foreground">
                      Class
                    </th>
                    {columns.map((column) => (
                      <th
                        key={column.runId}
                        className="min-w-[110px] py-2 pr-4 text-right text-xs font-medium text-muted-foreground"
                      >
                        {column.versionName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metric.rows.map((row) => (
                    <tr key={row.label} className="border-b border-border/50 last:border-b-0">
                      <td className="py-2 pr-4 align-top text-foreground">{row.label}</td>
                      {columns.map((column) => (
                        <td
                          key={column.runId}
                          className="py-2 pr-4 text-right align-top font-mono tabular-nums text-foreground"
                        >
                          {formatMetricCell(metric.metricId, row.values[column.runId])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** 버전 이름 + 평가 일시 + 열람 링크. 두 표가 같은 머리를 쓴다. */
function VersionHeading({ column }: { column: ComparisonColumn }) {
  const issued = column.reportId !== "";

  return (
    <div className="space-y-0.5">
      <Link
        to={issued ? `/report/${column.runId}` : `/report/${column.runId}/summary`}
        className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
      >
        {column.versionName}
      </Link>
      <div className="text-xs font-normal text-muted-foreground">
        {formatCreatedAt(column.createdAt)}
      </div>
    </div>
  );
}

function ClassCounts({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return <>{NOT_MEASURED}</>;

  return (
    <div className="space-y-0.5">
      {entries.map(([label, count]) => (
        <div key={label} className="flex justify-between gap-3 font-mono text-xs tabular-nums">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground">{count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function DatasetRow({
  label,
  columns,
  children,
  last = false,
}: {
  label: string;
  columns: ComparisonColumn[];
  children: (column: ComparisonColumn) => React.ReactNode;
  last?: boolean;
}) {
  return (
    <tr className={last ? "" : "border-b border-border/50"}>
      <td className="py-3 pr-4 align-top text-xs font-medium uppercase text-muted-foreground">
        {label}
      </td>
      {columns.map((column) => (
        <td key={column.runId} className="py-3 pr-4 align-top text-foreground">
          {children(column)}
        </td>
      ))}
    </tr>
  );
}
