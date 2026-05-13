import type { FinalReportData } from "../types/finalReport.types";

export const MOCK_FINAL_REPORT: FinalReportData = {
  meta: {
    reportId: "RPT-2025-0001",
    title: "기계학습 분류 성능 시험결과서",
    issuedAt: "2025-05-11",
    evaluationPeriod: { from: "2025-04-01", to: "2025-05-10" },
    taskType: "binary",
    taskTypeLabel: "이진 분류 (Binary Classification)",
  },

  applicant: {
    companyName: "(주) 테스트 기업",
    representative: "홍길동",
    businessNumber: "123-45-67890",
    contact: "02-1234-5678",
    fax: "02-1234-5679",
    homepage: "www.test-corp.ai",
    address: "서울특별시 강남구 테헤란로 123",
  },

  performer: {
    orgName: "한국 AI 인증원",
    evaluator: "김평가",
    contact: "031-000-0000",
  },

  evalScope: {
    purpose:
      "KS X ISO/IEC TS 4213:2022 표준에 따른 이진 분류 AI 모델의 성능 인증 목적으로 활용",
    targetModel: "BinaryClassifier-v2",
    version: "v2.3.1",
    scope:
      "의뢰자가 제출한 평가 데이터셋을 기반으로 선택된 시험항목에 대해 정량적 성능 지표를 산출하고 합격 기준 충족 여부를 판정한다.",
  },

  // 3절: 데이터셋 개요
  datasetInfo: {
    format: "정형 데이터 (CSV)",
    inputColumns: ["id", "y_true", "y_pred", "score"],
    sampleCount: 5000,
    taskTypeLabel: "이진 분류 (Binary Classification)",
    classCount: 2,
    classLabels: ["Negative (0)", "Positive (1)"],
    fileName: "binary_eval_dataset_v2.csv",
  },

  datasetSamples: [
    { id: 1,    y_true: 1, y_pred: 1, score: 0.924 },
    { id: 2,    y_true: 0, y_pred: 0, score: 0.078 },
    { id: 3,    y_true: 1, y_pred: 1, score: 0.883 },
    { id: 4,    y_true: 0, y_pred: 1, score: 0.531 },
    { id: 5,    y_true: 1, y_pred: 0, score: 0.412 },
    { id: 6,    y_true: 0, y_pred: 0, score: 0.043 },
    { id: 7,    y_true: 1, y_pred: 1, score: 0.976 },
    { id: 8,    y_true: 0, y_pred: 0, score: 0.112 },
    { id: 9,    y_true: 1, y_pred: 1, score: 0.791 },
    { id: 10,   y_true: 0, y_pred: 0, score: 0.057 },
  ],

  datasetDiagnosis:
    "학습-평가 비율은 0.80:0.20으로 적절한 수준이며, 클래스별 분포를 비교한 결과 " +
    "Negative 클래스(61.8%)와 Positive 클래스(38.2%)로 경미한 불균형이 확인되었다. " +
    "Imbalance Ratio 1.14로 허용 기준(≤ 1.50) 이내이나, Positive 클래스 성능 지표 해석 시 " +
    "이 점을 참고할 것을 권장한다.",

  // 4절: 평가 수행 환경
  evalEnv: {
    method: "서버 사이드 자동 연산 (Python 기반 metric 산출)",
    outputFormat: "성능 지표 수치 및 합격/불합격 판정 성적서 (PDF)",
    tools: [
      "Python 3.11",
      "scikit-learn 1.4.0",
      "pandas 2.2.0",
      "numpy 1.26.0",
    ],
    systemSpec: {
      os: "Ubuntu 22.04 LTS",
      cpu: "Intel Xeon Gold 6338 × 2",
      gpu: "NVIDIA A100 80GB",
      memory: "256 GB DDR4",
      software: "CUDA 12.1 / cuDNN 8.9",
    },
  },

  // 5절: 시험항목 — ID는 M 표기 (Metric ID)
  tcList: [
    { tcId: "M1",  name: "Accuracy",             threshold: 0.85, passCriteria: "≥ 0.85" },
    { tcId: "M2",  name: "Precision",             threshold: 0.80, passCriteria: "≥ 0.80" },
    { tcId: "M3",  name: "Recall",                threshold: 0.80, passCriteria: "≥ 0.80" },
    { tcId: "M4",  name: "F1 Score",              threshold: 0.82, passCriteria: "≥ 0.82" },
    { tcId: "M9",  name: "AUROC",                 threshold: 0.80, passCriteria: "≥ 0.80" },
    { tcId: "M21", name: "Confusion Matrix",      threshold: 0,    passCriteria: "정보 제공" },
    { tcId: "M22", name: "Class별 Metric",         threshold: 0,    passCriteria: "정보 제공" },
    { tcId: "M23", name: "Class Imbalance Ratio", threshold: 1.50, passCriteria: "≤ 1.50" },
  ],

  metricFormulas: [
    {
      tcId: "M1",
      name: "Accuracy",
      formula: "(TP + TN) / (TP + FP + TN + FN) × 100 [%]",
      description: "전체 데이터셋에 대해 예측값과 실제 라벨의 일치율을 측정하여 전반적인 분류 정확도를 평가함",
    },
    {
      tcId: "M2",
      name: "Precision",
      formula: "TP / (TP + FP)",
      description: "양성 예측 중 실제 양성의 비율을 측정하여 오탐지(FP) 비용 및 예측 정밀성을 검증함",
    },
    {
      tcId: "M3",
      name: "Recall",
      formula: "TP / (TP + FN)",
      description: "실제 양성 중 탐지 비율을 산출하여 미탐지(FN) 방지 능력을 확인함",
    },
    {
      tcId: "M4",
      name: "F1 Score",
      formula: "2TP / (2TP + FP + FN)",
      description: "정밀도와 재현율의 조화 평균으로 균형 잡힌 성능을 대표함",
    },
    {
      tcId: "M9",
      name: "AUROC",
      formula: "Area Under ROC Curve",
      description: "모든 임계값에 따른 이진 분류 판별력을 곡선 하부 면적으로 평가함",
    },
    {
      tcId: "M21",
      name: "Confusion Matrix",
      formula: "실제값 대비 예측값 매칭 카운트 산출 + 히트맵",
      description: "실제/예측 클래스 간 교차 분포를 행렬화하여 오분류 경향을 진단함",
    },
    {
      tcId: "M22",
      name: "Class별 Metric",
      formula: "개별 클래스별 P/R/F1 산출",
      description: "각 클래스별 독립적인 P/R/F1 지표를 산출하여 취약 클래스를 분석함",
    },
    {
      tcId: "M23",
      name: "Class Imbalance Ratio",
      formula: "max(class count) / min(class count)",
      description: "클래스별 샘플 편차를 수치화하여 데이터 불균형의 영향을 사전 확인함",
    },
  ],

  // 6절: 시험 결과
  dataValidation: [
    {
      checkName: "결측값 (Missing Value)",
      status: "pass",
      detail: "없음 (0 / 5,000)",
      group: "common",
    },
    {
      checkName: "중복 ID",
      status: "pass",
      detail: "없음",
      group: "common",
    },
    {
      checkName: "클래스 불일치",
      status: "pass",
      detail: "통과 — y_true와 y_pred가 동일한 클래스 체계 사용 확인됨",
      group: "common",
    },
    {
      checkName: "필수 컬럼 누락",
      status: "pass",
      detail: "모든 필수 컬럼 확인됨 (id, y_true, y_pred, score)",
      group: "common",
    },
    {
      checkName: "제외된 샘플 수",
      status: "pass",
      detail: "0건 — 누락값·오류로 인한 제외 없음",
      group: "common",
    },
    {
      checkName: "Positive 클래스 누락",
      status: "pass",
      detail: "통과 — positive_class 설정값 확인됨",
      group: "binary",
    },
    {
      checkName: "score 범위 오류",
      status: "pass",
      detail: "통과 — 모든 score 값이 [0.00, 1.00] 범위 내",
      group: "binary",
    },
    {
      checkName: "이진 클래스 체계 오류",
      status: "warning",
      detail: "Positive 비율 38.2% — 경미한 불균형이나 허용 범위 내 (Imbalance Ratio 1.14 ≤ 1.50)",
      group: "binary",
    },
  ],

  kpiResults: [
    { tcId: "M1",  name: "Accuracy",             value: 0.944, threshold: 0.85, status: "pass" },
    {
      tcId: "M2",
      name: "Precision",
      value: 0.931,
      threshold: 0.80,
      status: "pass",
      perClass: [
        { label: "Negative (0)", value: 0.952, status: "pass" },
        { label: "Positive (1)", value: 0.910, status: "pass" },
      ],
    },
    {
      tcId: "M3",
      name: "Recall",
      value: 0.919,
      threshold: 0.80,
      status: "pass",
      perClass: [
        { label: "Negative (0)", value: 0.941, status: "pass" },
        { label: "Positive (1)", value: 0.897, status: "pass" },
      ],
    },
    { tcId: "M4",  name: "F1 Score",             value: 0.925, threshold: 0.82, status: "pass" },
    { tcId: "M9",  name: "AUROC",                value: 0.962, threshold: 0.80, status: "pass" },
    { tcId: "M23", name: "Class Imbalance Ratio", value: 1.14,  threshold: 1.50, status: "pass" },
  ],

  charts: {
    confusionMatrix: {
      labels: ["Negative (0)", "Positive (1)"],
      matrix: [
        [2954, 156],
        [173,  1717],
      ],
      totalSamples: 5000,
    },
    rocCurve: {
      fpr: [0.00, 0.02, 0.05, 0.10, 0.18, 0.35, 1.00],
      tpr: [0.00, 0.45, 0.68, 0.83, 0.91, 0.96, 1.00],
    },
    prCurve: {
      recall:    [0.00, 0.20, 0.50, 0.75, 0.92, 1.00],
      precision: [1.00, 0.97, 0.95, 0.93, 0.88, 0.62],
    },
  },

  latency: {
    mean: 13.1,
    min:  4.2,
    p50:  12.4,
    p95:  28.7,
    p99:  41.2,
    max:  67.8,
    unit: "ms",
  },

  // 7절: 정밀 분석 (LLM 자동 생성)
  interpretation:
    "전체 오분류 329건 중 Positive→Negative 오분류(FN)가 173건(전체의 3.5%)으로 가장 높은 비중을 " +
    "차지하였으며, 이는 Positive 클래스의 결정 경계(Decision Boundary) 근방에서 확률값이 임계값(0.5)에 " +
    "근접한 샘플이 다수 존재함을 시사한다. Negative 클래스의 FP는 156건(3.1%)으로 안정적인 수준이다.\n\n" +
    "평가 데이터셋의 Imbalance Ratio는 1.14로 경미한 불균형 상태이다. 다수 클래스 Negative(0)의 샘플 " +
    "비중이 61.8%를 차지하나, F1 Score 0.925를 고려할 때 불균형에 의한 성능 왜곡은 미미한 수준으로 판단된다.",

  // 8절: 종합 진단 소견 (LLM + RAG 자동 생성)
  conclusion: {
    verdict: "PASS",
    score: 94.4,
    benchmark:
      "이진 분류 태스크 기준, 공개 벤치마크 평균 Accuracy는 85~92%, F1은 0.83~0.91 범위이다. " +
      "본 모델의 Accuracy 94.4%, F1 0.925는 해당 범위의 상위 수준에 해당하며, 특히 AUROC 0.962는 " +
      "동종 도메인 상위 10% 수준의 판별 성능을 나타낸다.",
    narrative:
      "본 모델은 이진 분류 태스크에서 전반적으로 우수한 수준의 분류 성능을 달성하였다. " +
      "Accuracy 94.4%와 F1 0.925는 안정적인 성능을 시사하며, AUROC 0.962는 임계값 변화에도 강인한 " +
      "분류 능력을 나타낸다. 추론 지연 시간 P99 41.2ms로 실시간 응용에 적합한 수준이다.",
    risks:
      "Positive 클래스 Recall이 0.897로 Negative(0.941) 대비 소폭 낮아, 실제 운영 환경에서 " +
      "Positive 클래스의 미탐지(False Negative) 발생 위험이 일부 존재한다. " +
      "Positive 비율 38.2%로 경미한 불균형이 확인되었으며, 데이터 분포 변화(Data Drift) 발생 시 " +
      "Positive 클래스 성능 하락 위험이 상존한다.",
  },

  // 9절: 기술 개선 권고안
  recommendations: [
    {
      priority: "MEDIUM",
      category: "데이터 균형",
      action: "Positive 클래스 비율을 45~55%로 조정한 추가 평가 수행 권고",
      expectedImpact: "클래스 불균형에 의한 Recall 저하 리스크 사전 검증",
    },
    {
      priority: "LOW",
      category: "임계값 최적화",
      action: "ROC Curve 분석을 바탕으로 운영 환경에 맞는 임계값 튜닝 검토",
      expectedImpact: "Precision-Recall 트레이드오프 조정으로 실용 성능 향상",
    },
    {
      priority: "LOW",
      category: "모니터링",
      action: "운영 단계에서 P99 지연 시간 주기적 모니터링 설정",
      expectedImpact: "트래픽 급증 시 지연 시간 이상 조기 감지",
    },
  ],

  signature: {
    issuer: "한국 AI 인증원 평가부",
    signedAt: "2025-05-11",
    history: [
      { version: "v1.0", issuedAt: "2025-05-11", note: "최초 발급" },
    ],
  },
};
