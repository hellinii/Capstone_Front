/**
 * 최종 성적서 데이터 페칭 훅.
 *
 * - id === "preview": 워크플로우 store에서 입력값을 읽어 백엔드 /api/evaluate를 호출하여 데이터 계산 및 병합
 * - 그 외 id: 향후 백엔드 API 호출로 교체 (현재는 MOCK_FINAL_REPORT fallback)
 */
import { useEffect, useState } from "react";
import { MOCK_FINAL_REPORT } from "../data/mockReport";
import { mapWorkflowToFinalReport } from "../lib/report/mapWorkflowToFinalReport";
import type { FinalReportData, LatencyStats } from "../types/finalReport.types";
import { useWorkflowStore } from "../utils/stores/useWorkflowStore";
import { useWorkspaceStore } from "../utils/stores/useWorkspaceStore";
import { getMetricDisplayId, METRICS } from "../data/evaluationData";
import { buildConclusion } from "../lib/report/computeVerdict";
import { buildDatasetDiagnosis } from "../lib/report/buildDatasetDiagnosis";
import { buildFactSheet } from "../lib/report/buildFactSheet";
import { fetchNarrative } from "../lib/report/fetchNarrative";
import { translateRoleToBackend } from "../lib/mapping/translateRoleToBackend";

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
      }, workflowState.validationResult);
      setData({
        ...baseReport,
        datasetDiagnosis: buildDatasetDiagnosis(workflowState.metadata),
      });
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    const runEvaluate = async () => {
      try {
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
        }, workflowState.validationResult);

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

        // 2-1. ROC / PR 곡선 좌표 + 스칼라 AUC (binary, 백엔드 success_metrics)
        const rocCurve = success_metrics.roc_curve
          ? {
              fpr: success_metrics.roc_curve.fpr,
              tpr: success_metrics.roc_curve.tpr,
              auroc: typeof success_metrics.TC9 === "number" ? success_metrics.TC9 : undefined,
            }
          : null;
        const prCurve = success_metrics.pr_curve
          ? {
              recall: success_metrics.pr_curve.recall,
              precision: success_metrics.pr_curve.precision,
              auprc: typeof success_metrics.TC10 === "number" ? success_metrics.TC10 : undefined,
            }
          : null;

        // 2-2. 지연시간 통계 — latency 컬럼이 매핑된 경우만 백엔드가 latency_stats 반환
        const ls = success_metrics.latency_stats;
        const latencyStats: LatencyStats | null = ls
          ? {
              mean: ls.mean,
              min: ls.min,
              p50: ls.p50,
              p95: ls.p95,
              p99: ls.p99,
              max: ls.max,
              unit: ls.unit === "s" ? "s" : "ms",
            }
          : null;

        // 3. 데이터셋 진단 문구 — 실제 클래스 분포 + 불균형비(TC23) + 제외 행수로 구성
        const imbalanceRatio =
          typeof success_metrics.TC23 === "number" ? success_metrics.TC23 : undefined;
        const datasetDiagnosis = buildDatasetDiagnosis(
          workflowState.metadata,
          imbalanceRatio,
          result.dropped_rows,
        );

        // 4. verdict/score 규칙 산출 (서술의 권위 값 — 백엔드도 fact_sheet.verdict 로 강제)
        const taskTypeResolved = workflowState.taskType || "binary";
        const ruleConclusion = buildConclusion(updatedKpiResults, taskTypeResolved);

        // 5. LLM 서술 생성 — 평가 결과로 fact_sheet 조립 후 /api/generate-narrative 호출.
        //    실패/무키 시 빈 서술 반환(섹션이 "생성 예정" 안내). KPI·차트는 영향받지 않음.
        const yTrueRow = workflowState.columnMapping.find(
          (r) => r.confirmedRole === "y_true",
        );
        const classLabels: string[] =
          workflowState.metadata?.detected_classes?.length
            ? workflowState.metadata.detected_classes
            : workflowState.metadata?.detected_labels?.length
              ? workflowState.metadata.detected_labels
              : yTrueRow
                ? [...new Set(yTrueRow.sampleValues)]
                : [];

        const factSheet = buildFactSheet({
          kpiResults: updatedKpiResults,
          confusionMatrix,
          classDistribution: workflowState.metadata?.class_distribution || {},
          imbalanceRatio,
          droppedRows: result.dropped_rows,
          verdict: ruleConclusion.verdict,
          score: ruleConclusion.score,
          classReport: success_metrics.TC22 ?? null,
          classLabels,
          latencyStats,
        });

        const narrative = await fetchNarrative({
          task_type: taskTypeResolved,
          report_purpose: baseReport.evalScope.reportPurposeKey,
          fact_sheet: factSheet,
        });
        if (!active) return;

        const mergedReport: FinalReportData = {
          ...baseReport,
          kpiResults: updatedKpiResults,
          // verdict/score 는 규칙 산출값, 서술(benchmark/narrative/risks)은 LLM 결과로 병합
          conclusion: { ...ruleConclusion, ...narrative.conclusionText },
          interpretation: narrative.interpretation,
          recommendationNarrative: narrative.recommendationNarrative,
          recommendations: narrative.recommendations,
          // 추적성: 규칙 폴백으로 생성된 경우 7·8·9절에 배지 표시
          narrativeSource: narrative.source,
          datasetDiagnosis,
          charts: {
            confusionMatrix,
            rocCurve,
            prCurve,
          },
          // latency 컬럼이 매핑된 경우만 실측 통계, 아니면 null(섹션이 "미측정" 안내)
          latency: latencyStats,
          // dataValidation 은 baseReport(= /api/validate-data 실측)에서 그대로 사용한다.
          // (이전에는 dropped_rows 기반으로 '제외된 샘플 수'/'누락값' 항목을 덮어썼으나,
          //  검증 엔드포인트가 권위 있는 값을 제공하므로 중복 처리를 제거)
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
