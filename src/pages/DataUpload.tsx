import { useNavigate } from "react-router";
import { useState } from "react";
import { apiUrl } from "@/lib/apiBase";
import { useWorkflowStore, stepToPath } from "../utils/stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import {
  DataUpload as DataUploadContent,
  isEvaluationDataUploadValid,
  isTrainingDatasetInfoValid,
  type DataUploadPhase,
} from "../components/data-upload/DataUpload";

/**
 * Step 4 ??Data Upload page
 */
export function DataUpload() {
  const navigate = useNavigate();
  const store = useWorkflowStore();
  const [phase, setPhase] = useState<DataUploadPhase>("evaluation");

  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (phase === "evaluation") {
      setPhase("training");
      return;
    }

    if (!store.rawFile) {
      alert("Evaluation file is missing. Please re-upload.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("task_type", store.taskType || "multiclass");
      formData.append("file", store.rawFile);

      const response = await fetch(apiUrl("/api/analyze-columns"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Server responded with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      const translateRole = (role: string) => {
        if (role === "sample_id") return "id";
        if (role === "ignore") return "ignore";
        if (role === "y_true" || role === "true_labels") return "y_true";
        if (role === "y_pred" || role === "pred_labels") return "y_pred";
        if (role === "score_positive") return "score";
        if (role === "prob_per_class") return "prob_class_*";
        if (role === "score_per_label") return "prob_label_*";
        return "ignore";
      };

      const mappedRows = result.column_mappings.map((m: any) => {
        const frontendRole = translateRole(m.role);
        return {
          originalName: m.column,
          sampleValues: m.sample_values || [],
          inferredRole: frontendRole,
          confirmedRole: frontendRole,
          modified: false,
          warnings: [],
        };
      });

      store.setColumnMapping(mappedRows);
      store.setMetadata(result.metadata);

      store.markStepCompleted(4);
      store.setCurrentStep(5);
      navigate(stepToPath(5));
    } catch (err: any) {
      console.error("Column analysis failed:", err);
      alert(`자동 컬럼 매핑 분석 실패: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (phase === "training") {
      setPhase("evaluation");
      return;
    }

    store.setCurrentStep(3);
    navigate(stepToPath(3));
  };

  const nextDisabled =
    phase === "evaluation"
      ? !isEvaluationDataUploadValid(store.datasetInfo, store.uploadedFile)
      : !isTrainingDatasetInfoValid(store.datasetInfo) || isLoading;

  return (
    <WorkflowShell
      showActionBar
      showPrevious={!isLoading}
      showNext={true}
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextDisabled={nextDisabled}
      nextLabel={isLoading ? "Analyzing..." : (phase === "evaluation" ? "Next: training dataset" : "Next step")}
    >
      <DataUploadContent
        phase={phase}
        onPhaseChange={setPhase}
        taskType={store.taskType}
        selectedMetricIds={store.selectedMetricIds}
        datasetInfo={store.datasetInfo}
        onDatasetInfoChange={store.setDatasetInfo}
        uploadedFile={store.uploadedFile}
        onUploadedFileChange={store.setUploadedFile}
        trainingExampleFiles={store.trainingExampleFiles}
        onTrainingExampleFilesChange={store.setTrainingExampleFiles}
        trainingUnsuitableExampleFiles={store.trainingUnsuitableExampleFiles}
        onTrainingUnsuitableExampleFilesChange={store.setTrainingUnsuitableExampleFiles}
      />
    </WorkflowShell>
  );
}
