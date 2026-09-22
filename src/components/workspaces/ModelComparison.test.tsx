import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ModelComparison } from "./ModelComparison";
import type { ModelComparison as ModelComparisonData } from "../../lib/workspace/modelComparison";

/**
 * 이 화면의 계약은 "사실만 보여준다"이다. 아래 테스트는 그 경계를 지킨다 —
 * 판정 문구·증감 표기가 슬며시 들어오면 실패한다.
 */
const base: ModelComparisonData = {
  modelName: "Face recognizer",
  taskType: "binary",
  columns: [
    {
      runId: "new",
      versionName: "v1.1.0",
      createdAt: "2026-09-10T00:00:00.000Z",
      reportId: "",
      dataset: {
        sampleCount: 200,
        classLabels: ["cat", "dog"],
        classCounts: { cat: 130, dog: 70 },
        fileName: "eval-sep.csv",
      },
      metricValues: { M1: 0.91 },
      confusionMatrix: null,
    },
    {
      runId: "old",
      versionName: "v1.0.0",
      createdAt: "2026-09-01T00:00:00.000Z",
      reportId: "RPT-1",
      dataset: {
        sampleCount: 200,
        classLabels: ["cat", "dog"],
        classCounts: { cat: 130, dog: 70 },
        fileName: "eval.csv",
      },
      metricValues: { M1: 0.88, M9: null },
      confusionMatrix: null,
    },
  ],
  metricRows: [
    { metricId: "M1", name: "Accuracy" },
    { metricId: "M9", name: "AUROC" },
  ],
  perClassMetrics: [],
};

function renderComparison(over: Partial<ModelComparisonData> = {}) {
  return render(
    <MemoryRouter>
      <ModelComparison comparison={{ ...base, ...over }} />
    </MemoryRouter>,
  );
}

