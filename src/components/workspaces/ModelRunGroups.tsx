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
 * **비교 대상은 여기서 고른다(최대 `MAX_COMPARE_RUNS` 개).** 고르지 않고 눌러도 되며,
 * 그때는 최근 것부터 셋을 본다. 선택 상태는 **카드마다 따로**다 — 모델이 다르면 지표도
 * 데이터도 달라 한 표에 세울 수 없으므로, 카드를 건너뛰는 선택은 존재할 수 없다.
 *
 * [New version] 도 행이 아니라 여기 있다. 그 동작이 거는 대상은 특정 run 이 아니라
 * **모델**이기 때문이다 — 행마다 놓으면 버전이 셋일 때 같은 뜻의 버튼이 셋이 된다.
 * 물려받는 입력은 **가장 최근 버전**의 것이다(다음 버전은 직전 버전에서 잇는다).
 */
import { useState } from "react";
import { Link } from "react-router";
import { CopyPlus, GitCompare } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { EvaluationRunsTable } from "./EvaluationRunsTable";
import { MAX_COMPARE_RUNS, groupRunsByModel, type ModelGroup } from "../../lib/workspace/modelComparison";
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
      {groups.map((group) => (
        <ModelCard
          key={group.modelName}
          workspaceId={workspaceId}
          group={group}
          onNewVersion={onNewVersion}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ModelCard({
  workspaceId,
  group,
  onNewVersion,
  onDelete,
}: {
  workspaceId: string;
  group: ModelGroup;
  onNewVersion: (run: WorkspaceEvaluationRun) => void;
  onDelete: (runId: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // 고르지 않고 Compare 를 누른 적이 있는가. 눌러보기 전까지는 나무라지 않는다.
  const [showSelectionHint, setShowSelectionHint] = useState(false);

  const canCompare = group.runs.length > 1;
  // 최신순으로 정렬돼 있으므로 [0] 이 가장 최근 버전이다.
  const latestRun = group.runs[0];

  // 지워진 평가가 선택에 남아 있으면 비교 링크가 죽은 id 를 싣는다.
  const liveSelectedIds = selectedIds.filter((id) => group.runs.some((run) => run.id === id));
  const selectionFull = liveSelectedIds.length >= MAX_COMPARE_RUNS;

  const toggle = (runId: string) => {
    setShowSelectionHint(false);
    setSelectedIds((prev) => {
      if (prev.includes(runId)) return prev.filter((id) => id !== runId);
      if (prev.length >= MAX_COMPARE_RUNS) return prev;
      return [...prev, runId];
    });
  };

  // 하나만 고른 것은 비교가 아니다 — 세울 열이 하나뿐인 표는 비교가 되지 않는다.
  const readyToCompare = liveSelectedIds.length >= 2;
  const compareTo = `/workspaces/${workspaceId}/models/${encodeURIComponent(
    group.modelName,
  )}?runs=${liveSelectedIds.join(",")}`;

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">{group.modelName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {group.runs.length} {group.runs.length === 1 ? "evaluation" : "evaluations"}
            {group.latestAt ? ` · latest ${formatCreatedAt(group.latestAt)}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canCompare &&
            (readyToCompare ? (
              <Button asChild variant="outline" size="sm">
                <Link to={compareTo}>
                  <GitCompare className="h-4 w-4" />
                  Compare ({liveSelectedIds.length})
                </Link>
              </Button>
            ) : (
              /* 비활성으로 두지 않고 누를 수 있게 남긴다 — 눌리지 않는 버튼은 왜 눌리지
                 않는지 말해주지 못한다. 눌러보면 무엇이 모자란지 알려준다. */
              <Button variant="outline" size="sm" onClick={() => setShowSelectionHint(true)}>
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
            ))}

          <Button variant="outline" size="sm" onClick={() => onNewVersion(latestRun)}>
            <CopyPlus className="h-4 w-4" />
            New version
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {canCompare &&
          (showSelectionHint && !readyToCompare ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              Select at least two versions to compare.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {selectionFull
                ? `You can compare up to ${MAX_COMPARE_RUNS} versions at once. Clear one to pick another.`
                : `Tick two or three versions, then press Compare.`}
            </p>
          ))}

        <EvaluationRunsTable
          runs={group.runs}
          onDelete={onDelete}
          hideModelName
          selectedIds={canCompare ? liveSelectedIds : undefined}
          onToggleSelect={canCompare ? toggle : undefined}
          selectionFull={selectionFull}
        />
      </CardContent>
    </Card>
  );
}
