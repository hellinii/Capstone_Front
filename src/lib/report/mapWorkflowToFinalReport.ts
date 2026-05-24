/**
 * 워크플로우 입력 → FinalReportData 매핑.
 *
 * 사용자가 입력 가능한 영역(기업 정보, 모델 정보, 환경, 데이터셋, 메트릭 선택)은 워크플로우에서 채우고,
 * 백엔드가 산출해야 할 영역(검증 결과, KPI 값, 차트, LLM 서술, 서명 등)은 mockReport 값을 fallback으로 사용한다.
 * 백엔드 API가 도입되면 fallback 영역만 응답으로 교체하면 된다.
 */
import {
  METRICS,
  TASK_TYPE_LABELS,
  getMetricDisplayId,
  type TaskType,
} from "../../data/evaluationData";
import { MOCK_FINAL_REPORT } from "../../data/mockReport";
import type {
  ApplicantInfo,
  DatasetInfo,
  EvalEnvironment,
  EvalScope,
  FinalReportData,
  FinalReportMeta,
  MetricFormula,
  ReportPurposeKey,
  SignatureData,
  TcItem,
  TrainingDatasetInfo,
} from "../../types/finalReport.types";
import type {
  BasicInfoFormData,
  DatasetInfoFormData,
  MetricDetailStateMap,
  UploadedFileInfo,
} from "../../types/workflow.types";
import {
  DEFAULT_EVAL_ENV_CONSTANTS,
  DEFAULT_EVAL_PURPOSE_TEXT,
  DEFAULT_EVAL_SCOPE_TEXT,
  DEFAULT_PERFORMER,
  REPORT_PURPOSE_LABEL,
  REPORT_PURPOSE_OVERVIEW,
} from "./reportConstants";

export interface MapWorkflowToReportInput {
  basicInfo: BasicInfoFormData;
  datasetInfo: DatasetInfoFormData;
  taskType: TaskType | "";
  selectedMetricIds: string[];
  metricDetails: MetricDetailStateMap;
  uploadedFile: UploadedFileInfo | null;
  trainingExampleFiles: UploadedFileInfo[];
  trainingUnsuitableExampleFiles: UploadedFileInfo[];
}

export function mapWorkflowToFinalReport(input: MapWorkflowToReportInput): FinalReportData {
  const resolvedTaskType: TaskType = input.taskType || "binary";

  return {
    meta: buildMeta(input, resolvedTaskType),
    applicant: buildApplicant(input.basicInfo),
    performer: DEFAULT_PERFORMER,
    evalScope: buildEvalScope(input.basicInfo),
    datasetInfo: buildDatasetInfo(input, resolvedTaskType),
    datasetSamples: MOCK_FINAL_REPORT.datasetSamples,
    datasetDiagnosis: MOCK_FINAL_REPORT.datasetDiagnosis,
    trainingDatasetInfo: buildTrainingDatasetInfo(input),
    evalEnv: buildEvalEnv(input.basicInfo),
    tcList: buildTcList(resolvedTaskType, input.selectedMetricIds, input.metricDetails),
    metricFormulas: buildMetricFormulas(resolvedTaskType, input.selectedMetricIds),
    dataValidation: MOCK_FINAL_REPORT.dataValidation,
    kpiResults: MOCK_FINAL_REPORT.kpiResults,
    charts: MOCK_FINAL_REPORT.charts,
    latency: MOCK_FINAL_REPORT.latency,
    interpretation: MOCK_FINAL_REPORT.interpretation,
    conclusion: MOCK_FINAL_REPORT.conclusion,
    recommendationNarrative: MOCK_FINAL_REPORT.recommendationNarrative,
    recommendations: MOCK_FINAL_REPORT.recommendations,
    signature: buildSignature(),
  };
}

// ---------- helpers ----------

