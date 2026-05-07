import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { TCDetailInput } from "../components/tc-detail/TCDetailInput";

/**
 * Step 3 — TC Detail page
 */
export function TCDetail() {
  const navigate = useNavigate();
  const store = useWorkflowStore();

  const handleNext = () => {
    store.markStepCompleted(3);
    store.setCurrentStep(4);
    navigate(stepToPath(4));
  };

  const handlePrevious = () => {
    store.setCurrentStep(2);
    navigate(stepToPath(2));
  };

  return (
    <WorkflowShell>
      <TCDetailInput
        onNext={handleNext}
        onPrevious={handlePrevious}
        taskType={store.taskType}
        selectedTCIds={store.selectedTCIds}
        tcDetails={store.tcDetails}
        onTcDetailsChange={store.setTcDetails}
      />
    </WorkflowShell>
  );
}
