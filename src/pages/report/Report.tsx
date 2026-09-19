import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { useReportData } from "../../hooks/useReportData";
import { useIssuance } from "../../hooks/useIssuance";
import { usePdfDownload } from "../../hooks/usePdfDownload";
import { ReportLayout } from "../../components/report/layout/ReportLayout";
import { ReportLoadingState } from "../../components/report/ReportLoadingState";
import { ReportErrorState } from "../../components/report/ReportErrorState";
import { ReportSections } from "../../components/report/ReportSections";
import { UnevaluatedDraftNotice } from "../../components/report/UnevaluatedDraftNotice";
import { BackendNoticePanel } from "../../components/workflow/BackendNoticePanel";

export function Report() {
  // 기본값을 두지 않는다 — 폐지된 임시 성적서("preview")로 조용히 떨어지지 않게(E-06).
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: reportData, isLoading, narrativePending, error } = useReportData(id);
  const issuance = useIssuance(id, reportData);
  const data = issuance.data; // 발급 반영본(있으면) — 섹션은 이 값을 렌더한다
  const { download } = usePdfDownload(id);

  if (isLoading) {
    return <ReportLoadingState />;
  }

  if (error) {
    return <ReportErrorState error={error} onBack={() => window.history.back()} />;
  }

  if (!data) return null;

  return (
    <ReportLayout
      onDownload={download}
      issued={issuance.issued}
      canIssue={issuance.canIssue}
      reportId={data.meta.reportId}
      busy={issuance.busy}
      onIssue={issuance.issue}
      onReissue={issuance.reissue}
    >
      <UnevaluatedDraftNotice isEvaluated={!!(data as any).isEvaluated || narrativePending} />

      {/* 성적서 구간 입구. 기관 정보·학습 데이터셋 정보·목표값은 평가에 쓰이지 않으므로
          평가를 마친 뒤 성적서를 낼 사람만 입력한다(docs/WORKFLOW_REDESIGN.md). */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Issuing this as an official report needs organization details, training dataset information,
          and pass criteria.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(`/report/${id}/issue-info`)}>
          Enter report details
        </Button>
      </div>

      {/* 평가 전처리 경고(ISSUES.md D-16). 이 값은 evaluate 응답에만 실려 오므로
          6단계가 아니라 여기서 도착한다 — 도착하는 자리에서 보여준다. */}
      <BackendNoticePanel evaluationWarnings={data.evaluationWarnings} />

      {narrativePending && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm text-teal-700">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          AI 정성 서술(7·8·9절)을 생성하는 중입니다. 아래 지표·차트는 이미 확정된 결과이며, 서술은 완료되는 대로 채워집니다.
        </div>
      )}
      <ReportSections data={data} />
    </ReportLayout>
  );
}
