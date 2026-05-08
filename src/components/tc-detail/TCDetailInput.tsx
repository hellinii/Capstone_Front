import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../utils/styling/styles";
import {
  getRequiredColumnsForMetric,
  getSelectedMetrics,
  selectionNeedsField,
  type TaskType,
} from "../../data/evaluationData";
import type { MetricDetailState, MetricDetailStateMap } from "../../types/workflow.types";
import { parseNumericValue, getTargetValueRule } from "../../utils/domain/validation";

interface TCDetailInputProps {
  metricDetails: MetricDetailStateMap;
  onMetricDetailsChange: (value: MetricDetailStateMap | ((prev: MetricDetailStateMap) => MetricDetailStateMap)) => void;
  currentMetricIndex: number;
  onCurrentMetricIndexChange: (idx: number) => void;
}

function createDefaultState(id: string, name: string): MetricDetailState {
  return {
    id,
    name,
    description: "",
    targetValue: "",
    targetCondition: "above",
    beta: id === "TC5" ? "1.0" : "",
    positiveClass: "",
    completed: false,
  };
}

export function TCDetailInput({
  taskType = "",
  selectedMetricIds = [],
  metricDetails,
  onMetricDetailsChange,
  currentMetricIndex,
  onCurrentMetricIndexChange,
}: TCDetailInputProps) {
  const resolvedTaskType = taskType || "multiclass";
  const selectedMetrics = useMemo(() => getSelectedMetrics(resolvedTaskType, selectedMetricIds), [resolvedTaskType, selectedMetricIds]);

  useEffect(() => {
    if (selectedMetrics.length === 0) {
      return;
    }

    onMetricDetailsChange((prev) => {
      const next = { ...prev };
      for (const metric of selectedMetrics) {
        next[metric.id] = next[metric.id] ?? createDefaultState(metric.id, metric.name);
      }
      return next;
    });
  }, [selectedMetrics, onMetricDetailsChange]);

  if (selectedMetrics.length === 0) {
    return (
      <main className="px-8 pt-12 pb-24 max-w-[1344px] mx-auto">
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Select metrics in Step 2 before entering metric details.
          </CardContent>
        </Card>
      </main>
    );
  }

  const currentMetric = selectedMetrics[currentMetricIndex];
  const currentState = metricDetails[currentMetric.id] ?? createDefaultState(currentMetric.id, currentMetric.name);
  const requiredColumns = getRequiredColumnsForMetric(resolvedTaskType, currentMetric.id);
  const needsPositiveClass = selectionNeedsField(resolvedTaskType, [currentMetric.id], "positiveClass");
  const needsBeta = selectionNeedsField(resolvedTaskType, [currentMetric.id], "beta");
  const isLastMetric = currentMetricIndex === selectedMetrics.length - 1;
  const targetValueRule = getTargetValueRule(currentMetric.id);
  const targetValueHint =
    currentMetric.id === "TC6"
      ? "Enter the maximum acceptable divergence value for this metric."
      : "Enter the minimum metric value you want this metric to achieve.";
  const parsedTargetValue = parseNumericValue(currentState.targetValue);
  const targetValueError =
    currentState.targetValue.trim() === ""
      ? "Target value is required."
      : parsedTargetValue === null
        ? "Target value must be a valid number."
        : targetValueRule.validate(parsedTargetValue);
  const parsedBeta = parseNumericValue(currentState.beta);
  const betaError = !needsBeta
    ? null
    : currentState.beta.trim() === ""
      ? "Beta is required for this metric."
      : parsedBeta === null
        ? "Beta must be a valid number."
        : parsedBeta <= 0
          ? "Beta must be greater than 0."
          : null;
  const positiveClassError = needsPositiveClass && currentState.positiveClass.trim() === ""
    ? "Positive class is required for this metric."
    : null;

  const updateCurrent = (patch: Partial<MetricDetailState>) => {
    onMetricDetailsChange((prev) => ({
      ...prev,
      [currentMetric.id]: {
        ...currentState,
        ...patch,
      },
    }));
  };

  const isComplete = !targetValueError && !betaError && !positiveClassError;

  const handleNextClick = () => {
    updateCurrent({ completed: true });

    if (isLastTC) {
      onNext();
      return;
    }

    setCurrentTCIndex((prev) => prev + 1);
  };

  const handlePreviousClick = () => {
    if (currentTCIndex === 0) {
      onPrevious();
      return;
    }

    setCurrentTCIndex((prev) => prev - 1);
  };

  return (
    <>
      <main className="px-8 pt-12 pb-24 max-w-[1344px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Metric details</h1>
          <p className="text-sm text-muted-foreground">Set target values and any extra inputs required by each selected metric.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Selected metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedMetrics.map((metric, index) => (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => onCurrentMetricIndexChange(index)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    index === currentMetricIndex ? "border-primary bg-blue-50" : "border-border bg-card hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">{metric.id}</div>
                      <div className="text-sm font-semibold">{metric.name}</div>
                    </div>
                    {metricDetails[metric.id]?.completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{currentMetric.id} details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="targetValue">Target value</Label>
                <Input
                  id="targetValue"
                  value={currentState.targetValue}
                  onChange={(e) => updateCurrent({ targetValue: e.target.value })}
                  placeholder="e.g. 0.85"
                  aria-invalid={Boolean(targetValueError)}
                />
                <p className="text-xs text-muted-foreground">{targetValueHint}</p>
                <p className="text-xs text-muted-foreground">{targetValueRule.summary}</p>
                {targetValueError && <p className="text-xs text-destructive">{targetValueError}</p>}
              </div>

              <div className="space-y-2">
                <Label>Target condition</Label>
                <Select value={currentState.targetCondition} onValueChange={(value: "above" | "below" | "within") => updateCurrent({ targetCondition: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                    <SelectItem value="within">Within range</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how the target value should be evaluated, such as above 0.85 or below 0.10.
                </p>
              </div>

              {needsPositiveClass && (
                <div className="space-y-2">
                  <Label htmlFor="positiveClass">Positive class</Label>
                  <Input
                    id="positiveClass"
                    value={currentState.positiveClass}
                    onChange={(e) => updateCurrent({ positiveClass: e.target.value })}
                    placeholder="e.g. positive"
                    aria-invalid={Boolean(positiveClassError)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the class treated as the positive outcome when computing metrics like precision, recall, and specificity.
                  </p>
                  {positiveClassError && <p className="text-xs text-destructive">{positiveClassError}</p>}
                </div>
              )}

              {needsBeta && (
                <div className="space-y-2">
                  <Label htmlFor="beta">Beta</Label>
                  <Input
                    id="beta"
                    value={currentState.beta}
                    onChange={(e) => updateCurrent({ beta: e.target.value })}
                    placeholder="1.0"
                    aria-invalid={Boolean(betaError)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Beta controls the balance between precision and recall. `1.0` means equal weight, values above `1.0` emphasize recall, and values below `1.0` emphasize precision.
                  </p>
                  {betaError && <p className="text-xs text-destructive">{betaError}</p>}
                </div>
              )}

              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="text-sm font-medium text-blue-950">Required columns for this metric</div>
                <div className="flex flex-wrap gap-2">
                  {requiredColumns.map((column) => (
                    <Badge key={column.code} variant="secondary">
                      {column.code}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-3">
                  {requiredColumns.map((column) => (
                    <div key={column.code} className="rounded-md border border-blue-200 bg-white/80 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{column.code}</Badge>
                        <span className="text-sm font-medium text-slate-900">{column.label}</span>
                      </div>
                      <p className="text-xs text-slate-600">{column.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

export function isCurrentMetricValid(
  taskType: TaskType | "",
  metricId: string,
  state: MetricDetailState
) {
  const needsPositiveClass = selectionNeedsField(taskType || "multiclass", [metricId], "positiveClass");
  const needsBeta = selectionNeedsField(taskType || "multiclass", [metricId], "beta");
  
  const parsedTargetValue = parseNumericValue(state.targetValue);
  const targetValueRule = getTargetValueRule(metricId);
  const targetValueError =
    state.targetValue.trim() === ""
      ? "Target value is required."
      : parsedTargetValue === null
        ? "Target value must be a valid number."
        : targetValueRule.validate(parsedTargetValue);

  const parsedBeta = parseNumericValue(state.beta);
  const betaError = !needsBeta
    ? null
    : state.beta.trim() === ""
      ? "Beta is required for this metric."
      : parsedBeta === null
        ? "Beta must be a valid number."
        : parsedBeta <= 0
          ? "Beta must be greater than 0."
          : null;

  const isComplete =
    !targetValueError &&
    !betaError &&
    (!needsPositiveClass || state.positiveClass.trim() !== "");

  return isComplete;
}
