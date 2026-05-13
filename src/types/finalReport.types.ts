import type { TaskType } from "../data/evaluationData";
import type { ConfusionMatrixData, ReportRecommendation } from "./report.types";
import type { ValidationGroup } from "./validation.types";

export interface FinalReportMeta {
  reportId: string;
  title: string;
  issuedAt: string;
  evaluationPeriod: { from: string; to: string };
  taskType: TaskType;
  taskTypeLabel: string;
}

export interface ApplicantInfo {
  companyName: string;
  representative: string;
  businessNumber: string;
  contact: string;
  fax: string;
  homepage: string;
  address: string;
}

export interface PerformerInfo {
  orgName: string;
  evaluator: string;
  contact: string;
}

export interface EvalScope {
  purpose: string;
  targetModel: string;
  version: string;
  scope: string;
}

export interface EvalEnvironment {
  method: string;
  outputFormat: string;
  tools: string[];
  systemSpec: {
    os: string;
    cpu: string;
    gpu: string;
    memory: string;
    software: string;
  };
}

export interface DatasetInfo {
  format: string;
  inputColumns: string[];
  sampleCount: number;
  taskTypeLabel: string;
  classCount: number;
  classLabels: string[];
  fileName: string;
}

export interface DatasetSampleRow {
  id: number;
  y_true: number;
  y_pred: number;
  score: number;
}

export interface TcItem {
  tcId: string;
  name: string;
  threshold: number;
  passCriteria: string;
}

export interface ValidationResult {
  checkName: string;
  status: "pass" | "fail" | "warning";
  detail: string;
  group: ValidationGroup;
}

export interface MetricFormula {
  tcId: string;
  name: string;
  formula: string;
  description: string;
}

export interface PerClassKpi {
  label: string;
  value: number;
  status: "pass" | "fail" | "warning";
}

export interface KpiResult {
  tcId: string;
  name: string;
  value: number;
  threshold: number;
  status: "pass" | "fail" | "warning";
  perClass?: PerClassKpi[];
}

export interface LatencyStats {
  mean: number;
  min: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  unit: "ms" | "s";
}

export interface ConclusionData {
  verdict: "PASS" | "CONDITIONAL_PASS" | "FAIL";
  score: number;
  benchmark: string;
  narrative: string;
  risks: string;
}

export interface IssuanceRecord {
  version: string;
  issuedAt: string;
  note: string;
}

export interface SignatureData {
  issuer: string;
  signedAt: string;
  history: IssuanceRecord[];
}

export interface FinalReportData {
  meta: FinalReportMeta;
  applicant: ApplicantInfo;
  performer: PerformerInfo;
  evalScope: EvalScope;
  datasetInfo: DatasetInfo;
  datasetSamples: DatasetSampleRow[];
  datasetDiagnosis: string;
  evalEnv: EvalEnvironment;
  tcList: TcItem[];
  metricFormulas: MetricFormula[];
  dataValidation: ValidationResult[];
  kpiResults: KpiResult[];
  charts: {
    confusionMatrix: ConfusionMatrixData | null;
    rocCurve: { fpr: number[]; tpr: number[] } | null;
    prCurve: { recall: number[]; precision: number[] } | null;
  };
  latency: LatencyStats;
  interpretation: string;
  conclusion: ConclusionData;
  recommendations: ReportRecommendation[];
  signature: SignatureData;
}