describe("평가 데이터 — 사실만", () => {
  it("표본 수·클래스 목록·클래스별 개수·파일명을 싣는다", () => {
    renderComparison();

    expect(screen.getAllByText("200")).not.toHaveLength(0);
    expect(screen.getAllByText("cat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("130").length).toBeGreaterThan(0);
    expect(screen.getByText("eval-sep.csv")).toBeInTheDocument();
  });

  it("같은 데이터인지 **판정하지 않는다**", () => {
    renderComparison();

    // 멀티레이블에서는 이 판정이 틀릴 수 있다(레이블 등장 횟수는 동시 출현을 잃는다).
    expect(screen.queryByText(/same dataset|같은 데이터|identical/i)).not.toBeInTheDocument();
  });

  it("멀티레이블은 '클래스별 개수'가 아니라 '레이블 등장 횟수'로 부른다", () => {
    renderComparison({ taskType: "multilabel" });

    expect(screen.getByText("Label occurrences")).toBeInTheDocument();
    expect(screen.queryByText("Samples per class")).not.toBeInTheDocument();
  });
});

describe("평가 결과 — 판정·해석 없음", () => {
  it("최신 버전이 첫 행이다", () => {
    renderComparison();

    const versionLinks = screen.getAllByRole("link", { name: /^v1\./ });
    expect(versionLinks[0]).toHaveTextContent("v1.1.0");
  });

  it("비율 지표는 %로 읽어준다", () => {
    renderComparison();
    expect(screen.getByText("91.0%")).toBeInTheDocument();
    expect(screen.getByText("88.0%")).toBeInTheDocument();
  });

  it("측정 불가와 미선택은 모두 '—' 다(0 이 아니다)", () => {
    renderComparison();

    // M9 은 v1.0.0 에서 측정 불가(null), v1.1.0 에서는 아예 고르지 않았다(키 없음).
    expect(screen.queryByText("0.000")).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("증감 화살표나 '개선' 같은 해석을 넣지 않는다", () => {
    const { container } = renderComparison();

    expect(container.textContent).not.toMatch(/▲|▼|↑|↓|improved|regressed|better|worse/i);
  });

  it("각 버전에서 해당 평가로 넘어갈 수 있다(발급본이면 성적서로)", () => {
    renderComparison();

    const issued = screen.getAllByRole("link", { name: "v1.0.0" })[0];
    const draft = screen.getAllByRole("link", { name: "v1.1.0" })[0];

    expect(issued).toHaveAttribute("href", "/report/old");
    expect(draft).toHaveAttribute("href", "/report/new/summary");
  });

  it("측정된 지표가 없으면 빈 표 대신 안내를 보여준다", () => {
    renderComparison({ metricRows: [] });

    expect(screen.getByText(/No measured metrics/i)).toBeInTheDocument();
  });
});

/**
 * M21(혼동행렬)·M22(클래스별)는 **스칼라가 없다.** 백엔드가 객체를 돌려주므로
 * `resolvedValue` 가 0 으로 남는데, 그 0 을 그대로 찍으면 화면에
 * "Confusion Matrix 0.000" 이라는 **없는 측정값**이 생긴다. 성적서(MetricRow)와 평가 결과
 * 화면은 이미 걸러내고 있었고 비교 표만 새고 있었다(사용자 보고, 2026-09-22).
 */
describe("스칼라가 없는 지표 (M21 / M22)", () => {
  const visualBase: Partial<ModelComparisonData> = {
    metricRows: [
      { metricId: "M21", name: "Confusion Matrix" },
      { metricId: "M22", name: "Class-wise Metric" },
    ],
  };

  it("0.000 을 찍지 않는다", () => {
    renderComparison({
      ...visualBase,
      columns: [{ ...base.columns[0], metricValues: { M21: 0, M22: 0 } }],
    });

    expect(screen.queryByText("0.000")).not.toBeInTheDocument();
  });

  it("아래의 그림·표를 가리킨다", () => {
    renderComparison({
      ...visualBase,
      columns: [{ ...base.columns[0], metricValues: { M21: 0, M22: 0 } }],
    });

    expect(screen.getAllByText("See below")).toHaveLength(2);
  });

  it("아예 측정되지 않았으면 '가리킴'이 아니라 미측정 표기다", () => {
    renderComparison({
      ...visualBase,
      columns: [{ ...base.columns[0], metricValues: { M21: null, M22: null } }],
    });

    expect(screen.queryByText("See below")).not.toBeInTheDocument();
  });
});

describe("혼동행렬 — 버전별로 그린다", () => {
  const matrix = {
    labels: ["cat", "dog"],
    matrix: [
      [120, 10],
      [15, 55],
    ],
    totalSamples: 200,
  };

  it("행렬이 하나도 없으면 섹션을 만들지 않는다(빈 카드 금지)", () => {
    renderComparison();

    expect(screen.queryByText("Confusion matrices")).not.toBeInTheDocument();
  });

  it("행렬이 있는 버전만 그린다", () => {
    renderComparison({
      columns: [
        { ...base.columns[0], confusionMatrix: matrix },
        { ...base.columns[1], confusionMatrix: null },
      ],
    });

    expect(screen.getByText("Confusion matrices")).toBeInTheDocument();
    // ConfusionMatrixChart 는 카드마다 제목을 하나씩 단다.
    expect(screen.getAllByText("Confusion Matrix")).toHaveLength(1);
  });

  it("버전마다 하나씩 그린다", () => {
    renderComparison({
      columns: [
        { ...base.columns[0], confusionMatrix: matrix },
        { ...base.columns[1], confusionMatrix: matrix },
      ],
    });

    expect(screen.getAllByText("Confusion Matrix")).toHaveLength(2);
  });
});

describe("클래스별 세부 성능 (M22)", () => {
  const perClass: ModelComparisonData["perClassMetrics"] = [
    {
      metricId: "M2",
      name: "Precision",
      rows: [
        { label: "cat", values: { new: 0.91, old: 0.88 } },
        // 예전 버전에는 없던 클래스 — 행이 사라지지 않고 미측정으로 남아야 한다.
        { label: "dog", values: { new: 0.72, old: null } },
      ],
    },
  ];

  it("클래스별 내역이 없으면 섹션을 만들지 않는다", () => {
    renderComparison();

    expect(screen.queryByText("Per-class metrics")).not.toBeInTheDocument();
  });

  /**
   * 클래스별 표로 범위를 좁힌다. 클래스 이름("cat")은 위쪽 '평가 데이터' 표의
   * Classes 행에도 배지로 떠 있어, 화면 전체에서 찾으면 그쪽이 함께 잡힌다.
   */
  const perClassRow = (label: string) => {
    const table = screen.getByRole("columnheader", { name: "Class" }).closest("table")!;
    return within(table)
      .getAllByRole("row")
      .find((row) => within(row).queryByText(label))!;
  };

  it("클래스를 행으로, 버전을 열로 놓는다", () => {
    renderComparison({ perClassMetrics: perClass });

    const row = perClassRow("cat");
    expect(within(row).getByText("91.0%")).toBeInTheDocument();
    expect(within(row).getByText("88.0%")).toBeInTheDocument();
  });

  it("한 버전에만 있는 클래스도 행이 사라지지 않는다", () => {
    renderComparison({ perClassMetrics: perClass });

    const row = perClassRow("dog");
    expect(within(row).getByText("72.0%")).toBeInTheDocument();
    expect(within(row).getByText("—")).toBeInTheDocument();
  });
});

describe("표는 좁은 화면에서 가로 스크롤된다", () => {
  it("각 표가 overflow 컨테이너 안에 있다", () => {
    const { container } = renderComparison();
    const tables = container.querySelectorAll("table");

    for (const table of tables) {
      expect(within(table.parentElement!).getByRole("table")).toBe(table);
      expect(table.parentElement).toHaveClass("overflow-x-auto");
    }
  });
});
