import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { EvaluationSummary } from "./EvaluationSummary";
import type { FinalReportData, KpiResult } from "../../types/finalReport.types";

/**
 * 사용자 보고(2026-09-20): 같은 데이터로 두 번 평가했는데 Precision 이 한 번은
 * "47.6%", 한 번은 클래스별 표로만 보여 값이 달라진 것처럼 읽혔다.
 *
 * 값은 달라지지 않았다. M2 는 클래스별 정밀도의 macro 평균이고
 * (0.417+0.263+0.508+0.717)/4 = 0.476 으로 정확히 일치한다. 달라진 것은 **화면**이다 —
 * `perClass` 는 M22 를 같이 골랐을 때만 붙는데(useReportData), 종전 화면은 `perClass` 가
 * 붙은 지표를 값 카드 목록에서 **빼버렸다.**
 */
function kpi(over: Partial<KpiResult> & { metricId: string }): KpiResult {
  return { name: "Metric", value: 0, threshold: 0, status: "pass", ...over };
}

function renderSummary(kpiResults: KpiResult[], over: Record<string, unknown> = {}) {
  const data = {
    kpiResults,
    charts: { confusionMatrix: null, rocCurve: null, prCurve: null },
    meta: { taskTypeLabel: "Multi-class" },
    datasetInfo: { sampleCount: 0 },
    validationSummary: { totalRows: 200, validRows: 200, excludedRows: 0 },
    latency: null,
    ...over,
  } as unknown as FinalReportData;

  return render(
    <MemoryRouter>
      <EvaluationSummary data={data} />
    </MemoryRouter>,
  );
}

const PRECISION_WITH_BREAKDOWN = kpi({
  metricId: "M2",
  name: "Precision",
  value: 0.476,
  perClass: [
    { label: "0", value: 0.417, status: "pass" },
    { label: "1", value: 0.263, status: "pass" },
    { label: "2", value: 0.508, status: "pass" },
    { label: "3", value: 0.717, status: "pass" },
  ],
});

describe("클래스별 내역이 대표값을 대체하지 않는다", () => {
  it("M22 를 같이 골라도 Precision 의 대표값이 그대로 보인다", () => {
    renderSummary([PRECISION_WITH_BREAKDOWN, kpi({ metricId: "M22", name: "Class-wise Metric" })]);

    expect(screen.getByText("47.6%")).toBeInTheDocument();
  });

  it("M22 없이 고른 경우와 같은 값을 보여준다", () => {
    renderSummary([kpi({ metricId: "M2", name: "Precision", value: 0.476 })]);

    expect(screen.getByText("47.6%")).toBeInTheDocument();
  });

  /**
   * 종전에는 카드에 "47.6% 0.476" 처럼 같은 수를 두 표기로 나란히 적었다.
   * 한 화면에 두 수가 붙어 있으면 읽는 사람이 둘을 다른 값으로 여기거나
   * 어느 쪽이 참인지 되묻게 된다(사용자 보고, 2026-09-22).
   */
  it("같은 값을 두 표기로 중복해 적지 않는다", () => {
    renderSummary([kpi({ metricId: "M2", name: "Precision", value: 0.476 })]);

    expect(screen.getByText("47.6%")).toBeInTheDocument();
    expect(screen.queryByText("0.476")).not.toBeInTheDocument();
  });

  it("비율이 아닌 지표는 원값을 그대로 보여준다(%로 바꾸면 뜻이 달라진다)", () => {
    // M23 불균형비는 배수라 100 을 곱할 수 없다 — 1.463 은 '146.3%' 가 아니다.
    renderSummary([kpi({ metricId: "M23", name: "Imbalance Ratio", value: 1.463 })]);

    expect(screen.getByText("1.463")).toBeInTheDocument();
  });

  it("클래스별 내역은 대표값 **아래에** 함께 나온다", () => {
    renderSummary([PRECISION_WITH_BREAKDOWN]);

    expect(screen.getByText("47.6%")).toBeInTheDocument();
    expect(screen.getByText("41.7%")).toBeInTheDocument();
    expect(screen.getByText(/by class/i)).toBeInTheDocument();
  });

  /**
   * 대표값 카드가 47.6% 인데 바로 아래 표가 0.476 이면, 같은 측정이 두 수로 읽힌다.
   * 화면 표기는 버전 비교 화면과 같은 규칙(metricValueFormat)으로 맞춘다 —
   * 성적서는 "소수점 셋째 자리" 를 문서 안에서 스스로 선언하므로 별개다.
   */
  it("클래스별 값도 대표값과 같은 표기 규칙을 쓴다", () => {
    renderSummary([PRECISION_WITH_BREAKDOWN]);

    expect(screen.queryByText("0.417")).not.toBeInTheDocument();
  });
});

