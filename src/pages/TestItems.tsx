import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { TestItems as TestItemsContent } from "../components/home/TestItems";

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
    <WorkflowShell>
      <TestItemsContent
        currentStep={store.currentStep}
        completedSteps={store.completedSteps}
        onStepClick={(step) => {
          store.setCurrentStep(step);
          navigate(stepToPath(step));
        }}
        onNext={handleNext}
        onPrevious={handlePrevious}
        taskType={store.taskType}
        onSelectedTCsChange={store.setSelectedTCIds}
      />
    </WorkflowShell>
  );
}
