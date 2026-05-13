import { useEffect } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  TASK_TYPE_LABELS,
  type TaskType,
} from "../../data/evaluationData";
import type { ValidationDetailItem, ValidationGroup, ValidationStatus } from "../../types/validation.types";
import { buildMockValidationResponse } from "../../data/mock/dataValidationMock";

interface DataValidationProps {
  taskType?: TaskType | "";
  selectedMetricIds?: string[];
  onValidationChange?: (hasError: boolean) => void;
}

const GROUP_META: Record<ValidationGroup, { label: string; description: string }> = {
  common:     { label: "Common Checks",     description: "Applied to all task types" },
  multiclass: { label: "Multiclass Checks", description: "Applied when task type is Multiclass" },
  binary:     { label: "Binary Checks",     description: "Applied when task type is Binary" },
  multilabel: { label: "Multilabel Checks", description: "Applied when task type is Multilabel" },
  latency:    { label: "Latency Checks",    description: "Applied when a latency column is present" },
};

const GROUP_ORDER: ValidationGroup[] = ["common", "multiclass", "binary", "multilabel", "latency"];

function getStatusBadge(status: ValidationStatus) {
  if (status === "error") return <Badge variant="destructive">Error</Badge>;
  if (status === "warning") return <Badge variant="outline">Warning</Badge>;
  return <Badge variant="secondary">Pass</Badge>;
}

function GroupStatBadge({ count, label, variant }: { count: number; label: string; variant: "error" | "warning" | "pass" }) {
  const colorClass =
    variant === "error"   ? "text-destructive" :
    variant === "warning" ? "text-yellow-600 dark:text-yellow-400" :
                            "text-muted-foreground";
  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      {count} {label}
    </span>
  );
}

function ValidationGroupSection({ items, group }: { items: ValidationDetailItem[]; group: ValidationGroup }) {
  const meta = GROUP_META[group];
  const errorCount = items.filter((i) => i.status === "error").length;
  const warningCount = items.filter((i) => i.status === "warning").length;
  const passCount = items.filter((i) => i.status === "pass").length;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {errorCount > 0 && <GroupStatBadge count={errorCount} label="Errors" variant="error" />}
          {warningCount > 0 && <GroupStatBadge count={warningCount} label="Warnings" variant="warning" />}
          <GroupStatBadge count={passCount} label="Passed" variant="pass" />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/10">
            <TableHead className="w-[280px]">Check</TableHead>
            <TableHead className="w-[180px]">Result</TableHead>
            <TableHead>Handling</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.name}>
              <TableCell className="align-top whitespace-normal font-medium">{item.name}</TableCell>
              <TableCell className="align-top whitespace-normal">{item.result}</TableCell>
              <TableCell className="align-top whitespace-normal text-muted-foreground">{item.handling}</TableCell>
              <TableCell className="align-top">{getStatusBadge(item.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DataValidation({
  taskType = "",
  selectedMetricIds = [],
  onValidationChange,
}: DataValidationProps) {
  const validationResponse = buildMockValidationResponse(taskType, selectedMetricIds);
  const { validationDetails, errorCount, warningCount } = validationResponse;
  const passCount = validationDetails.filter((i) => i.status === "pass").length;
  const hasBlockingError = errorCount > 0;

  useEffect(() => {
    onValidationChange?.(hasBlockingError);
  }, [hasBlockingError, onValidationChange]);

  const groupedSections = GROUP_ORDER
    .map((group) => ({ group, items: validationDetails.filter((i) => i.group === group) }))
    .filter(({ items }) => items.length > 0);

  return (
    <main className="mx-auto max-w-[1344px] space-y-6 px-8 pb-24 pt-12">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Data validation</h1>
        <p className="text-sm text-muted-foreground">
          Review the backend validation result before running the evaluation.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{TASK_TYPE_LABELS[validationResponse.taskType]}</Badge>
        {validationResponse.selectedMetricIds.map((id) => (
          <Badge key={id} variant="outline">{id}</Badge>
        ))}
      </div>

      {hasBlockingError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Validation errors were found. Review the details below before continuing.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            All validation checks passed. You can proceed to run the evaluation.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Execution Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[220px]">Item</TableHead>
                  <TableHead className="w-[180px]">Value</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResponse.executionSummary.map((item) => (
                  <TableRow key={item.label}>
                    <TableCell className="align-top whitespace-normal font-semibold">{item.label}</TableCell>
                    <TableCell className="align-top whitespace-normal">{item.value}</TableCell>
                    <TableCell className="align-top whitespace-normal text-muted-foreground">{item.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Validation Details</CardTitle>
            <div className="flex items-center gap-4">
              {errorCount > 0 && <GroupStatBadge count={errorCount} label="Errors" variant="error" />}
              {warningCount > 0 && <GroupStatBadge count={warningCount} label="Warnings" variant="warning" />}
              <GroupStatBadge count={passCount} label="Passed" variant="pass" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {groupedSections.map(({ group, items }) => (
            <ValidationGroupSection key={group} group={group} items={items} />
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
