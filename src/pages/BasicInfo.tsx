import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { BasicInfo as BasicInfoContent } from "../components/basic-info/BasicInfo";

/**
 * Step 1 — Basic Info page
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
    <WorkflowShell>
      <BasicInfoContent
        onNext={handleNext}
        formData={store.basicInfo}
        onFormDataChange={store.setBasicInfo}
        onTaskTypeChange={(type) => store.setTaskType(type as any)}
      />
    </WorkflowShell>
  );
}
