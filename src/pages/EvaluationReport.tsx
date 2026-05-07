import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { EvaluationReportStep } from "../components/evaluation-report/EvaluationReportStep";

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
    <WorkflowShell
      showActionBar
      showPrevious={true}
      showNext={false}
      onPrevious={handlePrevious}
    >
      <EvaluationReportStep
        report={store.getReport()}
      />
    </WorkflowShell>
  );
}
