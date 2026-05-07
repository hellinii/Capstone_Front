import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../utils/stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { TestItems as TestItemsContent } from "../components/test-items/TestItems";

/**
 * Step 2 — Test Items page
 */
export function TestItems() {
  const navigate = useNavigate();
  const store = useWorkflowStore();

  const handleNext = () => {
    store.markStepCompleted(2);
    store.setCurrentStep(3);
    navigate(stepToPath(3));
  };

  const handlePrevious = () => {
    store.setCurrentStep(1);
    navigate(stepToPath(1));
  };

  return (
    <WorkflowShell
      showActionBar
      showPrevious={true}
      showNext={true}
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextDisabled={store.selectedTCIds.length === 0}
      nextLabel="Next step"
    >
      <TestItemsContent
        taskType={store.taskType}
        onSelectedTCsChange={store.setSelectedTCIds}
      />
    </WorkflowShell>
  );
}
