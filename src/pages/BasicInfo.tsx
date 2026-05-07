import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../utils/stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { BasicInfo as BasicInfoContent, isBasicInfoValid } from "../components/basic-info/BasicInfo";

import { Button } from "../components/ui/button";

/**
 * Step 1 ??Basic Info page
 */
export function BasicInfo() {
  const navigate = useNavigate();
  const store = useWorkflowStore();

  const handleNext = () => {
    store.markStepCompleted(1);
    store.setCurrentStep(2);
    navigate(stepToPath(2));
  };

  return (
    <WorkflowShell
      showActionBar
      showPrevious={false}
      onNext={handleNext}
      nextDisabled={!isBasicInfoValid(store.basicInfo)}
      nextLabel="Next step"
      leftAction={<Button variant="outline">Save draft</Button>}
    >
      <BasicInfoContent
        formData={store.basicInfo}
        onFormDataChange={store.setBasicInfo}
        onTaskTypeChange={(type) => store.setTaskType(type as any)}
      />
    </WorkflowShell>
  );
}
