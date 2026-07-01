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

import type {
  ApplicantInfo,
  ClassLabelInfo,
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
import type { MappingRow } from "../../types/mapping.types";
import type { ValidateDataResponseData } from "../../types/validation.types";
import { mapValidationResultToReport } from "./mapValidationResultToReport";
import { buildConclusion } from "./computeVerdict";
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
  columnMapping: MappingRow[];
  classLabelDescriptions: Record<string, string>;
}

export function mapWorkflowToFinalReport(
  input: MapWorkflowToReportInput,
  validationResult?: ValidateDataResponseData | null,
): FinalReportData {
  const resolvedTaskType: TaskType = input.taskType || "binary";

  // 데이터 검증 결과: 백엔드 /api/validate-data 응답이 있으면 실제 값으로 채우고,
  // 없으면 빈 배열(가짜 MOCK 8항목을 노출하지 않음 — 섹션이 "검증 미수행" 안내로 처리).
  const sampleCountFallback =
    parseCount(input.datasetInfo.validationSampleCount) ??
    MOCK_FINAL_REPORT.datasetInfo.sampleCount;
  const mappedValidation = validationResult
    ? mapValidationResultToReport(validationResult, sampleCountFallback)
    : null;

  return {
    meta: buildMeta(input, resolvedTaskType),
    applicant: buildApplicant(input.basicInfo),
    performer: DEFAULT_PERFORMER,
    evalScope: buildEvalScope(input.basicInfo),
    datasetInfo: buildDatasetInfo(input, resolvedTaskType),
    // 데이터 예시 행: 가짜 MOCK 10행 제거. 실제 샘플 렌더링은 백엔드 샘플 반환 + 타입 일반화 후속 작업(P1-7) 필요.
    datasetSamples: [],
    // datasetDiagnosis 는 실제 클래스 분포 기반으로 useReportData 에서 채운다(가짜 MOCK 제거).
    datasetDiagnosis: "",
    trainingDatasetInfo: buildTrainingDatasetInfo(input),
    evalEnv: buildEvalEnv(input.basicInfo),
    tcList: buildTcList(resolvedTaskType, input.selectedMetricIds, input.metricDetails),
    metricFormulas: buildMetricFormulas(resolvedTaskType, input.selectedMetricIds),
    dataValidation: mappedValidation ? mappedValidation.dataValidation : [],
    validationSummary: mappedValidation ? mappedValidation.summary : undefined,
    kpiResults: [],
    // 차트는 백엔드 평가 결과(useReportData)에서 채운다. 미평가 경로에서는 가짜 곡선/행렬 대신 null.
    charts: { confusionMatrix: null, rocCurve: null, prCurve: null },
    // latency 는 평가 결과에서 latency 컬럼이 매핑된 경우만 채운다(useReportData). 가짜 MOCK 대신 null.
    latency: null,
    // 7·9절 서술은 LLM 서술 모듈(useReportData → /api/generate-narrative)에서 채운다.
    // 그 전까지는 가짜 MOCK 대신 빈 값(섹션이 "생성 예정" 안내 표시).
    interpretation: { confusionAnalysis: "", distributionAnalysis: "" },
    // verdict/score 는 규칙으로 산출(MOCK 가짜 PASS/94.4 제거). 서술(benchmark/narrative/risks)은 LLM 모듈 전까지 빈 값.
    conclusion: buildConclusion([], resolvedTaskType),
    recommendationNarrative: { dataQuality: "", modelOps: "" },
    recommendations: [],
    signature: buildSignature(),
  };
}

// ---------- helpers ----------

function buildMeta(input: MapWorkflowToReportInput, taskType: TaskType): FinalReportMeta {
  const today = formatDate(new Date());
  const now = formatDateTime(new Date());
  const contractDate = input.basicInfo.contractDate
    ? formatDate(input.basicInfo.contractDate)
    : undefined;

  return {
    reportId: buildReportId(),
    title: "기계학습 분류 성능 시험결과서",
    issuedAt: now,
    evaluationPeriod: {
      from: contractDate ?? today,
      to: today,
    },
    taskType,
    taskTypeLabel: TASK_TYPE_LABELS[taskType],
    contractDate,
    positiveClass: input.metricDetails["TC2"]?.positiveClass || undefined,
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
  const sampleCount = parseCount(input.datasetInfo.validationSampleCount);

  // y_true 컬럼에서 실제 클래스 값을 도출 (있으면 mock/추론 대신 실제 값 사용)
  const yTrueRow = input.columnMapping.find((r) => r.confirmedRole === "y_true");
  const classValues = yTrueRow ? [...new Set(yTrueRow.sampleValues)] : [];
  const classLabels = classValues.length
    ? classValues
    : inferClassLabels(taskType, input.metricDetails);

  const classLabelDescriptions: ClassLabelInfo[] | undefined = classValues.length
    ? classValues.map((value) => ({
        label: value,
        description: input.classLabelDescriptions[value] ?? "",
      }))
    : undefined;

  return {
    format: inferFormat(input.uploadedFile),
    inputColumns: inferInputColumns(taskType, input.selectedMetricIds, input.columnMapping),
    sampleCount: sampleCount ?? MOCK_FINAL_REPORT.datasetInfo.sampleCount,
    taskTypeLabel: TASK_TYPE_LABELS[taskType],
    classCount: classLabels.length,
    classLabels,
    classLabelDescriptions,
    fileName: input.uploadedFile?.name ?? "—",
  };
}

function buildTrainingDatasetInfo(input: MapWorkflowToReportInput): TrainingDatasetInfo | undefined {
  const { datasetInfo, trainingExampleFiles, trainingUnsuitableExampleFiles } = input;
  const training = parseCount(datasetInfo.trainingSampleCount);
  const validation = parseCount(datasetInfo.validationSampleCount);
  const format = datasetInfo.trainingDataFormat.trim();
  const classDistribution = datasetInfo.trainingClassDistribution.trim();
  const description = datasetInfo.trainingDataDescription.trim();
  const hasName = datasetInfo.trainingDatasetName.trim() !== "";
  const hasCounts = training !== null && validation !== null;
  const hasExamples =
    trainingExampleFiles.length > 0 || trainingUnsuitableExampleFiles.length > 0;
  const hasMeta = format !== "" || classDistribution !== "" || description !== "";

  if (!hasName && !hasCounts && !hasExamples && !hasMeta) {
    return undefined;
  }

  return {
    name: datasetInfo.trainingDatasetName || "—",
    trainingSampleCount: training ?? 0,
    validationSampleCount: validation ?? 0,
    format: format || undefined,
    classDistribution: classDistribution || undefined,
    description: description || undefined,
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

function inferInputColumns(
  taskType: TaskType,
  selectedMetricIds: string[],
  columnMapping: MappingRow[],
): string[] {
  // 사용자가 매핑한 컬럼이 있으면 그것을 그대로 사용 (ignore 역할 제외)
  const assigned = columnMapping.filter(
    (r) => r.confirmedRole && r.confirmedRole !== "ignore",
  );
  if (assigned.length > 0) {
    return assigned.map((r) => r.originalName);
  }

  // 매핑 정보가 없을 때만 taskType 기반 기본 컬럼 셋으로 fallback
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
  return [];
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

function formatDateTime(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function buildReportId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const seq = String(Math.floor(d.getTime() / 1000) % 10000).padStart(4, "0");
  return `RPT-${y}-${seq}`;
}
