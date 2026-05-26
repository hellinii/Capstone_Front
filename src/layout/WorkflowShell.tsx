import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router";
import { AppHeader } from "./components/AppHeader";
import { StepTabs } from "./components/StepTabs";
import { ActionBar } from "./components/ActionBar";
import { pathToStep, useWorkflowStore } from "../utils/stores/useWorkflowStore";

interface WorkflowShellProps {
  children: ReactNode;
  showActionBar?: boolean;
  showPrevious?: boolean;
  showNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  leftAction?: ReactNode;
}

/**
 * Shared layout shell for all workflow step pages.
 * Renders AppHeader + StepTabs once, wraps step-specific content in a consistent main container.
 * Also handles rendering the sticky ActionBar at the bottom if requested.
 */
export function WorkflowShell({ 
  children,
  showActionBar = false,
  showPrevious,
  showNext,
  onPrevious,
  onNext,
  nextDisabled,
  nextLabel,
  leftAction
}: WorkflowShellProps) {
  const location = useLocation();
  const isShowcaseMode = new URLSearchParams(location.search).get("showcase") === "1";

  useEffect(() => {
    const step = pathToStep(location.pathname);
    const store = useWorkflowStore.getState();
    store.setCurrentStep(step);

    if (isShowcaseMode) {
      store.setBasicInfo((prev) => ({
        ...prev,
        companyName: prev.companyName || "Apex AI Lab",
        representative: prev.representative || "Jane Lee",
        businessNumber: prev.businessNumber || "123-45-67890",
        phone: prev.phone || "02-1234-5678",
        address: prev.address || "Seoul, Korea",
        reportPurpose: prev.reportPurpose || "external",
        projectName: prev.projectName || "Document classification evaluation",
        projectAgency: prev.projectAgency || "Apex AI Lab",
        projectNumber: prev.projectNumber || "ML-EVAL-2026-001",
        modelName: prev.modelName || "ReviewClassifier-B",
        modelPurpose: prev.modelPurpose || "Classifies customer review sentiment for quality monitoring.",
        modelCategory: prev.modelCategory || "Text classification",
        taskType: "binary",
        envOS: prev.envOS || "Ubuntu 22.04",
        envCPU: prev.envCPU || "8 vCPU",
        envGPU: prev.envGPU || "NVIDIA T4",
        envMemory: prev.envMemory || "32 GB",
        envSoftware: prev.envSoftware || "Python 3.11 / PyTorch 2.x",
      }));
      store.setTaskType("binary");
      store.setSelectedMetricIds(["TC1", "TC2", "TC3", "TC4", "TC9", "TC21", "TC22", "TC23"]);
      store.setDatasetInfo({
        trainingDatasetName: "Binary review dataset",
        trainingSampleCount: "100",
        evaluationSampleCount: "100",
      });
      store.setUploadedFile({
        name: "eval_result_1775625159458.json",
        size: "42 KB",
        type: "application/json",
      });
      store.setTrainingExampleFiles([
        { name: "valid_review_examples.json", size: "18 KB", type: "application/json" },
      ]);
      store.setTrainingUnsuitableExampleFiles([
        { name: "edge_case_examples.json", size: "12 KB", type: "application/json" },
      ]);
      [1, 2, 3, 4].forEach((completedStep) => store.markStepCompleted(completedStep));
      store.setCurrentStep(step);
    }
  }, [location.pathname, location.search, isShowcaseMode]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative">
      <AppHeader />
      <StepTabs />
      <div className="flex-1 pb-8">
        {children}
      </div>
      {showActionBar && !isShowcaseMode && (
        <ActionBar 
          showPrevious={showPrevious}
          showNext={showNext}
          onPrevious={onPrevious}
          onNext={onNext}
          nextDisabled={nextDisabled}
          nextLabel={nextLabel}
          leftAction={leftAction}
        />
      )}
    </div>
  );
}
