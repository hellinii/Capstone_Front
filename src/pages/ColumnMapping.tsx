import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../utils/stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { ColumnMapping as ColumnMappingContent } from "../components/column-mapping/ColumnMapping";

/**
 * Step 5 ??Column Mapping page
 */
export function ColumnMapping() {
  const navigate = useNavigate();
  const store = useWorkflowStore();
  const [isValid, setIsValid] = useState(false);

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
    <WorkflowShell
      showActionBar
      showPrevious={true}
      showNext={true}
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextDisabled={!isValid}
      nextLabel="Confirm mapping"
    >
      <ColumnMappingContent
        taskType={store.taskType}
        selectedMetricIds={store.selectedMetricIds}
        rows={store.columnMapping}
        onRowsChange={store.setColumnMapping}
        onValidationChange={setIsValid}
        classLabelDescriptions={store.classLabelDescriptions}
        onClassLabelDescriptionsChange={store.setClassLabelDescriptions}
      />
    </WorkflowShell>
  );
}
