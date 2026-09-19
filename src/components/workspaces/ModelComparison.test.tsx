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
    },
  ],
  metricRows: [
    { metricId: "M1", name: "Accuracy" },
    { metricId: "M9", name: "AUROC" },
  ],
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