describe("스칼라 값이 없는 지표", () => {
  /**
   * M21(행렬)·M22(클래스별 표)는 백엔드가 숫자가 아니라 객체를 돌려준다.
   * `resolvedValue` 가 0 으로 남는데 그걸 인쇄하면 "Confusion Matrix 0.000" 이라는
   * **없는 측정값**이 화면에 생긴다.
   */
  it("M21·M22 에 0.000 을 인쇄하지 않는다", () => {
    renderSummary([
      kpi({ metricId: "M21", name: "Confusion Matrix" }),
      kpi({ metricId: "M22", name: "Class-wise Metric" }),
    ]);

    expect(screen.queryByText("0.000")).not.toBeInTheDocument();
  });

  it("대신 어디를 보면 되는지 알려준다", () => {
    renderSummary([kpi({ metricId: "M21", name: "Confusion Matrix" })]);

    expect(screen.getByText(/confusion matrix below/i)).toBeInTheDocument();
  });

  it("측정 불가면 사유를 그대로 보여준다(시각 전용 안내로 덮지 않는다)", () => {
    renderSummary([
      kpi({
        metricId: "M21",
        name: "Confusion Matrix",
        status: "unavailable",
        errorMessage: "y_pred is missing",
      }),
    ]);

    expect(screen.getByText(/y_pred is missing/)).toBeInTheDocument();
  });
});

describe("표본 수", () => {
  /**
   * `datasetInfo.sampleCount` 는 성적서 구간에서 사용자가 손으로 적는 값이라
   * 평가만 한 run 에서는 0 이다. 그대로 쓰면 화면에 "0 samples" 가 뜬다 —
   * 200행을 평가하고도 0건이라고 말하는 셈이다(사용자 스크린샷, 2026-09-20).
   */
  it("사용자 입력값이 비어도 서버가 확정한 검증 행 수를 쓴다", () => {
    renderSummary([kpi({ metricId: "M1", name: "Accuracy", value: 0.9 })]);

    expect(screen.getByText("200 samples")).toBeInTheDocument();
    expect(screen.queryByText("0 samples")).not.toBeInTheDocument();
  });

  it("확정된 값이 하나도 없으면 배지를 숨긴다(0 을 인쇄하지 않는다)", () => {
    renderSummary([kpi({ metricId: "M1", name: "Accuracy", value: 0.9 })], {
      validationSummary: undefined,
    });

    expect(screen.queryByText(/samples$/)).not.toBeInTheDocument();
  });
});

describe("판정은 하지 않는다", () => {
  it("status 가 pass 여도 합격 배지를 띄우지 않는다", () => {
    // 목표값은 성적서 구간에서 받으므로 이 시점엔 기준이 없다. useReportData 는
    // 기준이 없으면 status 를 기본값 "pass" 로 남기는데, 그것을 배지로 띄우면
    // 아무 기준 없이 전부 '합격'으로 보인다.
    // 화면 설명문("Pass/fail criteria are set later")은 기준이 아직 없다는 **안내**라
    // 남아 있어야 한다. 막으려는 것은 지표에 붙는 판정 배지다.
    renderSummary([kpi({ metricId: "M1", name: "Accuracy", value: 0.9 })]);

    expect(screen.queryByText(/^(pass|fail|passed|failed)$/i)).not.toBeInTheDocument();
  });
});
