/**
 * 한 모델의 여러 평가를 나란히 놓기 위한 데이터 조립.
 *
 * 왜 필요한가 — 워크스페이스의 평가는 일회성이 아니다. 모델을 고치고 다시 재고,
 * 또 고치고 다시 재는 일이 반복된다. 그 이력을 한 화면에서 보지 못하면 사용자는
 * 성적서를 여러 개 띄워놓고 눈으로 대조하게 된다.
 *
 * **판정하지 않는다.** 증감 화살표도, 색도, "같은 데이터로 보입니다" 같은 문장도 넣지
 * 않는다. 숫자가 올랐다고 좋은 것인지는 모델을 아는 사람만 안다. 특히 "같은 데이터인가"는
 * 확언할 수 없다 — 멀티레이블의 `class_distribution` 은 레이블 등장 횟수라
 * `{A,B},{}` 와 `{A},{B}` 가 똑같이 `A:1, B:1` 로 보인다. 그래서 사실만 나열하고
 * 판단은 사용자에게 남긴다.
 */
import type { TaskType } from "../../data/evaluationData";
import type { ConfusionMatrixData } from "../../types/report.types";
import type { WorkspaceEvaluationRun } from "../../types/workspace.types";

export interface ModelGroup {
  modelName: string;
  /** 최신순. */
  runs: WorkspaceEvaluationRun[];
  /** 가장 최근 평가 시각(ISO). */
  latestAt: string;
}

export interface ComparisonDataset {
  /** 실제로 평가된 행 수. 확정된 값이 없으면 null(0 을 '0행'으로 읽히지 않게). */
  sampleCount: number | null;
  classLabels: string[];
  /** 클래스(멀티레이블은 레이블)별 등장 횟수. 없으면 빈 객체. */
  classCounts: Record<string, number>;
  fileName: string;
}

export interface ComparisonColumn {
  runId: string;
  versionName: string;
  createdAt: string;
  /** 성적서를 발급했으면 성적서 번호, 아니면 빈 문자열. */
  reportId: string;
  dataset: ComparisonDataset;
  /** metricId → 측정값. 측정 불가(unavailable)거나 안 고른 지표는 없거나 null. */
  metricValues: Record<string, number | null>;
  /**
   * 오차 행렬(M21). 그 지표를 고른 평가에만 있다.
   *
   * 숫자 표에는 실을 수 없는 값이라(행렬이다) 표 아래에 버전별로 따로 그린다 —
   * 종전에는 스칼라가 없어 0 으로 남은 값이 "0.000" 으로 인쇄됐다.
   */
  confusionMatrix: ConfusionMatrixData | null;
}

export interface ComparisonMetricRow {
  metricId: string;
  name: string;
}

/**
 * 클래스별 세부 성능(M22 를 함께 고른 경우의 M2·M3·M4).
 *
 * 숫자 하나로 줄일 수 없어 비교 표에 실리지 못하던 값이다. 클래스를 행으로, 버전을
 * 열로 놓아 "어느 클래스에서 나아졌나"를 볼 수 있게 한다.
 */
export interface ComparisonPerClassMetric {
  metricId: string;
  name: string;
  /** 클래스 라벨별 행. `values` 는 runId → 값(그 버전에 없으면 null). */
  rows: Array<{ label: string; values: Record<string, number | null> }>;
}

export interface ModelComparison {
  modelName: string;
  taskType: TaskType;
  /** 최신순(왼쪽이 최신). */
  columns: ComparisonColumn[];
  /** 어느 한 평가에라도 등장한 지표의 합집합. */
  metricRows: ComparisonMetricRow[];
  /** 어느 한 평가에라도 클래스별 내역이 있는 지표. 없으면 빈 배열. */
  perClassMetrics: ComparisonPerClassMetric[];
}

/**
 * 한 번에 비교할 수 있는 평가의 최대 개수.
 *
 * 상한이 필요한 이유는 화면이다 — 위쪽 '평가 데이터' 표는 run 을 **열**로 세우므로
 * 개수가 늘면 가로로 자란다. 10개면 2,000px 를 넘겨 사실상 읽을 수 없다.
 * 셋이면 한 화면에 들어오고, 사람이 한눈에 대조할 수 있는 폭도 대체로 여기까지다.
 */
