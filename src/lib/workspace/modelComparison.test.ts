import { describe, it, expect } from "vitest";
import {
  buildModelComparison,
  findRunsForModel,
  groupRunsByModel,
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
