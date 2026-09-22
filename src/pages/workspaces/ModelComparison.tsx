import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { AppShell } from "../../layout/AppShell";
import { ModelComparison as ModelComparisonContent } from "../../components/workspaces/ModelComparison";
import { useWorkspaceStore } from "../../utils/stores/useWorkspaceStore";
import {
  MAX_COMPARE_RUNS,
  buildModelComparison,
  findRunsForModel,
  parseRunIds,
  selectComparisonRuns,
} from "../../lib/workspace/modelComparison";

/**
 * `/workspaces/:workspaceId/models/:modelName` — 한 모델의 버전별 평가 비교.
 *
 * 워크스페이스 상세의 모델 카드에서, 그리고 평가 결과 화면에서 들어온다. 모델은 별도
 * 엔티티가 아니라 run 의 `modelName` 으로만 존재하므로 경로도 이름을 그대로 싣는다 —
 * 그래서 링크를 만들 때 `encodeURIComponent` 가 필요하다(모델명에 공백·한글이 들어간다).
 *
 * **한 번에 최대 `MAX_COMPARE_RUNS` 개만 세운다.** 위쪽 '평가 데이터' 표는 run 을 열로
 * 놓으므로 개수가 늘면 가로로 자라고, 10개쯤 되면 읽을 수 없는 폭이 된다. 어느 것을
 * 볼지는 `?runs=a,b,c` 로 받는다(워크스페이스에서 고른 것). 없으면 최근 것부터 셋.
 */
export function ModelComparison() {
  const { workspaceId, modelName } = useParams();
  const [searchParams] = useSearchParams();
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

  const shown = selectComparisonRuns(runs, parseRunIds(searchParams.get("runs")));
  const comparison = buildModelComparison(decodedName, shown);
  // 가려진 평가가 있다는 사실을 숨기지 않는다 — 사용자가 "왜 v1.0 이 없지"를 묻기 전에 말한다.
  const hidden = runs.length - shown.length;

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
            Comparing {shown.length} of {runs.length}{" "}
            {runs.length === 1 ? "evaluation" : "evaluations"} of this model, newest first.
            {hidden > 0 && (
              <>
                {" "}
                {hidden} not shown — up to {MAX_COMPARE_RUNS} fit side by side.{" "}
                <Link
                  to={`/workspaces/${workspaceId}`}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Pick which versions to compare
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </section>

      <ModelComparisonContent comparison={comparison} />
    </AppShell>
  );
}