export const MAX_COMPARE_RUNS = 3;

/**
 * URL 의 `?runs=a,b,c` 를 id 목록으로 읽는다. 값이 없으면 null(= 사용자가 고르지 않음).
 *
 * 선택을 URL 에 싣는 이유: 새로고침·뒤로가기·링크 공유가 전부 살아난다. 컴포넌트
 * 상태에만 두면 비교 화면을 한 번 벗어나는 순간 고른 것이 사라진다.
 */
export function parseRunIds(param: string | null): string[] | null {
  if (!param) return null;
  const ids = param.split(",").map((id) => id.trim()).filter(Boolean);
  return ids.length > 0 ? ids : null;
}

/**
 * 비교할 run 을 고른다. 항상 최신순이고 절대 `MAX_COMPARE_RUNS` 를 넘지 않는다.
 *
 * 고르지 않았으면 **최근 것부터 셋**을 보여준다. 빈 화면을 내미는 것보다 낫고,
 * 어떤 경로로 들어와도 표가 무너지지 않는다(평가 결과 화면의 바로가기 포함).
 * 요청한 id 가 하나도 맞지 않으면(지운 평가의 오래된 링크) 같은 기본값으로 떨어진다 —
 * 열이 0개인 표를 그리느니 최근 것을 보여주는 편이 낫다.
 */
export function selectComparisonRuns(
  runs: WorkspaceEvaluationRun[],
  requestedIds: string[] | null,
): WorkspaceEvaluationRun[] {
  const sorted = [...runs].sort(byCreatedAtDesc);
  if (!requestedIds || requestedIds.length === 0) {
    return sorted.slice(0, MAX_COMPARE_RUNS);
  }

  const wanted = new Set(requestedIds);
  const picked = sorted.filter((run) => wanted.has(run.id));
  if (picked.length === 0) return sorted.slice(0, MAX_COMPARE_RUNS);

  return picked.slice(0, MAX_COMPARE_RUNS);
}

/** 평가를 모델명으로 묶는다. 그룹도 그룹 안의 run 도 최신순. */
export function groupRunsByModel(runs: WorkspaceEvaluationRun[]): ModelGroup[] {
  const byName = new Map<string, WorkspaceEvaluationRun[]>();

  for (const run of runs) {
    const key = run.modelName.trim() || "Untitled model";
    const bucket = byName.get(key);
    if (bucket) bucket.push(run);
    else byName.set(key, [run]);
  }

  return [...byName.entries()]
    .map(([modelName, groupRuns]) => {
      const sorted = [...groupRuns].sort(byCreatedAtDesc);
      return { modelName, runs: sorted, latestAt: sorted[0]?.createdAt ?? "" };
    })
    .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}

/** 모델명으로 run 을 고른다. URL 세그먼트로 오가므로 앞뒤 공백은 무시한다. */
export function findRunsForModel(
  runs: WorkspaceEvaluationRun[],
  modelName: string,
): WorkspaceEvaluationRun[] {
  const target = modelName.trim();
  return runs.filter((run) => (run.modelName.trim() || "Untitled model") === target);
}

export function buildModelComparison(
  modelName: string,
  runs: WorkspaceEvaluationRun[],
): ModelComparison {
  const sorted = [...runs].sort(byCreatedAtDesc);
  const columns = sorted.map(toColumn);

  // 지표 행은 합집합이다. 어떤 버전에서만 고른 지표가 있어도 행이 사라지면 안 된다 —
  // 그 칸은 '측정 안 함'이라는 사실 자체가 비교 대상이다.
  const seen = new Map<string, string>();
  for (const run of sorted) {
    for (const kpi of run.reportData?.kpiResults ?? []) {
      if (!seen.has(kpi.metricId)) seen.set(kpi.metricId, kpi.name);
    }
  }

  const metricRows = [...seen.entries()]
    .map(([metricId, name]) => ({ metricId, name }))
    .sort((a, b) => metricOrder(a.metricId) - metricOrder(b.metricId));

  return {
    modelName,
    taskType: columns[0]
      ? (runs.find((r) => r.id === columns[0].runId)?.reportData?.meta?.taskType ?? "binary")
      : "binary",
    columns,
    metricRows,
    perClassMetrics: buildPerClassMetrics(sorted),
  };
}

