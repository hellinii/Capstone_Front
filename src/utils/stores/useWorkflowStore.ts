/**
 * 워크플로우 전역 상태 관리 (Zustand)
 *
 * 이 스토어는 전체 평가 워크플로우의 상태(각 스텝의 입력 데이터, 현재 단계, 완료 여부 등)를
 * 관리하며, 최종 평가 리포트 데이터를 생성하는 로직을 포함합니다.
 */
import { create } from "zustand";
import { createEvaluationReport } from "../../lib/report/createEvaluationReport";
import type { TaskType } from "../../data/evaluationData";
import {
  DEFAULT_BASIC_INFO,
  DEFAULT_DATASET_INFO,
  type BasicInfoFormData,
  type DatasetInfoFormData,
  type MetricDetailStateMap,
  type UploadedFileInfo,
} from "../../types/workflow.types";
import type { EvaluationReportData } from "../../types/report.types";

/** Step path segments used in routing */
export const STEP_PATHS = [
  "basic-info",
  "test-items",
  "tc-detail",
  "data-upload",
  "column-mapping",
  "data-validation",
  "report",
] as const;

export type StepPath = (typeof STEP_PATHS)[number];

/** Convert a 1-based step number to a route path */
export function stepToPath(step: number): string {
  return `/step/${STEP_PATHS[step - 1] ?? STEP_PATHS[0]}`;
}

/** Convert a route path segment to a 1-based step number */
export function pathToStep(path: string): number {
  const segment = path.replace("/step/", "");
  const index = STEP_PATHS.indexOf(segment as StepPath);
  return index >= 0 ? index + 1 : 1;
}

interface WorkflowState {
  // Navigation
  currentStep: number;
  completedSteps: number[];

  // Step 1 — Basic info
  basicInfo: BasicInfoFormData;
  taskType: TaskType | "";

  // Step 2 — Metric selection
  selectedMetricIds: string[];

  // Step 3 — Metric details
  metricDetails: MetricDetailStateMap;

  // Step 4 — Data upload
  uploadedFile: UploadedFileInfo | null;
  datasetInfo: DatasetInfoFormData;

  // Actions — Navigation
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;

  // Actions — Step 1
  setBasicInfo: (
    value: BasicInfoFormData | ((prev: BasicInfoFormData) => BasicInfoFormData),
  ) => void;
  setTaskType: (type: TaskType | "") => void;

  // Actions — Step 2
  setSelectedMetricIds: (ids: string[]) => void;

  // Actions — Step 3
  setMetricDetails: (
    value: MetricDetailStateMap | ((prev: MetricDetailStateMap) => MetricDetailStateMap),
  ) => void;

  // Actions — Step 4
  setUploadedFile: (file: UploadedFileInfo | null) => void;
  setDatasetInfo: (
    value:
      | DatasetInfoFormData
      | ((prev: DatasetInfoFormData) => DatasetInfoFormData),
  ) => void;

  // Derived
  getReport: () => EvaluationReportData;

  // Reset
  resetWorkflow: () => void;
}

const INITIAL_STATE = {
  currentStep: 1,
  completedSteps: [] as number[],
  basicInfo: DEFAULT_BASIC_INFO,
  taskType: "" as TaskType | "",
  selectedMetricIds: [] as string[],
  metricDetails: {} as MetricDetailStateMap,
  uploadedFile: null as UploadedFileInfo | null,
  datasetInfo: DEFAULT_DATASET_INFO,
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...INITIAL_STATE,

  // Navigation
  setCurrentStep: (step) => set({ currentStep: step }),

  markStepCompleted: (step) =>
    set((state) => ({
      completedSteps: [...new Set([...state.completedSteps, step])],
    })),

  // Step 1
  setBasicInfo: (value) =>
    set((state) => ({
      basicInfo:
        typeof value === "function" ? value(state.basicInfo) : value,
    })),

  setTaskType: (type) =>
    set({
      taskType: type,
      selectedMetricIds: [],
      metricDetails: {},
      uploadedFile: null,
    }),

  // Step 2
  setSelectedMetricIds: (ids) => set({ selectedMetricIds: ids }),

  // Step 3
  setMetricDetails: (value) =>
    set((state) => ({
      metricDetails:
        typeof value === "function" ? value(state.metricDetails) : value,
    })),

  // Step 4
  setUploadedFile: (file) => set({ uploadedFile: file }),

  setDatasetInfo: (value) =>
    set((state) => ({
      datasetInfo:
        typeof value === "function" ? value(state.datasetInfo) : value,
    })),

  // Derived
  getReport: () => {
    const state = get();
    return createEvaluationReport({
      basicInfo: state.basicInfo,
      datasetInfo: state.datasetInfo,
      taskType: state.taskType,
      selectedMetricIds: state.selectedMetricIds,
      metricDetails: state.metricDetails,
      uploadedFile: state.uploadedFile,
    });
  },

  // Reset
  resetWorkflow: () => set(INITIAL_STATE),
}));
