import { useState } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, Undo2 } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
  type MetricDefinition,
  type RequiredColumnDisplay,
  type TaskType,
  getRequiredColumnsForMetric,
} from "../../data/evaluationData";
import type { MappingRow } from "../../types/mapping.types";
import { useNavigate } from "react-router";
import { useWorkflowStore, stepToPath } from "../../utils/stores/useWorkflowStore";
import { MappingResolutionView } from "./MappingResolutionView";

interface MappingStatusPanelProps {
  mappingSummary: {
    isValid: boolean;
    missingRoles: RequiredColumnDisplay[];
    duplicateCount: number;
  };
  resolvedTaskType: TaskType;
  selectedMetrics: MetricDefinition[];
  positiveClass: string;
  yTrueRow: MappingRow | undefined;
}

export function MappingStatusPanel({
  mappingSummary,
  resolvedTaskType,
  selectedMetrics,
  positiveClass,
  yTrueRow,
}: MappingStatusPanelProps) {
  const navigate = useNavigate();
  const { selectedMetricIds, setSelectedMetricIds } = useWorkflowStore();
  const [isResolutionMode, setIsResolutionMode] = useState(false);

  const handleRemoveMetric = (id: string) => {
    setSelectedMetricIds(selectedMetricIds.filter((mId) => mId !== id));
  };

  const handleExcludeAllAffected = () => {
    const affectedMetricIds = new Set<string>();
    mappingSummary.missingRoles.forEach((role) => {
      selectedMetrics.forEach((m) => {
        if (getRequiredColumnsForMetric(resolvedTaskType, m.id).some((r) => r.code === role.code)) {
          affectedMetricIds.add(m.id);
        }
      });
    });
    setSelectedMetricIds(selectedMetricIds.filter((id) => !affectedMetricIds.has(id)));
    setIsResolutionMode(false);
  };
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
        <>
          {!isResolutionMode ? (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 p-6">
              <AlertCircle className="h-5 w-5 text-red-600 mt-1" />
              <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="font-bold text-lg text-red-800">Missing required columns</div>
                  <p className="text-red-700">
                    {mappingSummary.missingRoles.length} required roles are not assigned yet. 
                    You cannot proceed to the next step.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <Button
                    variant="outline"
                    className="bg-white hover:bg-red-50 border-red-200 text-red-700 font-semibold px-5"
                    onClick={() => setIsResolutionMode(true)}
                  >
                    Adjust Metrics to Resolve
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 px-5"
                    onClick={() => navigate(stepToPath(4))}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Go back to Upload
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <MappingResolutionView
              missingRoles={mappingSummary.missingRoles}
              selectedMetrics={selectedMetrics}
              resolvedTaskType={resolvedTaskType}
              onClose={() => setIsResolutionMode(false)}
              onRemoveMetric={handleRemoveMetric}
              onExcludeAllAffected={handleExcludeAllAffected}
              onGoBackToUpload={() => navigate(stepToPath(4))}
            />
          )}
        </>
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
