/**
 * 성적서 평가 연산 중 표시하는 전체 화면 로딩 상태.
 * Report 페이지에서 useReportData 가 계산 중일 때 렌더한다.
 */
export function ReportLoadingState() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-slate-200 border-t-teal-500 animate-ping opacity-75"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-800">Running the evaluation…</h2>
          <p className="text-sm text-slate-500">
            Computing the ISO/IEC TS 4213 metrics you selected. This can take a moment.
          </p>
        </div>
      </div>
    </div>
  );
}
