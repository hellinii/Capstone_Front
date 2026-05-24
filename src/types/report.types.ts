export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][];
  totalSamples: number;
}

export interface ReportRecommendation {
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  action: string;
  expectedImpact: string;
}
