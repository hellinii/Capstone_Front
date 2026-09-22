import { describe, it, expect } from "vitest";
import {
  MAX_COMPARE_RUNS,
  buildModelComparison,
  findRunsForModel,
  groupRunsByModel,
  parseRunIds,
  selectComparisonRuns,
} from "./modelComparison";
import type { WorkspaceEvaluationRun } from "../../types/workspace.types";

/**
 * 비교 화면은 **사실만** 싣는다. 여기 테스트가 고정하는 것은 세 가지다.
 *   ① 측정 불가/미선택을 0 으로 읽지 않는다
 *   ② 버전마다 고른 지표가 달라도 행이 사라지지 않는다(합집합)
 *   ③ 표본 수는 사용자가 적은 값이 아니라 서버 검증 행 수를 쓴다
 */
function makeRun(over: Partial<WorkspaceEvaluationRun> & { id: string }): WorkspaceEvaluationRun {
  return {
    workspaceId: "ws-1",
    modelName: "Face recognizer",
    versionName: "v1.0.0",
    reportId: "",
    createdAt: "2026-09-01T00:00:00.000Z",
    workflowSnapshot: snapshotWith({}),
    reportData: reportWith({}),
    ...over,
  };
}

/** 비교가 읽는 필드만 담은 부분 리포트. 전체를 채우면 테스트가 읽히지 않는다. */
function reportWith(over: Record<string, unknown>) {
  return over as unknown as WorkspaceEvaluationRun["reportData"];
}

/** 비교가 읽는 필드만 담은 부분 스냅샷. */
function snapshotWith(over: Record<string, unknown>) {
  return over as unknown as WorkspaceEvaluationRun["workflowSnapshot"];
}

describe("groupRunsByModel", () => {
  it("같은 모델명끼리 묶고 최신 평가가 있는 그룹을 앞에 둔다", () => {
    const groups = groupRunsByModel([
      makeRun({ id: "a", modelName: "Face", createdAt: "2026-09-01T00:00:00.000Z" }),
      makeRun({ id: "b", modelName: "Defect", createdAt: "2026-09-05T00:00:00.000Z" }),
      makeRun({ id: "c", modelName: "Face", createdAt: "2026-09-10T00:00:00.000Z" }),
    ]);

    expect(groups.map((g) => g.modelName)).toEqual(["Face", "Defect"]);
    expect(groups[0].runs.map((r) => r.id)).toEqual(["c", "a"]);
    expect(groups[0].latestAt).toBe("2026-09-10T00:00:00.000Z");
  });

  it("이름이 비어 있는 run 은 'Untitled model' 로 묶는다", () => {
    const groups = groupRunsByModel([makeRun({ id: "a", modelName: "  " })]);
    expect(groups[0].modelName).toBe("Untitled model");
  });

  it("findRunsForModel 은 앞뒤 공백을 무시한다(URL 왕복 대비)", () => {
    const runs = [makeRun({ id: "a", modelName: " Face " }), makeRun({ id: "b", modelName: "Defect" })];
    expect(findRunsForModel(runs, "Face").map((r) => r.id)).toEqual(["a"]);
  });
});

describe("buildModelComparison — 열(버전)", () => {
  it("최신 버전이 첫 열이다", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({ id: "old", versionName: "v1.0.0", createdAt: "2026-09-01T00:00:00.000Z" }),
      makeRun({ id: "new", versionName: "v1.1.0", createdAt: "2026-09-10T00:00:00.000Z" }),
    ]);

    expect(comparison.columns.map((c) => c.versionName)).toEqual(["v1.1.0", "v1.0.0"]);
  });

  it("표본 수는 서버 검증 행 수를 쓴다(사용자가 적은 값이 아니라)", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({
        id: "a",
        reportData: reportWith({
          validationSummary: { totalRows: 200, validRows: 198, excludedRows: 2 },
          datasetInfo: { sampleCount: 0, classLabels: [], fileName: "eval.csv" },
        }),
      }),
    ]);

    expect(comparison.columns[0].dataset.sampleCount).toBe(200);
  });

  it("확정된 표본 수가 없으면 null 이다(0 행으로 읽히지 않게)", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({
        id: "a",
        reportData: reportWith({ datasetInfo: { sampleCount: 0, classLabels: [], fileName: "" } }),
      }),
    ]);

    expect(comparison.columns[0].dataset.sampleCount).toBeNull();
  });

  it("클래스별 개수는 매핑 단계 메타데이터(y_true 실측)에서 온다", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({
        id: "a",
        workflowSnapshot: snapshotWith({
          metadata: { class_distribution: { cat: 130, dog: 70 } },
        }),
        reportData: reportWith({ datasetInfo: { sampleCount: 200, classLabels: ["x"], fileName: "e.csv" } }),
      }),
    ]);

    const { dataset } = comparison.columns[0];
    expect(dataset.classCounts).toEqual({ cat: 130, dog: 70 });
    // 분포가 있으면 그 키가 클래스 목록이다 — 성적서의 추론값보다 실측이 우선.
    expect(dataset.classLabels).toEqual(["cat", "dog"]);
  });
});

