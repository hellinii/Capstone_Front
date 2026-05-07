import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { DataValidation as DataValidationContent } from "../components/data-validation/DataValidation";

/**
 * Step 6 — Data Validation page
 */
export function DataValidation() {
  const navigate = useNavigate();
  const store = useWorkflowStore();
  const [hasError, setHasError] = useState(false);

  const handleNext = () => {
    store.markStepCompleted(6);
    store.setCurrentStep(7);
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
        selectedTCIds={store.selectedTCIds}
        onValidationChange={setHasError}
      />
    </WorkflowShell>
  );
}
