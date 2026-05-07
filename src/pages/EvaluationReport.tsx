import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { EvaluationReportStep } from "../components/home/EvaluationReportStep";

/**
 * Step 7 — Evaluation Report page
 */
export function EvaluationReport() {
  const navigate = useNavigate();
  const store = useWorkflowStore();

  const handlePrevious = () => {
    store.setCurrentStep(6);
    navigate(stepToPath(6));
  };

  return (
    <WorkflowShell>
      <EvaluationReportStep
        currentStep={store.currentStep}
        completedSteps={store.completedSteps}
        onStepClick={(step) => {
          store.setCurrentStep(step);
          navigate(stepToPath(step));
        }}
        onPrevious={handlePrevious}
        report={store.getReport()}
      />
    </WorkflowShell>
  );
}
