import { X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  type MetricDefinition,
  type RequiredColumnDisplay,
  type TaskType,
  getRequiredColumnsForMetric,
} from "../../data/evaluationData";

interface MappingResolutionViewProps {
  missingRoles: RequiredColumnDisplay[];
  selectedMetrics: MetricDefinition[];
  resolvedTaskType: TaskType;
  onClose: () => void;
  onRemoveMetric: (id: string) => void;
  onExcludeAllAffected: () => void;
  onGoBackToUpload: () => void;
}

export function MappingResolutionView({
  missingRoles,
  selectedMetrics,
  resolvedTaskType,
  onClose,
  onRemoveMetric,
  onExcludeAllAffected,
  onGoBackToUpload,
}: MappingResolutionViewProps) {
  return (
    <div className="rounded-2xl border-2 border-red-200 bg-white p-8 shadow-xl animate-in fade-in zoom-in duration-300">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Resolve missing column requirements</h2>
          <p className="text-slate-600">
            The following columns are missing from your dataset. You can resolve this by excluding the metrics that require them.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {missingRoles.map((role) => {
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
                    <div
                      key={metric.id}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100 shadow-sm"
                    >
                      <span className="text-sm font-medium text-slate-700">{metric.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                        onClick={() => onRemoveMetric(metric.id)}
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
        <Button variant="ghost" className="text-slate-500 hover:text-slate-700" onClick={onClose}>
          Cancel and go back
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-700" onClick={onGoBackToUpload}>
            I'll re-upload data instead
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white px-6" onClick={onExcludeAllAffected}>
            Exclude all affected metrics
          </Button>
        </div>
      </div>
    </div>
  );
}
