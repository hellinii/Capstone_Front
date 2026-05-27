import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../utils/stores/useWorkflowStore";
import { useWorkspaceStore } from "../utils/stores/useWorkspaceStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { DataValidation as DataValidationContent } from "../components/data-validation/DataValidation";
import {
  mapWorkflowToFinalReport,
  type MapWorkflowToReportInput,
} from "../lib/report/mapWorkflowToFinalReport";

/**
 * Step 6 ??Data Validation page
 */
export function DataValidation() {
  const navigate = useNavigate();
  const store = useWorkflowStore();
  const { activeWorkspaceId, addEvaluationRun } = useWorkspaceStore();
  const [hasError, setHasError] = useState(false);

  const handleNext = () => {
    const workflowSnapshot: MapWorkflowToReportInput = {
      basicInfo: store.basicInfo,
      datasetInfo: store.datasetInfo,
      taskType: store.taskType,
      selectedMetricIds: store.selectedMetricIds,
      metricDetails: store.metricDetails,
      uploadedFile: store.uploadedFile,
      trainingExampleFiles: store.trainingExampleFiles,
      trainingUnsuitableExampleFiles: store.trainingUnsuitableExampleFiles,
      columnMapping: store.columnMapping,
    };
    const reportData = mapWorkflowToFinalReport(workflowSnapshot);

    store.markStepCompleted(6);
    store.setCurrentStep(7);

    if (activeWorkspaceId) {
      const run = addEvaluationRun({
        workspaceId: activeWorkspaceId,
        modelName: store.basicInfo.modelName || "Untitled model",
        versionName: store.basicInfo.versionName || "v1.0.0",
        reportId: reportData.meta.reportId,
        workflowSnapshot,
        reportData,
      });

      navigate(`/report/${run.id}`);
      return;
    }

    navigate(stepToPath(7));
  };

  const handlePrevious = () => {
    store.setCurrentStep(5);
    navigate(stepToPath(5));
  };

  return (
    <WorkflowShell
      showActionBar
      showPrevious={true}
      showNext={true}
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextDisabled={hasError}
      nextLabel="Run evaluation"
    >
      <DataValidationContent
        taskType={store.taskType}
        selectedMetricIds={store.selectedMetricIds}
        onValidationChange={setHasError}
      />
    </WorkflowShell>
  );
}
