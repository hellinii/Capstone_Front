import { Info, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { cn } from "../../utils/styling/styles";
import type { TaskType } from "../../data/evaluationData";
import type { MappingRow } from "../../types/mapping.types";

interface BinaryClassificationCardProps {
  resolvedTaskType: TaskType;
  positiveClass: string;
  setPositiveClass: (val: string) => void;
  yTrueRow: MappingRow | undefined;
  yTrueValues: string[];
}

export function BinaryClassificationCard({
  resolvedTaskType,
  positiveClass,
  setPositiveClass,
  yTrueRow,
  yTrueValues,
}: BinaryClassificationCardProps) {
  if (resolvedTaskType !== "binary") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Binary classification settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Which value is the positive class? The evaluation metrics will treat this value as "Positive" (1) and all others as "Negative" (0).
          </p>

          {yTrueRow ? (
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">Positive class value:</div>
              <Select value={positiveClass} onValueChange={setPositiveClass}>
                <SelectTrigger className={cn("w-[200px]", positiveClass === "" && "border-destructive")}>
                  <SelectValue placeholder="Select positive class" />
                </SelectTrigger>
                <SelectContent>
                  {yTrueValues.map((val) => (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Alert className="bg-muted border-border">
              <Info className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-muted-foreground">
                Assign a column to the <strong>y_true</strong> role first to see available class values.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
