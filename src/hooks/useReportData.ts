/**
 * 최종 성적서 데이터 페칭 훅
 *
 * 현재: mockReport.ts에서 정적 데이터를 반환
 * 추후: id 파라미터로 백엔드 API를 호출해 FinalReportData를 가져오도록 교체
 */
import { MOCK_FINAL_REPORT } from "../data/mockReport";
import type { FinalReportData } from "../types/finalReport.types";

interface UseReportDataResult {
  data: FinalReportData | null;
  isLoading: boolean;
}

export function useReportData(_id: string): UseReportDataResult {
  // TODO: replace with API fetch when backend is ready
  // const res = await fetch(`/api/reports/${_id}`);
  // const data: FinalReportData = await res.json();
  return { data: MOCK_FINAL_REPORT, isLoading: false };
}
