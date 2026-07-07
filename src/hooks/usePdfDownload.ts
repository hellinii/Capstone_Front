/**
 * PDF 다운로드 훅
 *
 * 현재: 백엔드 API 미연결 — fallback으로 /print 경로를 새 탭으로 열어 window.print() 실행
 * 추후: POST /api/reports/:id/pdf 호출 → blob 다운로드로 교체
 */
import { apiUrl } from "@/lib/apiBase";

export function usePdfDownload(id: string) {
  const download = async () => {
    try {
      // TODO: replace with actual API call when backend is ready
      const res = await fetch(apiUrl(`/api/reports/${id}/pdf`));
      if (!res.ok) throw new Error("API not ready");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: PrintLayout(@media print 적용)이 있는 /print 경로에서 브라우저 인쇄
      window.open(`/report/${id}/print`, "_blank");
    }
  };

  return { download };
}
