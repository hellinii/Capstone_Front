import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { AppShell } from "../../layout/AppShell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { BasicInfo as BasicInfoContent, isBasicInfoValid } from "../../components/basic-info/BasicInfo";
import { TrainingDatasetSection } from "../../components/report-info/TrainingDatasetSection";
import { Field, TEXTAREA_CLASS } from "../../components/data-upload/shared";
import { useWorkspaceStore } from "../../utils/stores/useWorkspaceStore";
import { getSelectedMetrics, type TaskType } from "../../data/evaluationData";
import { getTargetValueRule, metricNeedsTargetValue, parseNumericValue } from "../../utils/domain/validation";
import type { MapWorkflowToReportInput } from "../../lib/report/mapWorkflowToFinalReport";
import {
  DEFAULT_BASIC_INFO,
  DEFAULT_DATASET_INFO,
  type BasicInfoFormData,
  type DatasetInfoFormData,
  type MetricDetailStateMap,
  type UploadedFileInfo,
} from "../../types/workflow.types";

/**
 * 성적서 구간 — 평가가 끝난 뒤에만 온다.
 *
 * 여기 모인 셋은 **평가에 전혀 쓰이지 않는다**. `/api/evaluate` 페이로드는
 * task_type·column_mappings·selected_metric_ids·metadata·beta·decision_threshold 뿐이고,
 * 기관 정보·학습 데이터셋 정보·목표값은 하나도 들어가지 않는다. 성적서 문서를 그릴 때만
 * 쓰인다 — 그래서 "정확도가 몇 %인지"만 보려는 사용자의 앞을 막지 않도록 뒤로 뺐다.
 *
 * 세 기능을 한 화면의 세 카드로 묶었다. 각각을 별도 단계로 두면 성적서까지 가는 길이
 * 네 화면 더 길어지는데, 셋 다 단순 입력 폼이라 나눌 이유가 없다.
 *
 * **편집 대상은 전역 워크플로우 store 가 아니라 이 run 의 `workflowSnapshot` 이다.**
 * 워크스페이스에서 예전 평가의 성적서를 손보는 동안 지금 작업 중인 다른 평가의 입력이
 * 덮이면 안 되고, 반대로 지금 작업 중인 입력이 예전 성적서에 새어 들어가서도 안 된다.
 * 그래서 스냅샷을 초안으로 떠서 고치고, 화면을 떠날 때 그 run 에만 되돌려 적는다.
 * 성적서는 `useReportData` → `applyUserInputs` 가 이 스냅샷을 읽어 다시 그린다.
 */
