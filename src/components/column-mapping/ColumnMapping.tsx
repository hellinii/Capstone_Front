import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, ShieldAlert, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  TASK_TYPE_LABELS,
  METRICS,
  type RequiredColumnCode,
  type RequiredColumnDisplay,
  type TaskType,
  getRequiredColumnsForSelection,
  getRequiredColumnsForMetric,
} from "../../data/evaluationData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "../../utils/styling/styles";
import type { MappingRole, MappingRow, FilterMode } from "../../types/mapping.types";
import { buildMockBackendResponse } from "../../data/mock/columnMappingMock";
import { getRoleStatusLabel, getRowMatchState } from "../../utils/domain/mappingHelpers";

interface ColumnMappingProps {
  taskType?: TaskType | "";
  selectedMetricIds?: string[];
  onValidationChange?: (isValid: boolean) => void;
}

const roleOptions: Array<{ value: MappingRole; label: string }> = [
  { value: "id", label: "id" },
  { value: "y_true", label: "y_true" },
  { value: "y_pred", label: "y_pred" },
  { value: "score", label: "score" },
  { value: "prob_class_*", label: "prob_class_*" },
  { value: "true_labels", label: "true_labels" },
  { value: "pred_labels", label: "pred_labels" },
  { value: "prob_label_*", label: "prob_label_*" },
  { value: "ignore", label: "ignore" },
];
export function ColumnMapping({
  taskType = "",
  selectedMetricIds = [],
  onValidationChange,
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
  const [rows, setRows] = useState<MappingRow[]>([]);

  useEffect(() => {
    const response = buildMockBackendResponse(
      resolvedTaskType,
      requiredRoles.map((role) => role.code),
    );
    setRows(response.rows);
  }, [resolvedTaskType, requiredRoles]);

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
    setRows((prev) =>
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
              Review the backend auto-mapping result, fix any mismatches, and confirm the columns required for this evaluation.
            </p>
          </div>
          <Badge variant="outline" className="w-fit px-3 py-1 text-sm">
            {TASK_TYPE_LABELS[resolvedTaskType]} workflow
          </Badge>
        </div>

        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            The backend has already analyzed the uploaded file and suggested roles for each detected column. This step is for human review and final confirmation.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Required Columns</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              These are the columns required by your selected evaluation metrics. You must map a column from your dataset to each of these roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMetrics.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No metric selection was passed into this screen, so the UI is falling back to the current task type only.
                </AlertDescription>
              </Alert>
            )}

            {requiredRoles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredRoles.map((role) => {
                  const count = roleCounts[role.code] ?? 0;
                  const status = getRoleStatusLabel(role, count);
                  
                  // 어떤 metric이 이 컬럼을 필요로 하는지 찾기
                  const metricsRequiringThis = selectedMetrics.filter(metric => {
                    const req = getRequiredColumnsForMetric(resolvedTaskType, metric.id);
                    return req.some(r => r.code === role.code);
                  });

                  return (
                    <div key={role.code} className="rounded-xl border border-border bg-card p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">{role.code}</span>
                            <Badge variant={status.tone}>{status.label}</Badge>
                          </div>
                          <div className="text-sm font-medium text-slate-700">{role.label}</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex-grow mb-4">{role.description}</p>
                      
                      {metricsRequiringThis.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-slate-100">
                          <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Required by</div>
                          <div className="flex flex-wrap gap-2">
                            {metricsRequiringThis.map(metric => (
                              <Badge key={metric.id} variant="outline" className="bg-slate-50 text-slate-600 font-normal border-slate-200">
                                {metric.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Binary Classification Settings */}
        {resolvedTaskType === "binary" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Binary classification settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Which value is the positive class? The evaluation metrics will treat this value as "Positive" (1) and all others as "Negative" (0).
                </p>
                
                {yTrueRow ? (
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">Positive class value:</div>
                    <Select value={positiveClass} onValueChange={setPositiveClass}>
                      <SelectTrigger className={cn("w-[200px]", positiveClass === "" && "border-destructive")}>
                        <SelectValue placeholder="Select positive class" />
                      </SelectTrigger>
                      <SelectContent>
                        {yTrueValues.map((val) => (
                          <SelectItem key={val} value={val}>{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Alert className="bg-muted border-border">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <AlertDescription className="text-muted-foreground">
                      Assign a column to the <strong>y_true</strong> role first to see available class values.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Detected mapping</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Check whether each uploaded column was mapped to the right role, then edit only the ones that need correction.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={filterMode === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterMode("all")}>
                  All rows
                </Button>
                <Button
                  variant={filterMode === "issues" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterMode("issues")}
                >
                  Issues only
                </Button>
                <Button
                  variant={filterMode === "edited" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterMode("edited")}
                >
                  Edited only
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs uppercase text-muted-foreground">Uploaded column</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Sample values</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((row, index) => {
                    const duplicate =
                      row.confirmedRole &&
                      row.confirmedRole !== "ignore" &&
                      row.confirmedRole !== "prob_class_*" &&
                      row.confirmedRole !== "prob_label_*" &&
                      (roleCounts[row.confirmedRole] ?? 0) > 1;
                    const needsAttention = duplicate || row.confirmedRole === null || row.warnings.length > 0;
                    const matchState = getRowMatchState(row, duplicate);

                    return (
                      <TableRow key={row.originalName} className={cn(needsAttention && "bg-amber-50/40")}>
                        <TableCell className="align-top">
                          <div className="font-mono text-sm">{row.originalName}</div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="max-w-[240px] text-sm text-muted-foreground">
                            {row.sampleValues.join(", ")}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-2">
                            <Select
                              value={row.confirmedRole ?? "unassigned"}
                              onValueChange={(value) => handleRoleChange(index, value)}
                            >
                              <SelectTrigger className={cn("w-[210px]", duplicate && "border-destructive")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">unassigned</SelectItem>
                                {roleOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {row.inferredRole && row.confirmedRole !== row.inferredRole && (
                              <div className="text-xs text-muted-foreground">
                                Auto-mapped as: <span className="font-medium text-foreground">{row.inferredRole}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Status Panel */}
        {!mappingSummary.isValid ? (
          <div className="space-y-4">
            {mappingSummary.missingRoles.length > 0 && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="font-semibold mb-1 text-red-800">Missing required roles</div>
                  <p className="mb-2 text-red-700">The following roles must be assigned before you can continue:</p>
                  <div className="flex flex-wrap gap-2">
                    {mappingSummary.missingRoles.map((role) => (
                      <Badge key={role.code} variant="outline" className="bg-white border-red-300 text-red-700">
                        {role.code}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {mappingSummary.duplicateCount > 0 && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <div className="font-semibold mb-1 text-amber-800">Role conflict detected</div>
                  <p className="text-amber-700">
                    Some single-use roles are assigned to multiple columns. Each single-use role must be assigned to exactly one column.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {resolvedTaskType === "binary" && positiveClass === "" && yTrueRow && mappingSummary.missingRoles.filter(r => r.code === "y_true").length === 0 && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <div className="font-semibold mb-1 text-amber-800">Missing positive class</div>
                  <p className="text-amber-700">
                    Please select the positive class value for the binary classification task.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert className="bg-green-50 border-green-200 text-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="font-semibold text-green-800">All required settings are satisfied.</div>
              <p className="text-green-700">You can confirm this mapping and continue to validation.</p>
            </AlertDescription>
          </Alert>
        )}
      </main>
    </>
  );
}
