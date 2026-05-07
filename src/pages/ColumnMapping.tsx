import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { ColumnMapping as ColumnMappingContent } from "../components/column-mapping/ColumnMapping";

/**
 * Step 5 — Column Mapping page
 */
export function ColumnMapping() {
  const navigate = useNavigate();
  const store = useWorkflowStore();

  const handleNext = () => {
    store.markStepCompleted(5);
    store.setCurrentStep(6);
    navigate(stepToPath(6));
  };

  const handlePrevious = () => {
    store.setCurrentStep(4);
    navigate(stepToPath(4));
  };

  return (
    <WorkflowShell>
      <ColumnMappingContent
        onNext={handleNext}
        onPrevious={handlePrevious}
        taskType={store.taskType}
        selectedTCIds={store.selectedTCIds}
      />
    </WorkflowShell>
  );
}
