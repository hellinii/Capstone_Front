/**
 * applyUserInputs — 성적서 구간 입력을 평가 결과 위에 다시 입히는 계층.
 *
 * **막으려는 결함**: 평가가 끝나는 순간 조립된 성적서가 `run.reportData` 에
 * `isEvaluated: true` 로 캐시되는데, 기관 정보·학습 데이터셋 정보·합격 목표값은 그 **뒤에**
 * (`/report/:id/issue-info`) 들어온다. 캐시를 그대로 내보내면 사용자가 입력한 값이 성적서에
 * 단 하나도 나오지 않는다 — 저장이 안 되는 것처럼 보이지만 실제로는 성적서가 읽지 않는 것이다.
 *
 * 그래서 이 테스트는 두 방향을 같이 고정한다.
 *   ① 사용자 입력은 **반드시 덮인다**(그게 이 함수의 존재 이유)
 *   ② 백엔드가 만든 사실은 **절대 덮이지 않는다**(측정값·차트·서술·발급 이력)
 */
import { describe, expect, it } from "vitest";

import { applyUserInputs } from "./applyUserInputs";
import { mapWorkflowToFinalReport, type MapWorkflowToReportInput } from "./mapWorkflowToFinalReport";
import type { FinalReportData } from "../../types/finalReport.types";
import {
  DEFAULT_BASIC_INFO,
  DEFAULT_DATASET_INFO,
  type MetricDetailStateMap,
} from "../../types/workflow.types";

/** 평가 직후 캐시된 성적서 — 성적서 구간 입력은 아직 하나도 없는 상태. */
function evaluatedReport(overrides: Partial<FinalReportData> = {}): FinalReportData {
  const base = mapWorkflowToFinalReport(emptySnapshot());

  return {
    ...base,
    // 백엔드가 만든 것들. 어떤 경우에도 보존돼야 한다.
    kpiResults: [
      {
        metricId: "M1",
        name: "Accuracy",
        value: 0.94,
        threshold: 0,
        status: "pass",
        higherIsBetter: true,
      },
    ],
    latency: { mean: 12, min: 5, p50: 11, p95: 20, p99: 30, max: 44, unit: "ms" },
    datasetDiagnosis: "클래스 분포는 1.2:1 로 균형에 가깝습니다.",
    interpretation: {
      confusionAnalysis: "LLM 이 쓴 혼동 분석",
      distributionAnalysis: "LLM 이 쓴 분포 분석",
    },
    conclusion: {
      verdict: "CONDITIONAL_PASS",
      score: 0,
      benchmark: "LLM 벤치마크 서술",
      narrative: "LLM 종합 서술",
      risks: "LLM 위험 서술",
    },
    narrativeSource: "llm",
    evalEnv: {
      ...base.evalEnv,
      environment: { libraries: { "scikit-learn": "1.5.0" }, evaluated_at: "2026-09-20T01:00:00Z" },
    },
    ...overrides,
  };
}

/** 평가 시점의 스냅샷 — 성적서 입력란이 전부 비어 있다. */
function emptySnapshot(overrides: Partial<MapWorkflowToReportInput> = {}): MapWorkflowToReportInput {
  return {
    basicInfo: { ...DEFAULT_BASIC_INFO, modelName: "MyModel" },
    datasetInfo: DEFAULT_DATASET_INFO,
    taskType: "binary",
    selectedMetricIds: ["M1"],
    metricDetails: {},
    uploadedFile: null,
    trainingExampleFiles: [],
    trainingUnsuitableExampleFiles: [],
    columnMapping: [],
    classLabelDescriptions: {},
    metadata: null,
    ...overrides,
  };
}

/** 사용자가 성적서 구간에서 채워 넣은 스냅샷. */
function filledSnapshot(metricDetails: MetricDetailStateMap = {}): MapWorkflowToReportInput {
  return emptySnapshot({
    basicInfo: {
      ...DEFAULT_BASIC_INFO,
      modelName: "MyModel",
      companyName: "테스트 주식회사",
      representative: "홍길동",
      businessNumber: "123-45-67890",
      phone: "02-1234-5678",
      address: "서울시 강남구",
      envOS: "Ubuntu 24.04",
      envCPU: "Xeon Gold 6338",
    },
    datasetInfo: {
      trainingSampleCount: "8000",
      validationSampleCount: "2000",
      trainingDatasetName: "사내 문의 로그",
      trainingDataFormat: "CSV (UTF-8)",
      trainingClassDistribution: "정상 6400 / 이상 1600",
      trainingDataDescription: "2026년 1~6월 수집분",
    },
    metricDetails,
  });
}

function target(value: string): MetricDetailStateMap {
  return {
    M1: {
      id: "M1",
      name: "Accuracy",
      description: "",
      targetValue: value,
      beta: "",
      positiveClass: "",
      completed: true,
    },
  };
}

