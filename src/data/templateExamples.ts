import type { TaskType } from "./evaluationData";

/**
 * CSV template examples per task type.
 */
export function getCsvExample(taskType: TaskType, requiresProb: boolean): string {
  if (taskType === "binary") {
    return requiresProb
      ? "id,y_true,y_pred,score,inference_time_ms\nS001,1,1,0.92,12.4\nS002,0,1,0.67,11.8\nS003,1,1,0.88,9.3"
      : "id,y_true,y_pred,inference_time_ms\nS001,1,1,12.4\nS002,0,1,11.8\nS003,1,1,9.3";
  }

  if (taskType === "multilabel") {
    return requiresProb
      ? "id,y_true,y_pred,prob_label_sports,prob_label_news,inference_time_ms\nS001,sports|news,sports,0.92,0.08,12.4\nS002,news,news,0.14,0.86,11.8"
      : "id,y_true,y_pred,inference_time_ms\nS001,sports|news,sports,12.4\nS002,news,news,11.8";
  }

  return requiresProb
    ? "id,y_true,y_pred,prob_class_cat,prob_class_dog,prob_class_bird,inference_time_ms\nS001,cat,cat,0.92,0.05,0.03,12.4\nS002,bird,dog,0.10,0.62,0.28,11.8"
    : "id,y_true,y_pred,inference_time_ms\nS001,cat,cat,12.4\nS002,bird,dog,11.8";
}

/**
 * JSON template examples per task type.
 */
export function getJsonExample(taskType: TaskType, requiresProb: boolean): string {
  if (taskType === "binary") {
    return requiresProb
      ? '{\n  "samples": [\n    { "id": "S001", "y_true": 1, "y_pred": 1, "score": 0.92, "inference_time_ms": 12.4 }\n  ]\n}'
      : '{\n  "samples": [\n    { "id": "S001", "y_true": 1, "y_pred": 1, "inference_time_ms": 12.4 }\n  ]\n}';
  }

  if (taskType === "multilabel") {
    return requiresProb
      ? '{\n  "samples": [\n    { "id": "S001", "y_true": "sports|news", "y_pred": "sports", "prob_label_sports": 0.92, "inference_time_ms": 12.4 }\n  ]\n}'
      : '{\n  "samples": [\n    { "id": "S001", "y_true": "sports|news", "y_pred": "sports", "inference_time_ms": 12.4 }\n  ]\n}';
  }

  return requiresProb
    ? '{\n  "samples": [\n    { "id": "S001", "y_true": "cat", "y_pred": "cat", "prob_class_cat": 0.92, "inference_time_ms": 12.4 }\n  ]\n}'
    : '{\n  "samples": [\n    { "id": "S001", "y_true": "cat", "y_pred": "cat", "inference_time_ms": 12.4 }\n  ]\n}';
}
