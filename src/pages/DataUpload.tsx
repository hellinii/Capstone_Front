import { useNavigate } from "react-router";
import { useState } from "react";
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

  const handleNext = () => {
    if (phase === "evaluation") {
      setPhase("training");
      return;
    }

    store.markStepCompleted(4);
    store.setCurrentStep(5);
    navigate(stepToPath(5));
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
      : !isTrainingDatasetInfoValid(store.datasetInfo);

  return (
    <WorkflowShell
      showActionBar
      showPrevious={true}
      showNext={true}
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextDisabled={nextDisabled}
      nextLabel={phase === "evaluation" ? "Next: training dataset" : "Next step"}
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
