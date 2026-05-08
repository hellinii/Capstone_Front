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
            <div className="rounded-2xl border-2 border-red-200 bg-white p-8 shadow-xl animate-in fade-in zoom-in duration-300">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Resolve missing column requirements</h2>
                  <p className="text-slate-600">
                    The following columns are missing from your dataset. You can resolve this by excluding the metrics that require them.
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsResolutionMode(false)} className="rounded-full">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {mappingSummary.missingRoles.map((role) => {
                  const metricsRequiringThis = selectedMetrics.filter((m) =>
                    getRequiredColumnsForMetric(resolvedTaskType, m.id).some((r) => r.code === role.code)
                  );

                  return (
                    <div key={role.code} className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="outline" className="bg-red-100 border-red-200 text-red-700 text-sm py-1 px-3">
                          {role.code}
                        </Badge>
                        <span className="font-semibold text-slate-800">{role.label}</span>
                      </div>
                      
                      <div className="space-y-3 flex-grow">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required by metrics:</p>
                        <div className="flex flex-col gap-2">
                          {metricsRequiringThis.map((metric) => (
                            <div key={metric.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                              <span className="text-sm font-medium text-slate-700">{metric.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                onClick={() => handleRemoveMetric(metric.id)}
                              >
                                Exclude
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
                <Button
                  variant="ghost"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={() => setIsResolutionMode(false)}
                >
                  Cancel and go back
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700"
                    onClick={() => navigate(stepToPath(4))}
                  >
                    I'll re-upload data instead
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white px-6"
                    onClick={handleExcludeAllAffected}
                  >
                    Exclude all {new Set(mappingSummary.missingRoles.flatMap(r => 
                      selectedMetrics.filter(m => getRequiredColumnsForMetric(resolvedTaskType, m.id).some(rm => rm.code === r.code)).map(m => m.id)
                    )).size} affected metrics
                  </Button>
                </div>
              </div>
            </div>
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
