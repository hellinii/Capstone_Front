import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "./checkbox";
import { Label } from "../ui/label";
import { cn } from "../../utils/styling/styles";
import {
  getAvailableMetrics,
  getRecommendedMetricIds,
  TASK_TYPE_LABELS,
  type TaskType,
} from "../../data/evaluationData";

interface TestItemsProps {
  taskType?: TaskType | "";
  onSelectedMetricsChange?: (ids: string[]) => void;
}

export function TestItems({
  taskType,
  onSelectedMetricsChange,
}: TestItemsProps) {
  const availableMetrics = useMemo(() => getAvailableMetrics(taskType), [taskType]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  useEffect(() => {
    setSelectedMetrics([]);
    onSelectedMetricsChange?.([]);
  }, [taskType, onSelectedMetricsChange]);

  const handleToggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) => {
      const next = prev.includes(metricId) ? prev.filter((id) => id !== metricId) : [...prev, metricId];
      onSelectedMetricsChange?.(next);
      return next;
    });
  };

  const handleRecommended = () => {
    const recommended = getRecommendedMetricIds(taskType);
    setSelectedMetrics(recommended);
    onSelectedMetricsChange?.(recommended);
  };

  const handleSelectAll = () => {
    const next = availableMetrics.map((m) => m.id);
    setSelectedMetrics(next);
    onSelectedMetricsChange?.(next);
  };

  const handleClear = () => {
    setSelectedMetrics([]);
    onSelectedMetricsChange?.([]);
  };

  return (
    <>
      <main className="px-8 pt-12 pb-24 max-w-[1344px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Test item selection</h1>
          <p className="text-sm text-muted-foreground">
            Choose the evaluation metrics that should be included in the report.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold">{selectedMetrics.length}</span> selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRecommended} disabled={!taskType}>
              Recommended
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={!taskType}>
              Select all
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Classifier: </span>
          <Badge variant="secondary">{taskType ? TASK_TYPE_LABELS[taskType] : "Choose in Step 1"}</Badge>
        </div>

        {!taskType ? (
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">
              Choose a classifier type in Step 1 before selecting metrics.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {availableMetrics.map((metric) => {
              const isSelected = selectedMetrics.includes(metric.id);

              return (
                <label
                  key={metric.id}
                  className={cn(
                    "relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-colors min-h-[180px]",
                    isSelected ? "border-primary bg-blue-50" : "border-border bg-card hover:border-gray-400",
                  )}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggleMetric(metric.id)} className="mt-0.5" />
                    {metric.additionalFields?.includes("beta") && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        beta
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="font-mono text-xs uppercase font-medium text-muted-foreground">{metric.id}</div>
                    <h3 className="text-base font-semibold leading-tight">{metric.name}</h3>
                    <div className="text-sm text-foreground">{metric.subtitle}</div>
                    <p className="text-xs text-[#6B7280] leading-[1.5]">{metric.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {selectedMetrics.includes("TC5") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">F-beta note</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p>`TC5` requires a beta value in the next step.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Selection rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>`TC5` (F-beta Score) requires beta input.</div>
            <div>Some binary metrics also require a positive class selection.</div>
            <div>Probability columns become required automatically for probability-based metrics.</div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