describe("buildModelComparison — 행(지표)", () => {
  it("버전마다 고른 지표가 달라도 합집합으로 남긴다", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({
        id: "new",
        createdAt: "2026-09-10T00:00:00.000Z",
        reportData: reportWith({
          kpiResults: [{ metricId: "M1", name: "Accuracy", value: 0.9, status: "pass" }],
        }),
      }),
      makeRun({
        id: "old",
        createdAt: "2026-09-01T00:00:00.000Z",
        reportData: reportWith({
          kpiResults: [{ metricId: "M7", name: "AUROC", value: 0.8, status: "pass" }],
        }),
      }),
    ]);

    expect(comparison.metricRows.map((r) => r.metricId)).toEqual(["M1", "M7"]);
    // 고르지 않은 지표는 키 자체가 없다 → 화면이 '—' 를 그린다.
    expect(comparison.columns[0].metricValues.M7).toBeUndefined();
  });

  it("지표 번호순으로 행을 세운다", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({
        id: "a",
        reportData: reportWith({
          kpiResults: [
            { metricId: "M14", name: "c", value: 1, status: "pass" },
            { metricId: "M2", name: "b", value: 1, status: "pass" },
            { metricId: "M1", name: "a", value: 1, status: "pass" },
          ],
        }),
      }),
    ]);

    expect(comparison.metricRows.map((r) => r.metricId)).toEqual(["M1", "M2", "M14"]);
  });

  it("측정 불가(unavailable)는 0 이 아니라 null 이다", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({
        id: "a",
        reportData: reportWith({
          kpiResults: [{ metricId: "M9", name: "AUROC", value: 0, status: "unavailable" }],
        }),
      }),
    ]);

    expect(comparison.columns[0].metricValues.M9).toBeNull();
  });

  it("평가 데이터가 없는 run 에서도 무너지지 않는다", () => {
    const comparison = buildModelComparison("Face", [makeRun({ id: "a" })]);

    expect(comparison.columns).toHaveLength(1);
    expect(comparison.metricRows).toEqual([]);
    expect(comparison.columns[0].dataset.fileName).toBe("—");
  });
});

describe("스칼라가 없는 지표를 위한 자료", () => {
  it("버전별 혼동행렬을 싣는다(숫자 표에 넣을 수 없는 값)", () => {
    const matrix = { labels: ["a", "b"], matrix: [[1, 2], [3, 4]], totalSamples: 10 };
    const comparison = buildModelComparison("Face", [
      makeRun({ id: "a", reportData: reportWith({ charts: { confusionMatrix: matrix } }) }),
      makeRun({ id: "b", reportData: reportWith({ charts: { confusionMatrix: null } }) }),
    ]);

    expect(comparison.columns[0].confusionMatrix).toEqual(matrix);
    expect(comparison.columns[1].confusionMatrix).toBeNull();
  });

  it("차트가 아예 없는 run 에서도 무너지지 않는다", () => {
    const comparison = buildModelComparison("Face", [makeRun({ id: "a" })]);

    expect(comparison.columns[0].confusionMatrix).toBeNull();
  });

  it("클래스별 내역을 지표별로 모은다", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({
        id: "new",
        createdAt: "2026-09-10T00:00:00.000Z",
        reportData: reportWith({
          kpiResults: [
            {
              metricId: "M2",
              name: "Precision",
              perClass: [
                { label: "cat", value: 0.9, status: "pass" },
                { label: "dog", value: 0.7, status: "pass" },
              ],
            },
          ],
        }),
      }),
      makeRun({
        id: "old",
        createdAt: "2026-09-01T00:00:00.000Z",
        reportData: reportWith({
          kpiResults: [
            {
              metricId: "M2",
              name: "Precision",
              perClass: [{ label: "cat", value: 0.8, status: "pass" }],
            },
          ],
        }),
      }),
    ]);

    expect(comparison.perClassMetrics).toHaveLength(1);
    const rows = comparison.perClassMetrics[0].rows;
    expect(rows.map((r) => r.label)).toEqual(["cat", "dog"]);
    expect(rows[0].values).toEqual({ new: 0.9, old: 0.8 });
    // 예전 버전에 없던 클래스는 0 이 아니라 null 이다 — 0 은 '측정했는데 0' 이라는 뜻이다.
    expect(rows[1].values).toEqual({ new: 0.7, old: null });
  });

  it("클래스별 내역이 없으면 빈 배열이다(빈 섹션을 만들지 않게)", () => {
    const comparison = buildModelComparison("Face", [
      makeRun({
        id: "a",
        reportData: reportWith({ kpiResults: [{ metricId: "M1", name: "Accuracy", value: 0.9 }] }),
      }),
    ]);

    expect(comparison.perClassMetrics).toEqual([]);
  });
});