describe("성적서 구간 입력이 성적서에 실린다", () => {
  it("기업 정보(1절)가 실린다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot());

    expect(result.applicant.companyName).toBe("테스트 주식회사");
    expect(result.applicant.representative).toBe("홍길동");
    expect(result.applicant.businessNumber).toBe("123-45-67890");
    expect(result.applicant.address).toBe("서울시 강남구");
  });

  it("평가 환경의 시스템 사양(4절)이 실린다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot());

    expect(result.evalEnv.systemSpec.os).toBe("Ubuntu 24.04");
    expect(result.evalEnv.systemSpec.cpu).toBe("Xeon Gold 6338");
  });

  it("학습 데이터셋 정보(데이터명·포맷·건수)가 실린다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot());

    expect(result.trainingDatasetInfo).toBeDefined();
    expect(result.trainingDatasetInfo?.name).toBe("사내 문의 로그");
    expect(result.trainingDatasetInfo?.format).toBe("CSV (UTF-8)");
    expect(result.trainingDatasetInfo?.trainingSampleCount).toBe(8000);
    expect(result.trainingDatasetInfo?.validationSampleCount).toBe(2000);
    expect(result.trainingDatasetInfo?.classDistribution).toBe("정상 6400 / 이상 1600");
  });

  it("평가 데이터 건수가 3절 표본 수에 실린다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot());

    expect(result.datasetInfo.sampleCount).toBe(2000);
  });

  it("덮기 전에는 이 값들이 전부 비어 있다(회귀 방지의 대조군)", () => {
    const cached = evaluatedReport();

    expect(cached.applicant.companyName).toBe("—");
    expect(cached.trainingDatasetInfo).toBeUndefined();
    expect(cached.datasetInfo.sampleCount).toBe(0);
  });
});

describe("합격 목표값", () => {
  it("4절 지표 목록의 합격 기준에 실린다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot(target("0.90")));

    const m1 = result.metricList.find((m) => m.metricId === "M1");
    expect(m1?.threshold).toBe(0.9);
    expect(m1?.passCriteria).toBe("≥ 0.90");
  });

  it("6절 KPI 의 기준값과 판정에 반영된다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot(target("0.90")));

    const m1 = result.kpiResults[0];
    expect(m1.threshold).toBe(0.9);
    expect(m1.status).toBe("pass");
    // 측정값 자체는 백엔드가 낸 사실이라 그대로다.
    expect(m1.value).toBe(0.94);
  });

  it("목표값에 못 미치면 8절 판정이 뒤집힌다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot(target("0.99")));

    expect(result.kpiResults[0].status).toBe("fail");
    // M1(Accuracy)은 binary 의 핵심 지표라 미달이면 FAIL.
    expect(result.conclusion.verdict).toBe("FAIL");
    expect(result.conclusion.score).toBe(0);
  });

  it("목표값이 없으면 '정보 제공' 지표로 남는다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot());

    expect(result.kpiResults[0].threshold).toBe(0);
    expect(result.metricList.find((m) => m.metricId === "M1")?.passCriteria).toBe("정보 제공");
  });

  it("계산 실패(unavailable) 지표는 목표값이 붙어도 판정 대상이 되지 않는다", () => {
    const report = evaluatedReport({
      kpiResults: [
        {
          metricId: "M1",
          name: "Accuracy",
          value: 0,
          threshold: 0,
          status: "unavailable",
          higherIsBetter: true,
          errorMessage: "확률 컬럼 없음",
        },
      ],
    });

    const result = applyUserInputs(report, filledSnapshot(target("0.90")));

    expect(result.kpiResults[0].status).toBe("unavailable");
    expect(result.kpiResults[0].errorMessage).toBe("확률 컬럼 없음");
  });
});

describe("백엔드가 만든 사실은 덮이지 않는다", () => {
  it("측정값·차트·지연시간·데이터셋 진단이 보존된다", () => {
    const cached = evaluatedReport();
    const result = applyUserInputs(cached, filledSnapshot(target("0.90")));

    expect(result.kpiResults[0].value).toBe(0.94);
    expect(result.latency).toEqual(cached.latency);
    expect(result.datasetDiagnosis).toBe(cached.datasetDiagnosis);
  });

  it("LLM 서술(7·8·9절)과 출처 배지가 보존된다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot(target("0.90")));

    expect(result.interpretation.confusionAnalysis).toBe("LLM 이 쓴 혼동 분석");
    expect(result.conclusion.benchmark).toBe("LLM 벤치마크 서술");
    expect(result.conclusion.narrative).toBe("LLM 종합 서술");
    expect(result.conclusion.risks).toBe("LLM 위험 서술");
    expect(result.narrativeSource).toBe("llm");
  });

  it("실제 수행 환경(라이브러리 버전)은 사용자 사양에 덮이지 않는다", () => {
    const result = applyUserInputs(evaluatedReport(), filledSnapshot());

    expect(result.evalEnv.environment?.libraries["scikit-learn"]).toBe("1.5.0");
  });

  it("평가 종료일이 열어볼 때마다 오늘 날짜로 밀리지 않는다", () => {
    const cached = evaluatedReport();
    cached.meta.evaluationPeriod = { from: "2026-09-01", to: "2026-09-10" };

    const result = applyUserInputs(cached, filledSnapshot());

    expect(result.meta.evaluationPeriod.to).toBe("2026-09-10");
  });
});

describe("발급된 성적서", () => {
  it("번호가 붙은 뒤에는 입력이 바뀌어도 문서가 변하지 않는다", () => {
    const issued = evaluatedReport();
    issued.meta.reportId = "RPT-2026-0001";

    const result = applyUserInputs(issued, filledSnapshot(target("0.99")));

    // 보관 문서는 그대로다 — 고치려면 재발급(사유 기재)을 거쳐야 한다.
    expect(result).toBe(issued);
    expect(result.applicant.companyName).toBe("—");
    expect(result.conclusion.verdict).toBe("CONDITIONAL_PASS");
  });
});

describe("구 스냅샷 호환", () => {
  it("작업 유형이 비어 있으면 평가 결과가 확정한 유형을 쓴다", () => {
    const snapshot = filledSnapshot(target("0.90"));
    snapshot.taskType = "";

    const result = applyUserInputs(evaluatedReport(), snapshot);

    // 유형을 잃고 binary 로 떨어지면 지표가 걸러져 4·5절이 통째로 빈다.
    expect(result.metricList.map((m) => m.metricId)).toContain("M1");
    expect(result.metricFormulas.map((m) => m.metricId)).toContain("M1");
  });
});
