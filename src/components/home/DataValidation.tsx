import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ActionBar } from "../../layout/ActionBar";
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
import type { ValidationStatus } from "../../types/validation.types";
import { buildMockValidationResponse } from "../../data/mock/dataValidationMock";

interface DataValidationProps {
  taskType?: TaskType | "";
  selectedTCIds?: string[];
  onNext: () => void;
  onPrevious: () => void;
}

function getStatusBadge(status: ValidationStatus) {
  if (status === "error") {
    return <Badge variant="destructive">Error</Badge>;
  }
  if (status === "warning") {
    return <Badge variant="outline">Warning</Badge>;
  }
  return <Badge variant="secondary">Pass</Badge>;
}

export function DataValidation({
  taskType = "",
  selectedTCIds = [],
  onNext,
  onPrevious,
}: DataValidationProps) {
  const validationResponse = buildMockValidationResponse(taskType, selectedTCIds);
  const hasBlockingError = validationResponse.errorCount > 0;

  return (
    <>
      <main className="mx-auto max-w-[1344px] space-y-6 px-8 pb-24 pt-12">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Data validation</h1>
          <p className="text-sm text-muted-foreground">
            Review the backend validation result before running the evaluation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{TASK_TYPE_LABELS[validationResponse.taskType]}</Badge>
          {validationResponse.selectedTcIds.map((id) => (
            <Badge key={id} variant="outline">
              {id}
            </Badge>
          ))}
        </div>

        {hasBlockingError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Validation errors were found. Review the detail table before continuing.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              No blocking validation error was found in the current mock response.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">6.0 Execution summary</CardTitle>
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
            <CardTitle className="text-lg font-semibold">6.0.1 Validation details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[320px]">Check</TableHead>
                    <TableHead className="w-[220px]">Result</TableHead>
                    <TableHead>Handling</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResponse.validationDetails.map((item) => (
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
          </CardContent>
        </Card>
      </main>

      <ActionBar showPrevious={true} onPrevious={onPrevious} onNext={onNext} nextLabel="Run evaluation" />
    </>
  );
}