export function ReportInfo() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const run = useWorkspaceStore((state) => state.evaluationRuns.find((item) => item.id === id));
  const updateEvaluationRun = useWorkspaceStore((state) => state.updateEvaluationRun);

  const [draft, setDraft] = useState<ReportInfoDraft>(() => toDraft(run?.workflowSnapshot));

  // 삭제된 평가의 링크를 열었을 때 빈 폼을 채우게 두지 않는다 — 저장할 곳이 없다.
  if (!run) {
    return <Navigate to="/workspaces" replace />;
  }

  const snapshot = run.workflowSnapshot;
  const selectedMetrics = getSelectedMetrics(
    (snapshot?.taskType || "multiclass") as TaskType,
    snapshot?.selectedMetricIds ?? [],
  );
  const targetMetrics = selectedMetrics.filter((m) => metricNeedsTargetValue(m.id));

  const setBasicInfo = (
    value: BasicInfoFormData | ((prev: BasicInfoFormData) => BasicInfoFormData),
  ) =>
    setDraft((prev) => ({
      ...prev,
      basicInfo: typeof value === "function" ? value(prev.basicInfo) : value,
    }));

  const setDatasetInfo = (
    value: DatasetInfoFormData | ((prev: DatasetInfoFormData) => DatasetInfoFormData),
  ) =>
    setDraft((prev) => ({
      ...prev,
      datasetInfo: typeof value === "function" ? value(prev.datasetInfo) : value,
    }));

  const setTrainingExampleFiles = (
    value: UploadedFileInfo[] | ((prev: UploadedFileInfo[]) => UploadedFileInfo[]),
  ) =>
    setDraft((prev) => ({
      ...prev,
      trainingExampleFiles:
        typeof value === "function" ? value(prev.trainingExampleFiles) : value,
    }));

  const setTrainingUnsuitableExampleFiles = (
    value: UploadedFileInfo[] | ((prev: UploadedFileInfo[]) => UploadedFileInfo[]),
  ) =>
    setDraft((prev) => ({
      ...prev,
      trainingUnsuitableExampleFiles:
        typeof value === "function" ? value(prev.trainingUnsuitableExampleFiles) : value,
    }));

  const updateTarget = (metricId: string, name: string, value: string) => {
    setDraft((prev) => {
      const existing = prev.metricDetails[metricId] ?? {
        id: metricId,
        name,
        description: "",
        beta: "",
        positiveClass: "",
        completed: false,
        targetValue: "",
      };
      return {
        ...prev,
        metricDetails: { ...prev.metricDetails, [metricId]: { ...existing, targetValue: value } },
      };
    });
  };

  /**
   * 초안을 run 에 적는다. 양쪽 버튼이 모두 거친다 — "Back to results" 로 나가면서
   * 방금 친 내용이 말없이 사라지면, 입력이 저장되지 않는 것처럼 보인다.
   */
  const save = () => {
    updateEvaluationRun(run.id, {
      // 모델명·버전은 성적서와 워크스페이스 목록이 함께 쓰는 값이다. 여기서 고친 뒤
      // run 쪽을 놔두면 성적서와 목록이 서로 다른 이름을 말하게 된다.
      modelName: draft.basicInfo.modelName || run.modelName,
      versionName: draft.basicInfo.versionName || run.versionName,
      workflowSnapshot: {
        ...snapshot,
        basicInfo: draft.basicInfo,
        datasetInfo: draft.datasetInfo,
        metricDetails: draft.metricDetails,
        trainingExampleFiles: draft.trainingExampleFiles,
        trainingUnsuitableExampleFiles: draft.trainingUnsuitableExampleFiles,
      },
    });
  };

  const targetsValid = targetMetrics.every((metric) => {
    const raw = draft.metricDetails[metric.id]?.targetValue ?? "";
    if (raw.trim() === "") return false;
    const parsed = parseNumericValue(raw);
    if (parsed === null) return false;
    return getTargetValueRule(metric.id).validate(parsed) === null;
  });

  const canContinue = isBasicInfoValid(draft.basicInfo) && targetsValid;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Report details</h1>
          <p className="text-sm text-muted-foreground">
            Your evaluation is already complete. These details are only used to render the official
            test report.
          </p>
        </div>

        <BasicInfoContent formData={draft.basicInfo} onFormDataChange={setBasicInfo} />

        <TrainingDatasetSection
          datasetInfo={draft.datasetInfo}
          onDatasetInfoChange={setDatasetInfo}
          trainingExampleFiles={draft.trainingExampleFiles}
          onTrainingExampleFilesChange={setTrainingExampleFiles}
          trainingUnsuitableExampleFiles={draft.trainingUnsuitableExampleFiles}
          onTrainingUnsuitableExampleFilesChange={setTrainingUnsuitableExampleFiles}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pass criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set the target each metric must reach for the report to mark it as passing. These values
              do not change the measured results.
            </p>

            {targetMetrics.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                None of the selected metrics take a pass target.
              </div>
            ) : (
              <div className="space-y-4">
                {targetMetrics.map((metric) => {
                  const raw = draft.metricDetails[metric.id]?.targetValue ?? "";
                  const parsed = parseNumericValue(raw);
                  const rule = getTargetValueRule(metric.id);
                  const error =
                    raw.trim() === ""
                      ? "Target value is required."
                      : parsed === null
                        ? "Target value must be a valid number."
                        : rule.validate(parsed);

                  return (
                    <div
                      key={metric.id}
                      className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_200px]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{metric.id}</span>
                          <span className="text-sm font-semibold">{metric.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{rule.summary}</p>
                      </div>
                      <div className="space-y-1">
                        <Input
                          className="font-mono tabular-nums"
                          inputMode="decimal"
                          value={raw}
                          onChange={(event) => updateTarget(metric.id, metric.name, event.target.value)}
                          aria-invalid={Boolean(error)}
                          aria-label={`${metric.id} target value`}
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Field label="Report notes">
              <textarea
                className={TEXTAREA_CLASS}
                rows={3}
                value={draft.datasetInfo.trainingDataDescription}
                onChange={(event) =>
                  setDatasetInfo((prev) => ({
                    ...prev,
                    trainingDataDescription: event.target.value,
                  }))
                }
                placeholder="Anything the reader should know about this evaluation (optional)"
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
          <Button
            variant="outline"
            onClick={() => {
              save();
              navigate(`/report/${id}/summary`);
            }}
          >
            Back to results
          </Button>
          <Button
            disabled={!canContinue}
            onClick={() => {
              save();
              navigate(`/report/${id}`);
            }}
          >
            Save and view report
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

/** 이 화면이 고치는 필드들. 스냅샷의 나머지(업로드 파일·매핑·metadata)는 평가의 산물이라 건드리지 않는다. */
interface ReportInfoDraft {
  basicInfo: BasicInfoFormData;
  datasetInfo: DatasetInfoFormData;
  metricDetails: MetricDetailStateMap;
  trainingExampleFiles: UploadedFileInfo[];
  trainingUnsuitableExampleFiles: UploadedFileInfo[];
}

function toDraft(snapshot: MapWorkflowToReportInput | undefined): ReportInfoDraft {
  return {
    basicInfo: snapshot?.basicInfo ?? DEFAULT_BASIC_INFO,
    datasetInfo: snapshot?.datasetInfo ?? DEFAULT_DATASET_INFO,
    metricDetails: snapshot?.metricDetails ?? {},
    trainingExampleFiles: snapshot?.trainingExampleFiles ?? [],
    trainingUnsuitableExampleFiles: snapshot?.trainingUnsuitableExampleFiles ?? [],
  };
}
