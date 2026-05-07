import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../stores/useWorkflowStore";
import { WorkflowShell } from "../layout/WorkflowShell";
import { TCDetailInput, isCurrentTCValid } from "../components/tc-detail/TCDetailInput";
import { getSelectedTestCases } from "../data/evaluationData";

/**
 * Step 3 — TC Detail page
 */
export function TCDetail() {
  const navigate = useNavigate();
  const store = useWorkflowStore();
  const [currentTCIndex, setCurrentTCIndex] = useState(0);

  const resolvedTaskType = store.taskType || "multiclass";
  const selectedTCs = useMemo(
    () => getSelectedTestCases(resolvedTaskType, store.selectedTCIds),
    [resolvedTaskType, store.selectedTCIds]
  );

  const handleNext = () => {
    const currentTC = selectedTCs[currentTCIndex];
    if (currentTC) {
      store.setTcDetails((prev) => ({
        ...prev,
        [currentTC.id]: { ...prev[currentTC.id], completed: true },
      }));
    }

    if (currentTCIndex < selectedTCs.length - 1) {
      setCurrentTCIndex((prev) => prev + 1);
    } else {
      store.markStepCompleted(3);
      store.setCurrentStep(4);
      navigate(stepToPath(4));
    }
  };

  const handlePrevious = () => {
    if (currentTCIndex > 0) {
      setCurrentTCIndex((prev) => prev - 1);
    } else {
      store.setCurrentStep(2);
      navigate(stepToPath(2));
    }
  };

  const currentTC = selectedTCs[currentTCIndex];
  const currentState = currentTC ? store.tcDetails[currentTC.id] : undefined;
  const isComplete =
    currentTC && currentState
      ? isCurrentTCValid(store.taskType, currentTC.id, currentState)
      : false;

  return (
    <WorkflowShell
      showActionBar
      showPrevious={true}
      showNext={true}
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextDisabled={!isComplete}
      nextLabel={currentTCIndex < selectedTCs.length - 1 ? "Next TC" : "Finish"}
    >
      <TCDetailInput
        taskType={store.taskType}
        selectedTCIds={store.selectedTCIds}
        tcDetails={store.tcDetails}
        onTcDetailsChange={store.setTcDetails}
        currentTCIndex={currentTCIndex}
        onCurrentTCIndexChange={setCurrentTCIndex}
      />
    </WorkflowShell>
  );
}
