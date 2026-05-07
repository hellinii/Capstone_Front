import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { DataUpload as DataUploadContent } from "../components/home/DataUpload";

/**
 * Step 4 — Data Upload page
 */
export function DataUpload() {
  const navigate = useNavigate();
  const store = useWorkflowStore();

  const handleNext = () => {
    store.markStepCompleted(4);
    store.setCurrentStep(5);
    navigate(stepToPath(5));
  };

  const handlePrevious = () => {
    store.setCurrentStep(3);
    navigate(stepToPath(3));
  };

  return (
    <WorkflowShell>
      <DataUploadContent
        currentStep={store.currentStep}
        completedSteps={store.completedSteps}
        onStepClick={(step) => {
          store.setCurrentStep(step);
          navigate(stepToPath(step));
        }}
        onNext={handleNext}
        onPrevious={handlePrevious}
        taskType={store.taskType}
        selectedTCIds={store.selectedTCIds}
        datasetInfo={store.datasetInfo}
        onDatasetInfoChange={store.setDatasetInfo}
        uploadedFile={store.uploadedFile}
        onUploadedFileChange={store.setUploadedFile}
      />
    </WorkflowShell>
  );
}
