import { useNavigate } from "react-router";
import { BarChart3, Columns3, FileBarChart, ListChecks, ShieldCheck, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/styling/styles";
import { useWorkflowStore, stepToPath, STEP } from "../../utils/stores/useWorkflowStore";

/**
 * 평가 구간의 단계 탭. **`STEP_PATHS` 와 순서가 같아야 한다**(번호 = 배열 위치).
 *
 * 성적서 발급 단계는 여기 없다 — 평가만 하고 끝내는 것이 정상 동선이고, 성적서는
 * 평가 결과 화면에서 이어지는 별도 구간이다.
 */
const steps: { label: string; Icon: LucideIcon }[] = [
  { label: "Data upload", Icon: Upload },
  { label: "Metrics", Icon: ListChecks },
  { label: "Column mapping", Icon: Columns3 },
  { label: "Validation", Icon: ShieldCheck },
  { label: "Evaluation", Icon: BarChart3 },
  { label: "Result", Icon: FileBarChart },
];

export function StepTabs() {
  const navigate = useNavigate();
  const currentStep = useWorkflowStore((s) => s.currentStep);
  const completedSteps = useWorkflowStore((s) => s.completedSteps);
  const lastRunId = useWorkflowStore((s) => s.lastRunId);

  const handleStepClick = (step: number) => {
    useWorkflowStore.getState().setCurrentStep(step);
    // run 이 필요한 단계는 방금 만든 run 으로 보낸다. stepToPath 는 목적지를 모르므로
    // 워크스페이스 목록을 가리킨다 — 종전에는 저장되지 않는 빈 성적서로 갔다(E-16·E-06).
    if (lastRunId) {
      if (step === STEP.SUMMARY) {
        navigate(`/report/${lastRunId}/summary`);
        return;
      }
      if (step === STEP.RESULT) {
        navigate(`/report/${lastRunId}`);
        return;
      }
    }
    navigate(stepToPath(step));
  };

  return (
    <div className="h-12 border-b border-border bg-card sticky top-14 z-40">
      <div className="h-full px-8 max-w-[1344px] mx-auto">
        <div className="h-full flex items-stretch">
          {steps.map(({ label, Icon }, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = completedSteps.includes(stepNumber);
            const isUpcoming = stepNumber > currentStep && !isCompleted;

            return (
              <button
                key={stepNumber}
                onClick={() => !isUpcoming && handleStepClick(stepNumber)}
                disabled={isUpcoming}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 relative",
                  "transition-colors",
                  isActive && "font-medium",
                  isCompleted && "cursor-pointer hover:bg-muted/50",
                  isUpcoming && "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center h-5 w-5 rounded-full",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-blue-50 text-foreground",
                    isUpcoming && "border border-border text-muted-foreground",
                  )}
                >
                  <Icon className="h-3 w-3" />
                </span>

                <span
                  className={cn(
                    "text-sm hidden md:inline",
                    isActive && "text-foreground font-medium",
                    isCompleted && "text-foreground",
                    isUpcoming && "text-muted-foreground",
                  )}
                >
                  {label}
                </span>

                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