/**
 * 클래스별 내역을 지표별로 모은다. 클래스 목록도 지표 목록도 **합집합**이다 —
 * 버전마다 고른 지표가 다르거나 데이터에 없던 클래스가 생겨도 행이 사라지면 안 된다.
 */
function buildPerClassMetrics(sortedRuns: WorkspaceEvaluationRun[]): ComparisonPerClassMetric[] {
  const metrics = new Map<
    string,
    { name: string; labels: string[]; byRun: Record<string, Record<string, number>> }
  >();

  for (const run of sortedRuns) {
    for (const kpi of run.reportData?.kpiResults ?? []) {
      if (!kpi.perClass?.length) continue;

      let entry = metrics.get(kpi.metricId);
      if (!entry) {
        entry = { name: kpi.name, labels: [], byRun: {} };
        metrics.set(kpi.metricId, entry);
      }

      const perLabel: Record<string, number> = {};
      for (const item of kpi.perClass) {
        if (!entry.labels.includes(item.label)) entry.labels.push(item.label);
        perLabel[item.label] = item.value;
      }
      entry.byRun[run.id] = perLabel;
    }
  }

  return [...metrics.entries()]
    .sort(([a], [b]) => metricOrder(a) - metricOrder(b))
    .map(([metricId, entry]) => ({
      metricId,
      name: entry.name,
      rows: entry.labels.map((label) => ({
        label,
        values: Object.fromEntries(
          sortedRuns.map((run) => [run.id, entry.byRun[run.id]?.[label] ?? null]),
        ),
      })),
    }));
}

function toColumn(run: WorkspaceEvaluationRun): ComparisonColumn {
  const report = run.reportData;
  const metricValues: Record<string, number | null> = {};

  for (const kpi of report?.kpiResults ?? []) {
    // 측정 불가는 0 이 아니다. null 로 남겨 화면이 '—' 로 그리게 한다.
    metricValues[kpi.metricId] =
      kpi.status === "unavailable" || typeof kpi.value !== "number" ? null : kpi.value;
  }

  const classCounts = run.workflowSnapshot?.metadata?.class_distribution ?? {};
  const labelsFromCounts = Object.keys(classCounts);

  return {
    runId: run.id,
    versionName: run.versionName || "—",
    createdAt: run.createdAt,
    reportId: run.reportId || "",
    dataset: {
      // 표본 수의 참값은 서버가 확정한 검증 행 수다. `datasetInfo.sampleCount` 는
      // 사용자가 성적서 구간에서 손으로 적는 값이라 평가만 한 run 에서는 0 이다.
      sampleCount:
        firstPositive([
          report?.validationSummary?.totalRows,
          report?.charts?.confusionMatrix?.totalSamples,
          report?.datasetInfo?.sampleCount,
        ]) ?? null,
      // 분포에서 나온 클래스 목록이 y_true 실측이라 우선한다.
      classLabels: labelsFromCounts.length ? labelsFromCounts : (report?.datasetInfo?.classLabels ?? []),
      classCounts,
      fileName: report?.datasetInfo?.fileName || "—",
    },
    metricValues,
    confusionMatrix: report?.charts?.confusionMatrix ?? null,
  };
}

function byCreatedAtDesc(a: WorkspaceEvaluationRun, b: WorkspaceEvaluationRun) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function firstPositive(candidates: Array<number | undefined | null>): number | null {
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

/** "M7" → 7. ISO/IEC TS 4213 의 지표 번호순으로 행을 세운다. */
function metricOrder(metricId: string): number {
  const digits = metricId.match(/\d+/);
  return digits ? Number(digits[0]) : Number.MAX_SAFE_INTEGER;
}
