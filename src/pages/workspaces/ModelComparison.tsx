import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { AppShell } from "../../layout/AppShell";
import { ModelComparison as ModelComparisonContent } from "../../components/workspaces/ModelComparison";
import { useWorkspaceStore } from "../../utils/stores/useWorkspaceStore";
import {
  buildModelComparison,
  findRunsForModel,
} from "../../lib/workspace/modelComparison";

/**
 * `/workspaces/:workspaceId/models/:modelName` — 한 모델의 버전별 평가 비교.
 *
 * 워크스페이스 상세의 모델 카드에서, 그리고 평가 결과 화면에서 들어온다. 모델은 별도
 * 엔티티가 아니라 run 의 `modelName` 으로만 존재하므로 경로도 이름을 그대로 싣는다 —
 * 그래서 링크를 만들 때 `encodeURIComponent` 가 필요하다(모델명에 공백·한글이 들어간다).
 */
export function ModelComparison() {
  const { workspaceId, modelName } = useParams();
  const { workspaces, evaluationRuns } = useWorkspaceStore();

  const workspace = workspaces.find((item) => item.id === workspaceId);
  const decodedName = decodeURIComponent(modelName ?? "");

  if (!workspaceId || !workspace) {
    return <Navigate to="/workspaces" replace />;
  }

  const runs = findRunsForModel(
    evaluationRuns.filter((run) => run.workspaceId === workspaceId),
    decodedName,
  );

  // 삭제된 모델의 링크를 열었을 때 빈 표를 보여주지 않는다.
  if (runs.length === 0) {
    return <Navigate to={`/workspaces/${workspaceId}`} replace />;
  }

  const comparison = buildModelComparison(decodedName, runs);

  return (
    <AppShell>
      <section className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to={`/workspaces/${workspaceId}`}>
            <ArrowLeft className="h-4 w-4" />
            {workspace.name}
          </Link>
        </Button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">{decodedName}</h1>
          <p className="text-sm text-muted-foreground">
            {runs.length} {runs.length === 1 ? "evaluation" : "evaluations"} of this model, newest
            first.
          </p>
        </div>
      </section>

      <ModelComparisonContent comparison={comparison} />
    </AppShell>
  );
}
