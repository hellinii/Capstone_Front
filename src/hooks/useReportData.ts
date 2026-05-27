/**
 * 최종 성적서 데이터 페칭 훅.
 *
 * - id === "preview": 워크플로우 store에서 입력값을 읽어 매핑 함수로 FinalReportData 생성
 * - 그 외 id: 향후 백엔드 API 호출로 교체 (현재는 MOCK_FINAL_REPORT fallback)
 */
import { MOCK_FINAL_REPORT } from "../data/mockReport";
import { mapWorkflowToFinalReport } from "../lib/report/mapWorkflowToFinalReport";
import type { FinalReportData } from "../types/finalReport.types";
import { useWorkflowStore } from "../utils/stores/useWorkflowStore";
import { useWorkspaceStore } from "../utils/stores/useWorkspaceStore";

interface UseReportDataResult {
  data: FinalReportData | null;
  isLoading: boolean;
}

export function useReportData(id: string): UseReportDataResult {
  const workflowState = useWorkflowStore();
  const run = useWorkspaceStore((state) =>
    state.evaluationRuns.find((item) => item.id === id),
  );

  if (run?.reportData) {
    return { data: run.reportData, isLoading: false };
  }

  if (id === "preview") {
    return {
      data: mapWorkflowToFinalReport({
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
      }),
      isLoading: false,
    };
  }

  // TODO: replace with API fetch when backend is ready
  return { data: MOCK_FINAL_REPORT, isLoading: false };
}
