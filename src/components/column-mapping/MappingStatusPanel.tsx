import { AlertCircle, CheckCircle2, ShieldAlert, Undo2, X } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
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

  const handleRemoveMetric = (id: string) => {
    setSelectedMetricIds(selectedMetricIds.filter((mId) => mId !== id));
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
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-semibold mb-1 text-red-800">Missing required roles</div>
                <p className="text-sm text-red-700">The following roles must be assigned before you can continue.</p>
              </div>

              <div className="space-y-3">
                {mappingSummary.missingRoles.map((role) => {
                  const metricsRequiringThis = selectedMetrics.filter((m) =>
                    getRequiredColumnsForMetric(resolvedTaskType, m.id).some((r) => r.code === role.code)
                  );

                  return (
                    <div key={role.code} className="bg-white/50 rounded-lg p-3 border border-red-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-white border-red-300 text-red-700">
                          {role.code}
                        </Badge>
                        <span className="text-xs font-medium text-red-800">{role.label}</span>
                      </div>
                      
                      {metricsRequiringThis.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-red-500">Required by:</p>
                          <div className="flex flex-wrap gap-2">
                            {metricsRequiringThis.map((metric) => (
                              <Button
                                key={metric.id}
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] bg-white hover:bg-red-50 border-red-200 text-red-700 transition-colors"
                                onClick={() => handleRemoveMetric(metric.id)}
                              >
                                Exclude {metric.name}
                                <X className="ml-1 h-3 w-3" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-red-700">
                  If your dataset is missing these columns, you may need to re-upload your data.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-red-50 border-red-200 text-red-700 gap-1 shrink-0"
                  onClick={() => navigate(stepToPath(4))}
                >
                  <Undo2 className="h-3 w-3" />
                  Go back to Data Upload
                </Button>
              </div>
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
