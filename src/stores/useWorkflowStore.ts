import { create } from "zustand";
import { createEvaluationReport } from "../lib/report/createEvaluationReport";
import type { TaskType } from "../data/evaluationData";
import {
  DEFAULT_BASIC_INFO,
  DEFAULT_DATASET_INFO,
  type BasicInfoFormData,
  type DatasetInfoFormData,
  type TcDetailStateMap,
  type UploadedFileInfo,
} from "../types/workflow.types";
import type { EvaluationReportData } from "../types/report.types";

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

  // Step 2 — Test items
  selectedTCIds: string[];

  // Step 3 — TC details
  tcDetails: TcDetailStateMap;

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
  setSelectedTCIds: (ids: string[]) => void;

  // Actions — Step 3
  setTcDetails: (
    value: TcDetailStateMap | ((prev: TcDetailStateMap) => TcDetailStateMap),
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
  selectedTCIds: [] as string[],
  tcDetails: {} as TcDetailStateMap,
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
      selectedTCIds: [],
      tcDetails: {},
      uploadedFile: null,
    }),

  // Step 2
  setSelectedTCIds: (ids) => set({ selectedTCIds: ids }),

  // Step 3
  setTcDetails: (value) =>
    set((state) => ({
      tcDetails:
        typeof value === "function" ? value(state.tcDetails) : value,
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
      selectedTCIds: state.selectedTCIds,
      tcDetails: state.tcDetails,
      uploadedFile: state.uploadedFile,
    });
  },

  // Reset
  resetWorkflow: () => set(INITIAL_STATE),
}));
