import type { TaskType } from "../data/evaluationData";

export type ValidationStatus = "pass" | "warning" | "error";
export type ValidationGroup = "common" | "multiclass" | "binary" | "multilabel" | "latency";

export interface ExecutionSummaryItem {
  label: string;
  value: string;
  note: string;
}

export interface ValidationDetailItem {
  name: string;
  result: string;
  handling: string;
  status: ValidationStatus;
  group: ValidationGroup;
}

export interface ValidationResponse {
  taskType: TaskType;
  selectedMetricIds: string[];
  executionSummary: ExecutionSummaryItem[];
  validationDetails: ValidationDetailItem[];
  errorCount: number;
  warningCount: number;
}