function buildMeta(input: MapWorkflowToReportInput, taskType: TaskType): FinalReportMeta {
  const today = formatDate(new Date());
  const contractDate = input.basicInfo.contractDate
    ? formatDate(input.basicInfo.contractDate)
    : undefined;

  return {
    reportId: buildReportId(),
    title: "기계학습 분류 성능 시험결과서",
    issuedAt: today,
    evaluationPeriod: {
      from: contractDate ?? today,
      to: today,
    },
    taskType,
    taskTypeLabel: TASK_TYPE_LABELS[taskType],
    contractDate,
  };
}

function buildApplicant(basicInfo: BasicInfoFormData): ApplicantInfo {
  return {
    companyName: basicInfo.companyName || "—",
    representative: basicInfo.representative || "—",
    businessNumber: basicInfo.businessNumber || "—",
    contact: basicInfo.phone || "—",
    fax: basicInfo.fax || "—",
    homepage: basicInfo.website || "—",
    address: basicInfo.address || "—",
  };
}

function buildEvalScope(basicInfo: BasicInfoFormData): EvalScope {
  const purposeKey = normalizeReportPurpose(basicInfo.reportPurpose);
  const projectInfo =
    purposeKey === "project" && basicInfo.projectName
      ? {
          name: basicInfo.projectName,
          agency: basicInfo.projectAgency || "—",
          projectNumber: basicInfo.projectNumber || undefined,
        }
      : undefined;

  return {
    purpose: REPORT_PURPOSE_OVERVIEW[purposeKey] || DEFAULT_EVAL_PURPOSE_TEXT,
    targetModel: basicInfo.modelName || "—",
    version: basicInfo.versionName || "v1.0.0",
    scope: DEFAULT_EVAL_SCOPE_TEXT,
    reportPurposeKey: purposeKey,
    modelPurpose: basicInfo.modelPurpose || undefined,
    modelCategory: basicInfo.modelCategory || undefined,
    projectInfo,
  };
}

function buildDatasetInfo(input: MapWorkflowToReportInput, taskType: TaskType): DatasetInfo {
  const sampleCount = parseCount(input.datasetInfo.evaluationSampleCount);
  const classLabels = inferClassLabels(taskType, input.metricDetails);

  return {
    format: inferFormat(input.uploadedFile),
    inputColumns: inferInputColumns(taskType, input.selectedMetricIds),
    sampleCount: sampleCount ?? MOCK_FINAL_REPORT.datasetInfo.sampleCount,
    taskTypeLabel: TASK_TYPE_LABELS[taskType],
    classCount: classLabels.length,
    classLabels,
    fileName: input.uploadedFile?.name ?? "—",
  };
}

function buildTrainingDatasetInfo(input: MapWorkflowToReportInput): TrainingDatasetInfo | undefined {
  const { datasetInfo, trainingExampleFiles, trainingUnsuitableExampleFiles } = input;
  const training = parseCount(datasetInfo.trainingSampleCount);
  const evaluation = parseCount(datasetInfo.evaluationSampleCount);
  const hasName = datasetInfo.trainingDatasetName.trim() !== "";
  const hasCounts = training !== null && evaluation !== null;
  const hasExamples =
    trainingExampleFiles.length > 0 || trainingUnsuitableExampleFiles.length > 0;

  if (!hasName && !hasCounts && !hasExamples) {
    return undefined;
  }

  return {
    name: datasetInfo.trainingDatasetName || "—",
    trainingSampleCount: training ?? 0,
    evaluationSampleCount: evaluation ?? 0,
    validExamples: trainingExampleFiles,
    edgeExamples: trainingUnsuitableExampleFiles,
  };
}

function buildEvalEnv(basicInfo: BasicInfoFormData): EvalEnvironment {
  return {
    ...DEFAULT_EVAL_ENV_CONSTANTS,
    systemSpec: {
      os: basicInfo.envOS || "—",
      cpu: basicInfo.envCPU || "—",
      gpu: basicInfo.envGPU || "—",
      memory: basicInfo.envMemory || "—",
      software: basicInfo.envSoftware || "—",
    },
  };
}

