import type { SignatureData } from "../../../types/finalReport.types";

interface SignatureSectionProps {
  signature: SignatureData;
}

export function SignatureSection({ signature }: SignatureSectionProps) {
  return (
    <section className="space-y-6 border-t border-slate-200 py-10">
      <p className="text-center text-sm font-semibold text-slate-700">[ 발급 완료 ]</p>
      <p className="text-center text-xs text-slate-500">
        본 시험결과서는 AI 자동화 평가 시스템에 의해 생성되었으며, 의뢰자의 최종 확인을 거쳐 정식 발급된 문서입니다.
      </p>

      {/* Signature box */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-slate-200 p-4 space-y-1">
          <p className="text-xs font-medium text-slate-400">발급 기관</p>
          <p className="font-semibold text-slate-900">{signature.issuer}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 space-y-1">
          <p className="text-xs font-medium text-slate-400">서명일</p>
          <p className="font-semibold text-slate-900">{signature.signedAt}</p>
        </div>
      </div>

      {/* Issuance history */}
      {signature.history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">발급 이력</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-1.5 pr-4 text-left font-medium text-slate-400 text-xs">버전</th>
                <th className="py-1.5 pr-4 text-left font-medium text-slate-400 text-xs">발급일</th>
                <th className="py-1.5 text-left font-medium text-slate-400 text-xs">비고</th>
              </tr>
            </thead>
            <tbody>
              {signature.history.map((h) => (
                <tr key={h.version} className="border-b border-slate-50 last:border-b-0">
                  <td className="py-1.5 pr-4 font-mono text-xs text-slate-600">{h.version}</td>
                  <td className="py-1.5 pr-4 text-slate-600">{h.issuedAt}</td>
                  <td className="py-1.5 text-slate-600">{h.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
