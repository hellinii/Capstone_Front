import { selectionNeedsField, type TaskType } from "../evaluationData";
import type { ValidationDetailItem, ValidationResponse } from "../../types/validation.types";

/**
 * Generates a mock validation response for the data validation step.
 * This will be replaced with a real API call once the backend is ready.
 */
export function buildMockValidationResponse(
  taskType?: TaskType | "",
  selectedMetricIds: string[] = [],
): ValidationResponse {
  const resolvedTaskType: TaskType = taskType || "multiclass";
  const hasPositiveClassRequirement =
    resolvedTaskType === "binary" && selectionNeedsField(resolvedTaskType, selectedMetricIds, "positiveClass");
  const hasLatencyColumn = false;

  const validationDetails: ValidationDetailItem[] = [
    {
      name: "Missing value",
      result: "None",
      handling: "Exclude affected rows from evaluation",
      status: "pass",
      group: "common",
    },
    {
      name: "Duplicate ID",
      result: "None",
      handling: "Keep the first row and exclude later duplicates",
      status: "pass",
      group: "common",
    },
    {
      name: "Class mismatch",
      result: "None",
      handling: "Exclude affected rows from evaluation",
      status: "pass",
      group: "common",
    },
    {
      name: "Missing required column",
      result: "None",
      handling: "Stop evaluation",
      status: "pass",
      group: "common",
    },
    {
      name: "Excluded samples",
      result: "0 rows",
      handling: "Exclude only rows with missing or invalid values",
      status: "pass",
      group: "common",
    },
  ];

  if (resolvedTaskType === "multiclass") {
    validationDetails.push(
      {
        name: "Missing probability column",
        result: "None",
        handling: "Stop evaluation when required by selected metrics",
        status: "pass",
        group: "multiclass",
      },
      {
        name: "Probability sum error",
        result: "0 rows",
        handling: "Warn and continue",
        status: "pass",
        group: "multiclass",
      },
      {
        name: "Argmax and y_pred mismatch",
        result: "0 rows",
        handling: "Warn and continue",
        status: "pass",
        group: "multiclass",
      },
      {
        name: "Unknown class detected",
        result: "None",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
        group: "multiclass",
      },
    );
  }

  if (resolvedTaskType === "binary") {
    validationDetails.push(
      {
        name: "Missing positive class",
        result: hasPositiveClassRequirement ? "None" : "Not applicable",
        handling: hasPositiveClassRequirement ? "Stop evaluation" : "Skip this check",
        status: "pass",
        group: "binary",
      },
      {
        name: "Score range error",
        result: "0 rows",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
        group: "binary",
      },
      {
        name: "Binary class system error",
        result: "None",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
        group: "binary",
      },
    );
  }

  if (resolvedTaskType === "multilabel") {
    validationDetails.push(
      {
        name: "Label format mismatch",
        result: "None",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
        group: "multilabel",
      },
      {
        name: "Missing prob_label_* column",
        result: "None",
        handling: "Stop evaluation when required by selected metrics",
        status: "pass",
        group: "multilabel",
      },
      {
        name: "Label vocabulary mismatch",
        result: "None",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
        group: "multilabel",
      },
    );
  }

  if (hasLatencyColumn) {
    validationDetails.push(
      {
        name: "Latency value error",
        result: "0 rows",
        handling: "Exclude from latency statistics",
        status: "pass",
        group: "latency",
      },
      {
        name: "Latency missing value",
        result: "0 rows",
        handling: "Exclude from latency statistics",
        status: "pass",
        group: "latency",
      },
    );
  }

  const errorCount = validationDetails.filter((item) => item.status === "error").length;
  const warningCount = validationDetails.filter((item) => item.status === "warning").length;

  return {
    taskType: resolvedTaskType,
    selectedMetricIds: selectedMetricIds,
    executionSummary: [
      {
        label: "Total validated rows",
        value: "[N rows]",
        note: "Uploaded row count used as the base for validation.",
      },
      {
        label: "Valid prediction rows",
        value: "[N rows]",
        note: "Rows actually used for metric calculation after exclusions.",
      },
      {
        label: "Excluded samples",
        value: "[N rows]",
        note: "Rows excluded because of missing or invalid values.",
      },
      {
        label: "Selected metric count",
        value: `[${selectedMetricIds.length || "N"} items]`,
        note:
          selectedMetricIds.length > 0
            ? `Selected metrics: [${selectedMetricIds.join(", ")}]`
            : "No metrics selected.",
      },
      {
        label: "Validation result",
        value: `Errors [${errorCount}] / Warnings [${warningCount}]`,
        note: "See the detailed table below.",
      },
    ],
    validationDetails,
    errorCount,
    warningCount,
  };
}
