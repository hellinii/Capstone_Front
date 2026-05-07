import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../utils/stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { DataUpload as DataUploadContent, isDataUploadValid } from "../components/data-upload/DataUpload";

/**
 * Step 4 ??Data Upload page
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
    <WorkflowShell
      showActionBar
      showPrevious={true}
      showNext={true}
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextDisabled={!isDataUploadValid(store.datasetInfo, store.uploadedFile)}
      nextLabel="Next step"
    >
      <DataUploadContent
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
