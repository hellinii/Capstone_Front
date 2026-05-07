import { selectionNeedsField, type TaskType } from "../evaluationData";
import type { ValidationDetailItem, ValidationResponse } from "../../types/validation.types";

/**
 * Generates a mock validation response for the data validation step.
 * This will be replaced with a real API call once the backend is ready.
 */
export function buildMockValidationResponse(
  taskType?: TaskType | "",
  selectedTCIds: string[] = [],
): ValidationResponse {
  const resolvedTaskType: TaskType = taskType || "multiclass";
  const hasPositiveClassRequirement =
    resolvedTaskType === "binary" && selectionNeedsField(resolvedTaskType, selectedTCIds, "positiveClass");
  const hasLatencyColumn = false;

  const validationDetails: ValidationDetailItem[] = [
    {
      name: "Missing value",
      result: "None",
      handling: "Exclude affected rows from evaluation",
      status: "pass",
    },
    {
      name: "Duplicate ID",
      result: "None",
      handling: "Keep the first row and exclude later duplicates",
      status: "pass",
    },
    {
      name: "Class mismatch",
      result: "None",
      handling: "Exclude affected rows from evaluation",
      status: "pass",
    },
    {
      name: "Missing required column",
      result: "None",
      handling: "Stop evaluation",
      status: "pass",
    },
    {
      name: "Excluded samples",
      result: "0 rows",
      handling: "Exclude only rows with missing or invalid values",
      status: "pass",
    },
  ];

  if (resolvedTaskType === "multiclass") {
    validationDetails.push(
      {
        name: "Missing probability column",
        result: "None",
        handling: "Stop evaluation when required by selected TCs",
        status: "pass",
      },
      {
        name: "Probability sum error",
        result: "0 rows",
        handling: "Warn and continue",
        status: "pass",
      },
      {
        name: "Argmax and y_pred mismatch",
        result: "0 rows",
        handling: "Warn and continue",
        status: "pass",
      },
      {
        name: "Unknown class detected",
        result: "None",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
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
      },
      {
        name: "Score range error",
        result: "0 rows",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
      },
      {
        name: "Binary class system error",
        result: "None",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
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
      },
      {
        name: "Missing prob_label_* column",
        result: "None",
        handling: "Stop evaluation when required by selected TCs",
        status: "pass",
      },
      {
        name: "Label vocabulary mismatch",
        result: "None",
        handling: "Exclude affected rows from evaluation",
        status: "pass",
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
      },
      {
        name: "Latency missing value",
        result: "0 rows",
        handling: "Exclude from latency statistics",
        status: "pass",
      },
    );
  }

  const errorCount = validationDetails.filter((item) => item.status === "error").length;
  const warningCount = validationDetails.filter((item) => item.status === "warning").length;

  return {
    taskType: resolvedTaskType,
    selectedTcIds: selectedTCIds,
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
        label: "Selected TC count",
        value: `[${selectedTCIds.length || "N"} items]`,
        note:
          selectedTCIds.length > 0
            ? `Selected TCs: [${selectedTCIds.join(", ")}]`
            : "No test cases selected.",
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
