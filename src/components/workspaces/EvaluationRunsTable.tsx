import { Link } from "react-router";
import { BarChart3, FileText, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatCreatedAt } from "../../utils/format/format";
import type { WorkspaceEvaluationRun } from "../../types/workspace.types";

/**
 * 워크스페이스의 평가 실행(run) 이력 테이블. WorkspaceDetail 페이지에서 사용한다.
 *
 * **발급 여부를 구분해 보여준다.** 평가만 하고 성적서를 내지 않아도 run 은 생성되므로
 * (평가와 발급이 분리된 뒤 정상 동선이다), 목록에서 둘이 같아 보이면 사용자는 무엇을
 * 마무리해야 하는지 알 수 없다. 판별 기준은 `reportId` 다 — 발급 시 `useIssuance` 가
 * 채운다(useIssuance.ts 의 `persist`). 비어 있으면 초안이다.
 *
 * **행에는 'New version' 이 없다.** 그 동작은 특정 run 이 아니라 **모델**에 거는 것이라
 * (종전 'Edit' 과 달리 과거 평가를 고치지 않고 다음 버전을 쌓는다) 카드 머리에 하나만
 * 둔다(`ModelRunGroups`). 행마다 놓으면 버전이 셋일 때 같은 뜻의 버튼이 셋이 된다.
 */
interface EvaluationRunsTableProps {
  runs: WorkspaceEvaluationRun[];
  onDelete: (runId: string) => void;
  /** 모델별로 묶인 카드 안에서는 제목이 이미 모델명이라 열을 숨긴다. */
  hideModelName?: boolean;
  /**
   * 비교 대상으로 고른 run 의 id. **넘기지 않으면 선택 열 자체가 없다** — 비교할 대상이
   * 없는 모델(평가 1건)에까지 체크박스를 두면 무엇에 쓰는 물건인지 알 수 없다.
   */
  selectedIds?: string[];
  onToggleSelect?: (runId: string) => void;
  /** 상한에 닿아 더 고를 수 없는 상태. 고른 것은 계속 풀 수 있어야 하므로 행마다 판단한다. */
  selectionFull?: boolean;
}

export function EvaluationRunsTable({
  runs,
  onDelete,
  hideModelName = false,
  selectedIds,
  onToggleSelect,
  selectionFull = false,
}: EvaluationRunsTableProps) {
  const selectable = Boolean(selectedIds && onToggleSelect);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && <TableHead className="w-10" aria-label="Compare selection" />}
          {!hideModelName && <TableHead>Model Name</TableHead>}
          <TableHead>Version</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Report No.</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => {
          const issued = Boolean(run.reportId);
          const checked = selectedIds?.includes(run.id) ?? false;

          return (
            <TableRow key={run.id}>
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={checked}
                    // 이미 고른 것은 상한과 무관하게 풀 수 있어야 한다 — 막아 두면
                    // 셋을 고른 뒤 무엇도 바꿀 수 없는 상태에 갇힌다.
                    disabled={!checked && selectionFull}
                    onCheckedChange={() => onToggleSelect?.(run.id)}
                    aria-label={`Select ${run.versionName} for comparison`}
                  />
                </TableCell>
              )}
              {!hideModelName && <TableCell className="font-medium">{run.modelName}</TableCell>}
              <TableCell>{run.versionName}</TableCell>
              <TableCell>
                {issued ? (
                  <Badge variant="secondary">Report issued</Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    Evaluation only
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums">
                {run.reportId || "—"}
              </TableCell>
              <TableCell>{formatCreatedAt(run.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* 측정값은 발급 여부와 무관하게 늘 볼 수 있다. 종전에는 발급하는 순간
                      이 버튼이 Report 로 **바뀌어** 평가 결과로 가는 길이 목록에서 사라졌다 —
                      성적서를 냈다고 해서 지표·차트를 다시 볼 일이 없어지지는 않는다. */}
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/report/${run.id}/summary`}>
                      <BarChart3 className="h-4 w-4" />
                      Results
                    </Link>
                  </Button>
                  {/* 성적서는 발급된 것만 연다. 미발급 run 을 성적서로 보내면 기관 정보·
                      목표값이 빈 문서가 열려, 아직 만들지 않은 것을 보여주는 셈이 된다. */}
                  {issued && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/report/${run.id}`}>
                        <FileText className="h-4 w-4" />
                        Report
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(run.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
