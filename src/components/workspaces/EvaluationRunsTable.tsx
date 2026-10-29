import { Link } from "react-router";
import { FileText, Trash2 } from "lucide-react";
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
import { narrativePhaseOf } from "../../hooks/useReportData";
import { LIST_HELD_BADGE } from "../../lib/report/judgeNotice";

/**
 * 워크스페이스의 평가 실행(run) 이력 테이블. WorkspaceDetail 페이지에서 사용한다.
 *
 * **발급 여부를 구분해 보여준다.** run 은 검증에서 만들어지고 발급은 성적서 화면에서
 * 하므로, 입력 도중 멈춘 run 이나 아직 발급하지 않은 run 이 목록에 남는다. 둘이 같아 보이면
 * 사용자는 무엇을 마무리해야 하는지 알 수 없다. 판별 기준은 `reportId` 다 — 발급 시
 * `useIssuance` 가 채운다(useIssuance.ts 의 `persist`). 비어 있으면 초안이다.
 *
 * **판 4 서술이 발급 보류면 표시를 하나 더 단다**(심판 라운드 J9, 계획 14-8). 판단은 성적서 화면과 같은 `narrativePhaseOf` 하나를
 * 부른다 — 여기서 심판 묶음을 따로 읽으면 화면은 보류인데 목록은 아닌 식의 판정 지점 이중화가 난다. 그래서 심판 묶음이 없거나
 * 모양이 틀린 판 4 완료 run 도 화면처럼(닫힌 쪽, B46 띠) 보류로 보인다. 판 3·판 4 통과·서술 없음·진행 중·실패는 표시 없음.
 */
interface EvaluationRunsTableProps {
  runs: WorkspaceEvaluationRun[];
  onDelete: (runId: string) => void;
}

export function EvaluationRunsTable({ runs, onDelete }: EvaluationRunsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>모델 이름</TableHead>
          <TableHead>버전</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>성적서 번호</TableHead>
          <TableHead>만든 날</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => {
          const issued = Boolean(run.reportId);
          const held = narrativePhaseOf(run) === "held";

          return (
            <TableRow key={run.id}>
              <TableCell className="font-medium">{run.modelName}</TableCell>
              <TableCell>{run.versionName}</TableCell>
              <TableCell>
                {issued ? (
                  <Badge variant="secondary">발급됨</Badge>
                ) : (
                  <Badge variant="outline" className="border-warning-border text-warning-strong">
                    초안
                  </Badge>
                )}
                {held && (
                  <Badge variant="outline" className="ml-1.5 border-destructive text-destructive" data-testid="run-held-badge">
                    {LIST_HELD_BADGE}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums">
                {run.reportId || "—"}
              </TableCell>
              <TableCell>{formatCreatedAt(run.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* 초안도 성적서로 보낸다 — 평가 결과 화면이 폐지돼(§11) 성적서가 유일한 결과 화면이다.
                      아직 평가 전이면 성적서가 그 사실을 알린다(UnevaluatedDraftNotice). */}
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/report/${run.id}`}>
                      <FileText className="h-4 w-4" />
                      성적서
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(run.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    지우기
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
