/**
 * 워크스페이스의 평가를 **모델별 카드**로 묶어 보여준다.
 *
 * 종전에는 한 워크스페이스의 모든 평가가 한 테이블에 섞여 있었다. 같은 모델의 v1.0·v1.1 과
 * 전혀 다른 모델이 생성일순으로 뒤섞이면, 사용자가 실제로 궁금해하는 "이 모델이 전보다
 * 나아졌나"를 눈으로 맞춰 봐야 했다. 모델이 묶이는 단위가 생기면 비교 화면으로 가는
 * 입구도 그 자리에 생긴다.
 *
 * 평가가 하나뿐인 모델에는 [Compare] 를 띄우지 않는다 — 비교할 대상이 없는 버튼이다.
 *
 * [New version] 도 행이 아니라 여기 있다. 그 동작이 거는 대상은 특정 run 이 아니라
 * **모델**이기 때문이다 — 행마다 놓으면 버전이 셋일 때 같은 뜻의 버튼이 셋이 된다.
 * 물려받는 입력은 **가장 최근 버전**의 것이다(다음 버전은 직전 버전에서 잇는다).
 */
import { Link } from "react-router";
import { CopyPlus, GitCompare } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { EvaluationRunsTable } from "./EvaluationRunsTable";
import { groupRunsByModel } from "../../lib/workspace/modelComparison";
import { formatCreatedAt } from "../../utils/format/format";
import type { WorkspaceEvaluationRun } from "../../types/workspace.types";

interface ModelRunGroupsProps {
  workspaceId: string;
  runs: WorkspaceEvaluationRun[];
  onNewVersion: (run: WorkspaceEvaluationRun) => void;
  onDelete: (runId: string) => void;
}

export function ModelRunGroups({
  workspaceId,
  runs,
  onNewVersion,
  onDelete,
}: ModelRunGroupsProps) {
  const groups = groupRunsByModel(runs);

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const canCompare = group.runs.length > 1;
        // 최신순으로 정렬돼 있으므로 [0] 이 가장 최근 버전이다.
        const latestRun = group.runs[0];

        return (
          <Card key={group.modelName} className="rounded-lg">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">{group.modelName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {group.runs.length} {group.runs.length === 1 ? "evaluation" : "evaluations"}
                  {group.latestAt ? ` · latest ${formatCreatedAt(group.latestAt)}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {canCompare && (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`/workspaces/${workspaceId}/models/${encodeURIComponent(group.modelName)}`}
                    >
                      <GitCompare className="h-4 w-4" />
                      Compare
                    </Link>
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={() => onNewVersion(latestRun)}>
                  <CopyPlus className="h-4 w-4" />
                  New version
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <EvaluationRunsTable
                runs={group.runs}
                onDelete={onDelete}
                hideModelName
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
