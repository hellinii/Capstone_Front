import { SectionTitle } from "../ui/SectionTitle";

interface InterpretSectionProps {
  interpretation: string;
}

const SUBTITLES = [
  "혼동 행렬 기반 클래스 간 간섭 분석",
  "데이터 분포 유의성 및 클래스 편향성 평가",
];

export function InterpretSection({ interpretation }: InterpretSectionProps) {
  const paragraphs = interpretation.split("\n\n");

  return (
    <section className="space-y-6 border-t border-slate-200 py-10">
      <SectionTitle number={7} title="정밀 분석 및 오분류 특성 진단" />

      {paragraphs.map((para, i) => (
        <div key={i} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">
            {SUBTITLES[i] ?? `정밀 분석 ${i + 1}`}
          </h3>
          <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm font-medium leading-relaxed text-slate-700">"{para}"</p>
          </blockquote>
        </div>
      ))}
    </section>
  );
}
