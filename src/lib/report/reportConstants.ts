/**
 * 보고서 생성 시 사용자 입력으로 채울 수 없는 영역의 상수.
 * 백엔드 API 도입 시 일부는 응답으로 대체됨.
 */
import type {
  EvalEnvironment,
  PerformerInfo,
  ReportPurposeKey,
} from "../../types/finalReport.types";

export const DEFAULT_PERFORMER: PerformerInfo = {
  orgName: "한국 AI 인증원",
  evaluator: "자동 평가 엔진",
  contact: "—",
};

export const DEFAULT_EVAL_SCOPE_TEXT =
  "의뢰자가 제출한 평가 데이터셋을 기반으로 선택된 시험항목에 대해 정량적 성능 지표를 산출하고 합격 기준 충족 여부를 판정한다.";

export const DEFAULT_EVAL_PURPOSE_TEXT =
  "KS X ISO/IEC TS 4213:2022 표준에 따른 AI 분류 모델의 성능 인증 목적으로 활용";

export const DEFAULT_EVAL_ENV_CONSTANTS: Pick<EvalEnvironment, "method" | "outputFormat" | "tools"> = {
  method: "서버 사이드 자동 연산 (Python 기반 metric 산출)",
  outputFormat: "성능 지표 수치 및 합격/불합격 판정 성적서 (PDF)",
  tools: ["Python 3.11", "scikit-learn 1.4.0", "pandas 2.2.0", "numpy 1.26.0"],
};

export const REPORT_PURPOSE_LABEL: Record<ReportPurposeKey, string> = {
  internal: "내부 검증용",
  external: "외부 제출용",
  project: "프로젝트 산출물",
};

export const REPORT_PURPOSE_OVERVIEW: Record<ReportPurposeKey, string> = {
  internal: "조직 내부 QA 및 모델 모니터링 목적으로 활용",
  external: "외부 제출 및 인증/심사기관 검토 목적으로 활용",
  project: "정부 또는 기관 과제의 산출물 증빙 목적으로 활용",
};
