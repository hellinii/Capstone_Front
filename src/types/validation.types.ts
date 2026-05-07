import type { TaskType } from "../data/evaluationData";

export type ValidationStatus = "pass" | "warning" | "error";

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
}

export interface ValidationResponse {
  taskType: TaskType;
  selectedTcIds: string[];
  executionSummary: ExecutionSummaryItem[];
  validationDetails: ValidationDetailItem[];
  errorCount: number;
  warningCount: number;
}
