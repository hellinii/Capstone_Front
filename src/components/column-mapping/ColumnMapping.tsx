import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, ShieldAlert, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  TASK_TYPE_LABELS,
  TEST_CASES,
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
    () => TEST_CASES.filter((m) => selectedMetricIds.includes(m.id) && m.supportedTaskTypes.includes(resolvedTaskType)),
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
      isValid: missingRoles.length === 0 && duplicateCount === 0,
    };
  }, [requiredRoles, roleCounts, rows]);

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
            <CardTitle className="text-lg font-semibold">Selected metrics and required columns</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Each selected metric can require different columns. Confirm that all of them are satisfied before continuing.
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

            {selectedMetrics.length > 0 && (
              <div className="space-y-3">
                {selectedMetrics.map((metric) => {
                  const metricRequiredRoles = getRequiredColumnsForMetric(resolvedTaskType, metric.id);
                  const metricMissing = metricRequiredRoles.filter((role) => (roleCounts[role.code] ?? 0) === 0);
                  const metricHasConflict = metricRequiredRoles.some((role) => {
                    const count = roleCounts[role.code] ?? 0;
                    return role.code !== "prob_class_*" && role.code !== "prob_label_*" && count > 1;
                  });
                  const metricComplete = metricMissing.length === 0 && !metricHasConflict;

                  return (
                    <div key={metric.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{metric.id}</Badge>
                            <div className="font-semibold">{metric.name}</div>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{metric.description}</p>
                        </div>
                        <Badge variant={metricComplete ? "secondary" : "destructive"}>
                          {metricComplete ? "Ready" : "Needs review"}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {metricRequiredRoles.map((role) => {
                          const count = roleCounts[role.code] ?? 0;
                          const status = getRoleStatusLabel(role, count);

                          return (
                            <div key={`${metric.id}-${role.code}`} className="rounded-lg border border-border bg-muted/20 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium">{role.code}</div>
                                  <div className="mt-1 text-xs text-muted-foreground">{role.label}</div>
                                </div>
                                <Badge variant={status.tone}>{status.label}</Badge>
                              </div>
                              <p className="mt-3 text-xs text-muted-foreground">{role.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {requiredRoles.length > 0 && (
              <div className="rounded-xl border border-border bg-[#F8FAFC] p-4">
                <div className="text-sm font-medium text-slate-900">Overall required role coverage</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {requiredRoles.map((role) => {
                    const count = roleCounts[role.code] ?? 0;
                    const status = getRoleStatusLabel(role, count);

                    return (
                      <Badge key={role.code} variant={status.tone}>
                        {role.code}: {status.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                    <TableHead className="text-xs uppercase text-muted-foreground">Auto-mapped role</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Match</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Final role</TableHead>
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
                          <Badge variant={row.inferredRole ? "outline" : "destructive"}>
                            {row.inferredRole ?? "No match"}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-2">
                            <Badge variant={matchState.tone}>{matchState.label}</Badge>
                            {row.modified && row.inferredRole && row.confirmedRole && (
                              <div className="text-xs text-muted-foreground">
                                Auto-mapped as <span className="font-medium text-foreground">{row.inferredRole}</span>, changed to{" "}
                                <span className="font-medium text-foreground">{row.confirmedRole}</span>
                              </div>
                            )}
                            {row.warnings.map((warning) => (
                              <div key={warning} className="flex items-start gap-2 text-xs text-amber-800">
                                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {!mappingSummary.isValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {mappingSummary.missingRoles.length > 0 &&
                `Missing required roles: ${mappingSummary.missingRoles.map((role) => role.code).join(", ")}. `}
              {mappingSummary.duplicateCount > 0 &&
                "At least one single-use role has been assigned to multiple columns. Resolve the conflicts before confirming."}
            </AlertDescription>
          </Alert>
        )}

        {mappingSummary.isValid && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              All required roles are mapped for the selected metrics. You can confirm this mapping and continue to validation.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </>
  );
}
