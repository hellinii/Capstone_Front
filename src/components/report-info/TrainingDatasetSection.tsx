/**
 * 학습 데이터셋 정보 (성적서 구간).
 *
 * 종전에는 데이터 업로드 화면의 "training" 탭이었다. 평가에 쓰이지 않고 성적서 3절을
 * 채우는 값이라 성적서 구간으로 옮겼다 — 모델 성능만 보려는 사용자가 학습 표본 수를
 * 입력할 이유가 없다.
 */
import { useRef, type ChangeEvent } from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import type { DatasetInfoFormData, UploadedFileInfo } from "../../types/workflow.types";
import {
  ExampleUploadSlot,
  Field,
  SampleCountCard,
  TEXTAREA_CLASS,
  toUploadedFileInfoAsync,
} from "../data-upload/shared";

interface TrainingDatasetSectionProps {
  datasetInfo: DatasetInfoFormData;
  onDatasetInfoChange: (
    value: DatasetInfoFormData | ((prev: DatasetInfoFormData) => DatasetInfoFormData),
  ) => void;
  trainingExampleFiles: UploadedFileInfo[];
  onTrainingExampleFilesChange: (
    value: UploadedFileInfo[] | ((prev: UploadedFileInfo[]) => UploadedFileInfo[]),
  ) => void;
  trainingUnsuitableExampleFiles: UploadedFileInfo[];
  onTrainingUnsuitableExampleFilesChange: (
    value: UploadedFileInfo[] | ((prev: UploadedFileInfo[]) => UploadedFileInfo[]),
  ) => void;
}

export function isTrainingDatasetInfoValid(datasetInfo: DatasetInfoFormData) {
  return (
    datasetInfo.trainingDatasetName.trim() !== "" &&
    datasetInfo.trainingSampleCount.trim() !== "" &&
    datasetInfo.validationSampleCount.trim() !== ""
  );
}

export function TrainingDatasetSection({
  datasetInfo,
  onDatasetInfoChange,
  trainingExampleFiles,
  onTrainingExampleFilesChange,
  trainingUnsuitableExampleFiles,
  onTrainingUnsuitableExampleFilesChange,
}: TrainingDatasetSectionProps) {
  const exampleInputRef = useRef<HTMLInputElement>(null);
  const unsuitableInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof DatasetInfoFormData>(field: K, value: DatasetInfoFormData[K]) => {
    onDatasetInfoChange((prev) => ({ ...prev, [field]: value }));
  };

  const trainingCount = Number(datasetInfo.trainingSampleCount);
  const validationCount = Number(datasetInfo.validationSampleCount);
  const hasCounts =
    Number.isFinite(trainingCount) &&
    Number.isFinite(validationCount) &&
    trainingCount >= 0 &&
    validationCount >= 0 &&
    datasetInfo.trainingSampleCount.trim() !== "" &&
    datasetInfo.validationSampleCount.trim() !== "";
  const totalCount = hasCounts ? trainingCount + validationCount : null;

  const label = (raw: string) =>
    raw.trim() !== "" && Number.isFinite(Number(raw)) ? Number(raw).toLocaleString() : "-";

  const addExample = async (
    file: File,
    setter: (value: UploadedFileInfo[] | ((prev: UploadedFileInfo[]) => UploadedFileInfo[])) => void,
  ) => {
    const info = await toUploadedFileInfoAsync(file);
    setter((prev) => [...prev, info]);
  };

  const onPick = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: UploadedFileInfo[] | ((prev: UploadedFileInfo[]) => UploadedFileInfo[])) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void addExample(file, setter);
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <input
        ref={exampleInputRef}
        type="file"
        accept="image/*,.csv,.json,application/json,text/csv"
        className="hidden"
        onChange={(event) => onPick(event, onTrainingExampleFilesChange)}
      />
      <input
        ref={unsuitableInputRef}
        type="file"
        accept="image/*,.csv,.json,application/json,text/csv"
        className="hidden"
        onChange={(event) => onPick(event, onTrainingUnsuitableExampleFilesChange)}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Training dataset information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Describe the dataset used to train the model. This fills the training data section of the
            report and is not used to compute any metric.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Training dataset name" required>
              <Input
                value={datasetInfo.trainingDatasetName}
                onChange={(event) => update("trainingDatasetName", event.target.value)}
                placeholder="e.g. Product defect image training set"
              />
            </Field>
            <Field label="Training data format">
              <Input
                value={datasetInfo.trainingDataFormat}
                onChange={(event) => update("trainingDataFormat", event.target.value)}
                placeholder="e.g. Structured CSV, image (JPG/PNG), text"
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Training samples" required>
                <Input
                  inputMode="numeric"
                  className="font-mono tabular-nums"
                  value={datasetInfo.trainingSampleCount}
                  onChange={(event) =>
                    update("trainingSampleCount", event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="1161"
                />
              </Field>
              <Field label="Validation samples" required>
                <Input
                  inputMode="numeric"
                  className="font-mono tabular-nums"
                  value={datasetInfo.validationSampleCount}
                  onChange={(event) =>
                    update("validationSampleCount", event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="291"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SampleCountCard
                label="Total samples"
                value={totalCount !== null ? totalCount.toLocaleString() : "-"}
              />
              <SampleCountCard label="Training" value={label(datasetInfo.trainingSampleCount)} />
              <SampleCountCard label="Validation" value={label(datasetInfo.validationSampleCount)} />
            </div>
          </div>

          <Field label="Class distribution">
            <textarea
              className={TEXTAREA_CLASS}
              rows={3}
              value={datasetInfo.trainingClassDistribution}
              onChange={(event) => update("trainingClassDistribution", event.target.value)}
              placeholder="Per-class sample counts or ratios, e.g. cat 5,000 / dog 5,000 / bird 3,000"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Training data example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border bg-muted/60 p-3 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Upload a representative valid training sample that matches the dataset definition.</p>
              <p>
                You can also add an edge or unsuitable example to document what should be excluded or
                reviewed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ExampleUploadSlot
              title="Representative valid example"
              description="A clear sample that should be included in the training dataset."
              files={trainingExampleFiles}
              onChoose={() => exampleInputRef.current?.click()}
              onRemove={(index) =>
                onTrainingExampleFilesChange((prev) => prev.filter((_, i) => i !== index))
              }
              onFileDrop={(file) => void addExample(file, onTrainingExampleFilesChange)}
            />
            <ExampleUploadSlot
              title="Edge or unsuitable example"
              description="Optional sample that should be excluded, reviewed, or treated with caution."
              files={trainingUnsuitableExampleFiles}
              onChoose={() => unsuitableInputRef.current?.click()}
              onRemove={(index) =>
                onTrainingUnsuitableExampleFilesChange((prev) => prev.filter((_, i) => i !== index))
              }
              onFileDrop={(file) => void addExample(file, onTrainingUnsuitableExampleFilesChange)}
              optional
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
