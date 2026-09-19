import { Link } from "react-router";
import { BarChart3, FileText, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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
}

export function EvaluationRunsTable({
  runs,
  onDelete,
  hideModelName = false,
}: EvaluationRunsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
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

          return (
            <TableRow key={run.id}>
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
                  {/* 미발급 run 을 성적서로 보내면 기관 정보·목표값이 빈 문서가 열린다.
                      아직 만들지 않은 것을 보여주는 셈이라, 평가 결과로 보낸다. */}
                  <Button asChild variant="outline" size="sm">
                    <Link to={issued ? `/report/${run.id}` : `/report/${run.id}/summary`}>
                      {issued ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <BarChart3 className="h-4 w-4" />
                      )}
                      {issued ? "Report" : "Results"}
                    </Link>
                  </Button>
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
