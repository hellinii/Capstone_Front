import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { WorkflowShell } from "../../layout/WorkflowShell";
import { EvaluationSummary as EvaluationSummaryContent } from "../../components/evaluation-summary/EvaluationSummary";
import { ReportLoadingState } from "../../components/report/ReportLoadingState";
import { ReportErrorState } from "../../components/report/ReportErrorState";
import { useReportData } from "../../hooks/useReportData";
import { useWorkflowStore, STEP } from "../../utils/stores/useWorkflowStore";
import { useWorkspaceStore } from "../../utils/stores/useWorkspaceStore";

/**
 * Step 5 — 평가 결과.
 *
 * 검증(4)과 성적서(6) 사이에 있다. 고른 지표의 값만 보여주고 **합불 판정은 하지 않는다** —
 * 목표값은 성적서 구간에서 받으므로 이 시점엔 기준이 없다.
 *
 * 경로가 `/report/:id/summary` 인 이유: 평가 결과는 run 하나에 매인 데이터다. `/app/*` 아래
 * 두면 어느 run 을 보는지 URL 이 말하지 못해, 새로고침·공유·뒤로가기가 전부 깨진다.
 * `useReportData` 가 저장된 run 을 읽거나 없으면 평가를 실행한다.
 */
export function EvaluationSummary() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { data, isLoading, error } = useReportData(id);
  const compareTo = useCompareLink(id);

  // 탭 하이라이트를 이 단계로 맞춘다. WorkflowShell 은 `/app/*` 경로에서만 단계를
  // 유도하는데, 이 화면은 `/report/*` 라 유도가 되지 않는다.
  useEffect(() => {
    const store = useWorkflowStore.getState();
    store.setCurrentStep(STEP.SUMMARY);
    store.markStepCompleted(STEP.SUMMARY);
  }, []);

  const handleNext = () => navigate(`/report/${id}/issue-info`);
  const handlePrevious = () => navigate("/app/data-validation");

  if (isLoading) return <ReportLoadingState />;
  if (error) return <ReportErrorState error={error} onBack={handlePrevious} />;
  if (!data) return null;

  return (
    <WorkflowShell
      showActionBar
      showPrevious
      showNext
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextLabel="Prepare report"
    >
      <EvaluationSummaryContent data={data} compareTo={compareTo} />
    </WorkflowShell>
  );
}

/**
 * 같은 모델의 다른 버전이 있을 때만 비교 화면 경로를 돌려준다.
 *
 * 평가가 하나뿐이면 비교할 대상이 없으므로 링크 자체를 만들지 않는다 — 눌러봐야
 * 열 하나짜리 표가 나오는 버튼은 안 보이는 편이 낫다.
 */
function useCompareLink(runId: string): string | undefined {
  return useWorkspaceStore((state) => {
    const run = state.evaluationRuns.find((item) => item.id === runId);
    if (!run) return undefined;

    const modelName = run.modelName.trim() || "Untitled model";
    const siblings = state.evaluationRuns.filter(
      (item) =>
        item.workspaceId === run.workspaceId &&
        (item.modelName.trim() || "Untitled model") === modelName,
    );

    if (siblings.length < 2) return undefined;
    return `/workspaces/${run.workspaceId}/models/${encodeURIComponent(modelName)}`;
  });
}
