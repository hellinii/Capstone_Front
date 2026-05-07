import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { ActionBar } from "../layout/ActionBar";
import { BasicInfo as BasicInfoContent } from "../components/home/BasicInfo";

/**
 * Step 1 — Basic Info page (bridge: wraps legacy component in new layout)
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
        currentStep={store.currentStep}
        completedSteps={store.completedSteps}
        onStepClick={(step) => {
          store.setCurrentStep(step);
          navigate(stepToPath(step));
        }}
        onNext={handleNext}
        onPrevious={() => {}}
        formData={store.basicInfo}
        onFormDataChange={store.setBasicInfo}
        onTaskTypeChange={(type) => store.setTaskType(type as any)}
      />
    </WorkflowShell>
  );
}
