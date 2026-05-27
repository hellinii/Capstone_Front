import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import {
  TASK_TYPE_LABELS,
  METRICS,
  type TaskType,
  getRequiredColumnsForSelection,
} from "../../data/evaluationData";
import type { MappingRole, MappingRow, FilterMode } from "../../types/mapping.types";
import { buildMockBackendResponse } from "../../data/mock/columnMappingMock";

import { RequiredColumnsCard } from "./RequiredColumnsCard";
import { BinaryClassificationCard } from "./BinaryClassificationCard";
import { ClassLabelDescriptionCard } from "./ClassLabelDescriptionCard";
import { DetectedMappingTable } from "./DetectedMappingTable";
import { MappingStatusPanel } from "./MappingStatusPanel";

interface ColumnMappingProps {
  taskType?: TaskType | "";
  selectedMetricIds?: string[];
  rows: MappingRow[];
  onRowsChange: (value: MappingRow[] | ((prev: MappingRow[]) => MappingRow[])) => void;
  onValidationChange?: (isValid: boolean) => void;
  classLabelDescriptions?: Record<string, string>;
  onClassLabelDescriptionsChange?: (
    value:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
}

const roleOptions: Array<{ value: MappingRole; label: string }> = [
  { value: "id", label: "id" },
  { value: "y_true", label: "y_true" },
  { value: "y_pred", label: "y_pred" },
  { value: "score", label: "score" },
  { value: "prob_class_*", label: "prob_class_*" },
  { value: "prob_label_*", label: "prob_label_*" },
  { value: "ignore", label: "ignore" },
];
export function ColumnMapping({
  taskType = "",
  selectedMetricIds = [],
  rows,
  onRowsChange,
  onValidationChange,
  classLabelDescriptions = {},
  onClassLabelDescriptionsChange,
}: ColumnMappingProps) {
  const resolvedTaskType: TaskType = taskType || "multiclass";
  const selectedMetrics = useMemo(
    () => METRICS.filter((m) => selectedMetricIds.includes(m.id) && m.supportedTaskTypes.includes(resolvedTaskType)),
    [resolvedTaskType, selectedMetricIds],
  );
  const requiredRoles = useMemo(
    () => getRequiredColumnsForSelection(resolvedTaskType, selectedMetricIds),
    [resolvedTaskType, selectedMetricIds],
  );
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // 매핑이 비어있을 때만 mock backend로 초기화. 사용자가 수정한 매핑은 store에 영구화되어
  // 다음 단계 갔다 돌아와도 보존됨. taskType 변경 시 store에서 [] 로 리셋되므로 재초기화 트리거됨.
  useEffect(() => {
    if (rows.length > 0) return;
    const response = buildMockBackendResponse(
      resolvedTaskType,
      requiredRoles.map((role) => role.code),
    );
    onRowsChange(response.rows);
  }, [rows.length, resolvedTaskType, requiredRoles, onRowsChange]);

  // Binary Positive Class UI State
  const [positiveClass, setPositiveClass] = useState<string>("");
  const yTrueRow = useMemo(() => rows.find((r) => r.confirmedRole === "y_true"), [rows]);
  const yTrueValues = useMemo(() => yTrueRow ? Array.from(new Set(yTrueRow.sampleValues)) : [], [yTrueRow]);

  const roleCounts = useMemo(() => {
    const counts: Partial<Record<MappingRole, number>> = {};
    rows.forEach((row) => {
      if (!row.confirmedRole || row.confirmedRole === "ignore") {
        return;
      }
      counts[row.confirmedRole] = (counts[row.confirmedRole] ?? 0) + 1;
    });
    return counts;
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (filterMode === "edited") {
      return rows.filter((row) => row.modified);
    }
    if (filterMode === "issues") {
      return rows.filter((row) => {
        const duplicate =
          row.confirmedRole &&
          row.confirmedRole !== "ignore" &&
          row.confirmedRole !== "prob_class_*" &&
          row.confirmedRole !== "prob_label_*" &&
          (roleCounts[row.confirmedRole] ?? 0) > 1;
        const unassigned = row.confirmedRole === null;
        return duplicate || unassigned || row.warnings.length > 0;
      });
    }
    return rows;
  }, [filterMode, roleCounts, rows]);

  const mappingSummary = useMemo(() => {
    const editedCount = rows.filter((row) => row.modified).length;
    const duplicateCount = Object.entries(roleCounts).filter(([role, count]) => {
      if (!count || count < 2) {
        return false;
      }
      return role !== "prob_class_*" && role !== "prob_label_*";
    }).length;

    const missingRoles = requiredRoles.filter((role) => {
      const count = roleCounts[role.code] ?? 0;
      return count === 0;
    });

    return {
      editedCount,
      duplicateCount,
      missingRoles,
      isValid: missingRoles.length === 0 && duplicateCount === 0 && (resolvedTaskType !== "binary" || positiveClass !== ""),
    };
  }, [requiredRoles, roleCounts, rows, resolvedTaskType, positiveClass]);

  useEffect(() => {
    onValidationChange?.(mappingSummary.isValid);
  }, [mappingSummary.isValid, onValidationChange]);

  const handleRoleChange = (index: number, newRole: string) => {
    onRowsChange((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              confirmedRole: newRole === "unassigned" ? null : (newRole as MappingRole),
              modified: row.inferredRole !== (newRole === "unassigned" ? null : newRole),
            }
          : row,
      ),
    );
  };

  return (
    <>
      <main className="px-8 pt-12 pb-24 max-w-[1344px] mx-auto space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Column mapping review</h1>
            <p className="text-sm text-muted-foreground">
              Review and adjust the mapped roles to ensure your dataset is correctly interpreted for evaluation.
            </p>
          </div>
          <Badge variant="outline" className="w-fit px-3 py-1 text-sm">
            {TASK_TYPE_LABELS[resolvedTaskType]} workflow
          </Badge>
        </div>

        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            The system has automatically mapped your columns based on their contents. Please review and confirm the assignments before proceeding.
          </AlertDescription>
        </Alert>

        <RequiredColumnsCard
          selectedMetrics={selectedMetrics}
          requiredRoles={requiredRoles}
          resolvedTaskType={resolvedTaskType}
          roleCounts={roleCounts}
        />

        <BinaryClassificationCard
          resolvedTaskType={resolvedTaskType}
          positiveClass={positiveClass}
          setPositiveClass={setPositiveClass}
          yTrueRow={yTrueRow}
          yTrueValues={yTrueValues}
        />

        {onClassLabelDescriptionsChange && (
          <ClassLabelDescriptionCard
            yTrueRow={yTrueRow}
            yTrueValues={yTrueValues}
            classLabelDescriptions={classLabelDescriptions}
            onClassLabelDescriptionsChange={onClassLabelDescriptionsChange}
          />
        )}

        <DetectedMappingTable
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          visibleRows={visibleRows}
          roleCounts={roleCounts}
          handleRoleChange={handleRoleChange}
          roleOptions={roleOptions}
        />

        <MappingStatusPanel
          mappingSummary={mappingSummary}
          resolvedTaskType={resolvedTaskType}
          selectedMetrics={selectedMetrics}
          positiveClass={positiveClass}
          yTrueRow={yTrueRow}
        />
      </main>
    </>
  );
}
