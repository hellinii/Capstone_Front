import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import type { RequiredColumnDisplay, TaskType } from "../../data/evaluationData";
import type { MappingRow } from "../../types/mapping.types";

interface MappingStatusPanelProps {
  mappingSummary: {
    isValid: boolean;
    missingRoles: RequiredColumnDisplay[];
    duplicateCount: number;
  };
  resolvedTaskType: TaskType;
  positiveClass: string;
  yTrueRow: MappingRow | undefined;
}

export function MappingStatusPanel({
  mappingSummary,
  resolvedTaskType,
  positiveClass,
  yTrueRow,
}: MappingStatusPanelProps) {
  if (mappingSummary.isValid) {
    return (
      <Alert className="bg-green-50 border-green-200 text-green-900">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="font-semibold text-green-800">All required settings are satisfied.</div>
          <p className="text-green-700">You can confirm this mapping and continue to validation.</p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
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

      {resolvedTaskType === "binary" &&
        positiveClass === "" &&
        yTrueRow &&
        mappingSummary.missingRoles.filter((r) => r.code === "y_true").length === 0 && (
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
  );
}
