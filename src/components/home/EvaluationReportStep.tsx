import { ActionBar } from "../../layout/ActionBar";
import { EvaluationReport } from "../report/EvaluationReport";
import type { EvaluationReportData } from "@/types/report.types";

interface EvaluationReportStepProps {
  report: EvaluationReportData;
  onPrevious: () => void;
}

export function EvaluationReportStep({
  report,
  onPrevious,
}: EvaluationReportStepProps) {
  return (
    <>
      <main className="mx-auto max-w-[1344px] px-8 pb-24 pt-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Final report</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The evaluation report now lives inside the main workflow and is fed by the state collected in the previous steps.
          </p>
        </div>

        <EvaluationReport report={report} />
      </main>

      <ActionBar showPrevious={true} onPrevious={onPrevious} showNext={false} />
    </>
  );
}