/**
 * 비교 대상 고르기.
 *
 * 상한이 있는 이유는 화면이다 — '평가 데이터' 표는 run 을 **열**로 세우므로, 10개를
 * 넘기면 2,000px 를 넘는 가로 스크롤이 되어 사실상 읽을 수 없다. 그래서 어떤 경로로
 * 들어와도 셋을 넘지 않는 것이 이 계층의 계약이다.
 */
describe("selectComparisonRuns", () => {
  const ten = Array.from({ length: 10 }, (_, i) =>
    makeRun({
      id: `run-${i}`,
      versionName: `v1.${i}.0`,
      // i 가 클수록 최신.
      createdAt: `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
    }),
  );

  it("고르지 않으면 최근 것부터 셋만 준다", () => {
    const picked = selectComparisonRuns(ten, null);

    expect(picked.map((r) => r.id)).toEqual(["run-9", "run-8", "run-7"]);
  });

  it("고른 것만 준다", () => {
    const picked = selectComparisonRuns(ten, ["run-0", "run-5"]);

    expect(picked.map((r) => r.id)).toEqual(["run-5", "run-0"]);
  });

  it("고른 순서와 무관하게 늘 최신순이다(표의 왼쪽이 최신)", () => {
    const picked = selectComparisonRuns(ten, ["run-2", "run-8", "run-4"]);

    expect(picked.map((r) => r.id)).toEqual(["run-8", "run-4", "run-2"]);
  });

  it("셋을 넘겨 요청해도 셋에서 자른다(URL 을 손으로 고쳐도 표가 무너지지 않게)", () => {
    const picked = selectComparisonRuns(ten, ten.map((r) => r.id));

    expect(picked).toHaveLength(MAX_COMPARE_RUNS);
  });

  it("지운 평가의 id 는 건너뛴다", () => {
    const picked = selectComparisonRuns(ten, ["run-9", "deleted", "run-1"]);

    expect(picked.map((r) => r.id)).toEqual(["run-9", "run-1"]);
  });

  it("요청한 id 가 하나도 안 맞으면 최근 셋으로 떨어진다(빈 표 금지)", () => {
    const picked = selectComparisonRuns(ten, ["gone-1", "gone-2"]);

    expect(picked.map((r) => r.id)).toEqual(["run-9", "run-8", "run-7"]);
  });

  it("평가가 셋보다 적으면 있는 만큼만 준다", () => {
    const picked = selectComparisonRuns(ten.slice(0, 2), null);

    expect(picked).toHaveLength(2);
  });
});

describe("parseRunIds", () => {
  it("쉼표로 나눈 id 목록을 읽는다", () => {
    expect(parseRunIds("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("값이 없으면 null(= 고르지 않음)", () => {
    expect(parseRunIds(null)).toBeNull();
    expect(parseRunIds("")).toBeNull();
  });

  it("빈 조각과 공백을 걸러낸다", () => {
    expect(parseRunIds(" a , , b ")).toEqual(["a", "b"]);
    expect(parseRunIds(",,")).toBeNull();
  });
});
