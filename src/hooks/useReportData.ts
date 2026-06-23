/**
 * 최종 성적서 데이터 페칭 훅.
 *
 * - id === "preview": 워크플로우 store에서 입력값을 읽어 백엔드 /api/evaluate를 호출하여 데이터 계산 및 병합
 * - 그 외 id: 향후 백엔드 API 호출로 교체 (현재는 MOCK_FINAL_REPORT fallback)
 */
import { useEffect, useState } from "react";
import { MOCK_FINAL_REPORT } from "../data/mockReport";
import { mapWorkflowToFinalReport } from "../lib/report/mapWorkflowToFinalReport";
import type { FinalReportData } from "../types/finalReport.types";
import { useWorkflowStore } from "../utils/stores/useWorkflowStore";
import { useWorkspaceStore } from "../utils/stores/useWorkspaceStore";
import { getMetricDisplayId, METRICS } from "../data/evaluationData";

interface UseReportDataResult {
  data: FinalReportData | null;
  isLoading: boolean;
  error?: string | null;
}

export function useReportData(id: string): UseReportDataResult {
  const workflowState = useWorkflowStore();
  const run = useWorkspaceStore((state) =>
    state.evaluationRuns.find((item) => item.id === id),
  );

  const [data, setData] = useState<FinalReportData | null>(() => {
    if (run?.reportData && (run.reportData as any).isEvaluated) {
      return run.reportData;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 만약 워크스페이스에 기 저장된 run 정보가 있고, 이미 계산이 완료된 상태라면 바로 캐시 반환
    if (run?.reportData && (run.reportData as any).isEvaluated) {
      setData(run.reportData);
      return;
    }

    if (id !== "preview" && !workflowState.rawFile) {
      setData(run?.reportData || MOCK_FINAL_REPORT);
      return;
    }

    // rawFile이 없다면 (쇼케이스 모드 등) 바로 매핑한 기본 리포트 반환
    if (!workflowState.rawFile) {
      const baseReport = mapWorkflowToFinalReport({
        basicInfo: workflowState.basicInfo,
        datasetInfo: workflowState.datasetInfo,
        taskType: workflowState.taskType,
        selectedMetricIds: workflowState.selectedMetricIds,
        metricDetails: workflowState.metricDetails,
        uploadedFile: workflowState.uploadedFile,
        trainingExampleFiles: workflowState.trainingExampleFiles,
        trainingUnsuitableExampleFiles: workflowState.trainingUnsuitableExampleFiles,
        columnMapping: workflowState.columnMapping,
        classLabelDescriptions: workflowState.classLabelDescriptions,
      });
      setData(baseReport);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    const runEvaluate = async () => {
      try {
        const translateRoleToBackend = (role: string | null, taskType: string) => {
          if (!role) return "ignore";
          if (role === "id") return "sample_id";
          if (role === "ignore") return "ignore";
          
          if (taskType === "binary") {
            if (role === "y_true") return "y_true";
            if (role === "y_pred") return "y_pred";
            if (role === "score") return "score_positive";
          } else if (taskType === "multiclass") {
            if (role === "y_true") return "y_true";
            if (role === "y_pred") return "y_pred";
            if (role === "prob_class_*") return "prob_per_class";
          } else if (taskType === "multilabel") {
            if (role === "y_true") return "true_labels";
            if (role === "y_pred") return "pred_labels";
            if (role === "prob_label_*") return "score_per_label";
          }
          return "ignore";
        };

        const backendMappings = workflowState.columnMapping.map((row) => ({
          column: row.originalName,
          role: translateRoleToBackend(row.confirmedRole, workflowState.taskType || "multiclass"),
          sample_values: row.sampleValues,
        }));

        const metadata = {
          positive_class: workflowState.metadata?.positive_class || null,
          negative_class: workflowState.metadata?.negative_class || null,
          positive_class_ambiguous: workflowState.metadata?.positive_class_ambiguous || false,
          detected_classes: workflowState.metadata?.detected_classes || [],
          detected_labels: workflowState.metadata?.detected_labels || [],
          class_distribution: workflowState.metadata?.class_distribution || {},
        };

        const beta = parseFloat(workflowState.metricDetails["TC5"]?.beta || "1.0");

        const payload = {
          task_type: workflowState.taskType || "multiclass",
          column_mappings: backendMappings,
          selected_tcs: workflowState.selectedMetricIds,
          metadata: metadata,
          beta: beta,
        };

        const formData = new FormData();
        formData.append("file", workflowState.rawFile!);
        formData.append("data", JSON.stringify(payload));

        const response = await fetch("/api/evaluate", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.detail || `Server error: ${response.status}`;
          throw new Error(errorMessage);
        }

        const result = await response.json();
        if (!active) return;

        const baseReport = mapWorkflowToFinalReport({
          basicInfo: workflowState.basicInfo,
          datasetInfo: workflowState.datasetInfo,
          taskType: workflowState.taskType,
          selectedMetricIds: workflowState.selectedMetricIds,
          metricDetails: workflowState.metricDetails,
          uploadedFile: workflowState.uploadedFile,
          trainingExampleFiles: workflowState.trainingExampleFiles,
          trainingUnsuitableExampleFiles: workflowState.trainingUnsuitableExampleFiles,
          columnMapping: workflowState.columnMapping,
          classLabelDescriptions: workflowState.classLabelDescriptions,
        });

        const success_metrics = result.results.success_metrics || {};

        // 1. KPI 지표 계산값 치환
        const updatedKpiResults = workflowState.selectedMetricIds
          .map((tcId) => {
            const metric = METRICS.find((m) => m.id === tcId);
            if (!metric) return null;

            const val = success_metrics[tcId];
            const detail = workflowState.metricDetails[tcId];
            const target = parseFloat(detail?.targetValue ?? "");
            const hasThreshold = Number.isFinite(target) && target > 0;

            let status = "pass";
            if (hasThreshold && typeof val === "number") {
              status = val >= target ? "pass" : "fail";
            }

            let perClass: Array<{ label: string; value: number; status: string }> | undefined;
            if (["TC2", "TC3", "TC4"].includes(tcId) && success_metrics["TC22"]) {
              const classReport = success_metrics["TC22"];
              const yTrueRow = workflowState.columnMapping.find((r) => r.confirmedRole === "y_true");
              const classValues = yTrueRow ? [...new Set(yTrueRow.sampleValues)] : [];
              
              const metricKeyMap: Record<string, string> = {
                "TC2": "precision",
                "TC3": "recall",
                "TC4": "f1-score",
              };
              const key = metricKeyMap[tcId];

              if (classValues.length > 0 && key) {
                perClass = classValues.map((val) => {
                  const classVal = classReport[val];
                  const score = classVal ? classVal[key] : 0;
                  let classStatus = "pass";
                  if (hasThreshold) {
                    classStatus = score >= target ? "pass" : "fail";
                  }
                  return {
                    label: val,
                    value: score,
                    status: classStatus,
                  };
                });
              }
            }

            return {
              tcId: getMetricDisplayId(tcId),
              name: metric.name,
              value: typeof val === "number" ? val : 0,
              threshold: hasThreshold ? target : 0,
              status,
              perClass,
            };
          })
          .filter((item): item is any => item !== null);

        // 2. 오차 행렬(Confusion Matrix) 치환
        let confusionMatrix = null;
        if (success_metrics.TC21) {
          const cm = success_metrics.TC21;
          if (cm.type === "multilabel") {
            const labelName = workflowState.metadata?.detected_labels?.[0] || "Label 0";
            const matrix = cm.matrix[0] || [[0, 0], [0, 0]];
            const total = matrix.reduce((acc: number, row: number[]) => acc + row.reduce((a, b) => a + b, 0), 0);
            confusionMatrix = {
              labels: [`Negative (${labelName})`, `Positive (${labelName})`],
              matrix: matrix,
              totalSamples: total,
            };
          } else {
            const total = cm.matrix.reduce((acc: number, row: number[]) => acc + row.reduce((a, b) => a + b, 0), 0);
            confusionMatrix = {
              labels: cm.labels || cm.matrix.map((_: any, idx: number) => `Class ${idx}`),
              matrix: cm.matrix,
              totalSamples: total,
            };
          }
        }

        // 3. 결측치 제외 안내 텍스트 구성
        let datasetDiagnosis = baseReport.datasetDiagnosis;
        if (result.dropped_rows > 0) {
          datasetDiagnosis = `결측치(NaN) 제거 전처리로 인해 전체 행 중 ${result.dropped_rows}개 샘플이 평가에서 제외되었습니다. \n` + datasetDiagnosis;
        }

        const mergedReport: FinalReportData = {
          ...baseReport,
          kpiResults: updatedKpiResults,
          datasetDiagnosis,
          charts: {
            ...baseReport.charts,
            confusionMatrix,
          },
          dataValidation: baseReport.dataValidation.map((item) => {
            if (item.group === "common" && item.checkName === "제외된 샘플 수") {
              return {
                ...item,
                status: result.dropped_rows > 0 ? "warning" : "pass",
                detail: result.dropped_rows > 0 ? `${result.dropped_rows}건 — 결측치 제외됨` : "0건 — 누락값·오류로 인한 제외 없음",
              };
            }
            if (item.group === "common" && item.checkName === "누락값") {
              return {
                ...item,
                status: result.dropped_rows > 0 ? "warning" : "pass",
                detail: result.dropped_rows > 0 ? `결측치 감지 및 제거 (${result.dropped_rows}건)` : "없음 (0건)",
              };
            }
            return item;
          }),
        };

        if (id !== "preview") {
          const evaluatedReport = {
            ...mergedReport,
            isEvaluated: true,
          };
          useWorkspaceStore.setState((state) => ({
            evaluationRuns: state.evaluationRuns.map((r) =>
              r.id === id ? { ...r, reportData: evaluatedReport } : r
            ),
          }));
          setData(evaluatedReport);
        } else {
          setData(mergedReport);
        }
      } catch (err: any) {
        console.error("Evaluation run failed:", err);
        if (active) {
          setError(err.message || String(err));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    runEvaluate();

    return () => {
      active = false;
    };
  }, [id, run, workflowState.rawFile, workflowState.columnMapping, workflowState.selectedMetricIds]);

  return { data, isLoading, error };
}