function buildTcList(
  taskType: TaskType,
  selectedMetricIds: string[],
  metricDetails: MetricDetailStateMap,
): TcItem[] {
  if (selectedMetricIds.length === 0) {
    return MOCK_FINAL_REPORT.tcList;
  }

  return selectedMetricIds
    .map((tcId) => {
      const metric = METRICS.find((m) => m.id === tcId);
      if (!metric || !metric.supportedTaskTypes.includes(taskType)) return null;

      const detail = metricDetails[tcId];
      const target = parseFloat(detail?.targetValue ?? "");
      const hasThreshold = Number.isFinite(target) && target > 0;

      return {
        tcId: getMetricDisplayId(tcId),
        name: metric.name,
        threshold: hasThreshold ? target : 0,
        passCriteria: hasThreshold ? `≥ ${target.toFixed(2)}` : "정보 제공",
      };
    })
    .filter((item): item is TcItem => item !== null);
}

function buildMetricFormulas(taskType: TaskType, selectedMetricIds: string[]): MetricFormula[] {
  const ids = selectedMetricIds.length > 0 ? selectedMetricIds : [];
  if (ids.length === 0) return MOCK_FINAL_REPORT.metricFormulas;

  const fromMock = new Map(MOCK_FINAL_REPORT.metricFormulas.map((f) => [f.tcId, f]));

  return ids
    .map((tcId) => {
      const metric = METRICS.find((m) => m.id === tcId);
      if (!metric || !metric.supportedTaskTypes.includes(taskType)) return null;

      const displayId = getMetricDisplayId(tcId);
      const existing = fromMock.get(displayId);
      if (existing) return existing;

      return {
        tcId: displayId,
        name: metric.name,
        formula: "—",
        description: metric.description,
      };
    })
    .filter((item): item is MetricFormula => item !== null);
}

function buildSignature(): SignatureData {
  const today = formatDate(new Date());
  return {
    issuer: `${DEFAULT_PERFORMER.orgName} 평가부`,
    signedAt: today,
    history: [{ version: "v1.0", issuedAt: today, note: "최초 발급" }],
  };
}

// ---------- pure helpers ----------

function normalizeReportPurpose(value: string): ReportPurposeKey {
  if (value === "internal" || value === "external" || value === "project") return value;
  return "external";
}

function inferFormat(file: UploadedFileInfo | null): string {
  if (!file) return "정형 데이터 (CSV)";
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "정형 데이터 (CSV)";
  if (ext === "json") return "정형 데이터 (JSON)";
  return file.type && file.type !== "unknown" ? file.type : "정형 데이터";
}

function inferInputColumns(taskType: TaskType, selectedMetricIds: string[]): string[] {
  // ColumnMapping store가 도입되기 전까지 taskType 기반 기본 컬럼 셋 (Phase D에서 개선)
  const base = ["id", "y_true", "y_pred"];
  if (taskType === "binary") base.push("score");
  if (taskType === "multiclass" && selectedMetricIds.length > 0) base.push("prob_class_*");
  if (taskType === "multilabel") base.push("prob_label_*");
  return base;
}

function inferClassLabels(taskType: TaskType, metricDetails: MetricDetailStateMap): string[] {
  if (taskType === "binary") {
    const positive = Object.values(metricDetails).find((d) => d.positiveClass)?.positiveClass;
    return ["Negative (0)", positive ? `${positive} (1)` : "Positive (1)"];
  }
  // multiclass/multilabel은 컬럼 매핑 데이터가 없으므로 mock 그대로
  return MOCK_FINAL_REPORT.datasetInfo.classLabels;
}

function parseCount(value: string): number | null {
  const num = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) && num > 0 ? num : null;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildReportId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const seq = String(Math.floor(d.getTime() / 1000) % 10000).padStart(4, "0");
  return `RPT-${y}-${seq}`;
}
