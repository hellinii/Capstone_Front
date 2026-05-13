import { SectionTitle } from "../ui/SectionTitle";

interface InterpretSectionProps {
  interpretation: string;
}

export function InterpretSection({ interpretation }: InterpretSectionProps) {
  return (
    <section className="space-y-6 border-t border-slate-200 py-10">
      <SectionTitle number={7} title="정밀 분석 및 오분류 특성 진단" />

      <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-4">
        {interpretation.split("\n\n").map((para, i) => (
          <p key={i} className="mb-3 text-sm font-medium leading-relaxed text-slate-700 last:mb-0">
            "{para}"
          </p>
        ))}
      </blockquote>
    </section>
  );
}
