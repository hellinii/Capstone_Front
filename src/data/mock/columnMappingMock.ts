import type { RequiredColumnCode, TaskType } from "../evaluationData";
import type { BackendMappingResponse } from "../../types/mapping.types";

/**
 * Generates a mock backend response for the column mapping step.
 * This will be replaced with a real API call once the backend is ready.
 */
export function buildMockBackendResponse(taskType: TaskType, requiredRoles: RequiredColumnCode[]): BackendMappingResponse {
  if (taskType === "binary") {
    return {
      taskType,
      requiredRoles,
      rows: [
        {
          originalName: "row_id",
          sampleValues: ["S001", "S002", "S003"],
          inferredRole: "id",
          confirmedRole: "id",
          modified: false,
          warnings: [],
        },
        {
          originalName: "actual_result",
          sampleValues: ["1", "0", "1"],
          inferredRole: "y_true",
          confirmedRole: "y_true",
          modified: false,
          warnings: [],
        },
        {
          originalName: "predicted_result",
          sampleValues: ["1", "1", "1"],
          inferredRole: "y_pred",
          confirmedRole: "y_pred",
          modified: false,
          warnings: [],
        },
        {
          originalName: "positive_score",
          sampleValues: ["0.92", "0.67", "0.88"],
          inferredRole: "score",
          confirmedRole: "score",
          modified: false,
          warnings: ["Please review this mapping. The column may contain score or probability values."],
        },
        {
          originalName: "comment",
          sampleValues: ["pass", "review", "retry"],
          inferredRole: "ignore",
          confirmedRole: "ignore",
          modified: false,
          warnings: [],
        },
      ],
    };
  }

  if (taskType === "multilabel") {
    return {
      taskType,
      requiredRoles,
      rows: [
        {
          originalName: "sample_id",
          sampleValues: ["S001", "S002", "S003"],
          inferredRole: "id",
          confirmedRole: "id",
          modified: false,
          warnings: [],
        },
        {
          originalName: "gold_labels",
          sampleValues: ["sports|news", "news", "finance|policy"],
          inferredRole: "y_true",
          confirmedRole: "y_true",
          modified: false,
          warnings: [],
        },
        {
          originalName: "model_labels",
          sampleValues: ["sports", "news", "finance"],
          inferredRole: "y_pred",
          confirmedRole: "y_pred",
          modified: false,
          warnings: [],
        },
        {
          originalName: "prob_news",
          sampleValues: ["0.63", "0.91", "0.08"],
          inferredRole: "prob_label_*",
          confirmedRole: "prob_label_*",
          modified: false,
          warnings: [],
        },
        {
          originalName: "prob_sports",
          sampleValues: ["0.74", "0.09", "0.11"],
          inferredRole: "prob_label_*",
          confirmedRole: "prob_label_*",
          modified: false,
          warnings: [],
        },
      ],
    };
  }

  // multiclass (default)
  return {
    taskType,
    requiredRoles,
    rows: [
      {
        originalName: "sample_id",
        sampleValues: ["S001", "S002", "S003"],
        inferredRole: "id",
        confirmedRole: "id",
        modified: false,
        warnings: [],
      },
      {
        originalName: "actual_label",
        sampleValues: ["cat", "dog", "bird"],
        inferredRole: "y_true",
        confirmedRole: "y_true",
        modified: false,
        warnings: [],
      },
      {
        originalName: "predicted_label",
        sampleValues: ["cat", "cat", "dog"],
        inferredRole: "y_pred",
        confirmedRole: "y_pred",
        modified: false,
        warnings: [],
      },
      {
        originalName: "p_cat",
        sampleValues: ["0.92", "0.10", "0.08"],
        inferredRole: "prob_class_*",
        confirmedRole: "prob_class_*",
        modified: false,
        warnings: [],
      },
      {
        originalName: "p_dog",
        sampleValues: ["0.05", "0.62", "0.86"],
        inferredRole: "prob_class_*",
        confirmedRole: "prob_class_*",
        modified: false,
        warnings: [],
      },
      {
        originalName: "p_bird",
        sampleValues: ["0.03", "0.28", "0.06"],
        inferredRole: "prob_class_*",
        confirmedRole: "prob_class_*",
        modified: false,
        warnings: [],
      },
      {
        originalName: "memo",
        sampleValues: ["test", "final", "v2"],
        inferredRole: null,
        confirmedRole: null,
        modified: false,
        warnings: ["No matching role was inferred for this column."],
      },
    ],
  };
}
