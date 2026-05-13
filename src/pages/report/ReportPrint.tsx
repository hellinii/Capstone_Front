import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useReportData } from "../../hooks/useReportData";
import { PrintLayout } from "../../components/report/layout/PrintLayout";
import { ReportCoverSection } from "../../components/report/sections/ReportCoverSection";
import { CompanyInfoSection } from "../../components/report/sections/CompanyInfoSection";
import { EvalScopeSection } from "../../components/report/sections/EvalScopeSection";
import { DatasetSection } from "../../components/report/sections/DatasetSection";
import { EvalEnvSection } from "../../components/report/sections/EvalEnvSection";
import { TcListSection } from "../../components/report/sections/TcListSection";
import { DataValidationSection } from "../../components/report/sections/DataValidationSection";
import { KpiResultSection } from "../../components/report/sections/KpiResultSection";
import { ChartSection } from "../../components/report/sections/ChartSection";
import { LatencySection } from "../../components/report/sections/LatencySection";
import { InterpretSection } from "../../components/report/sections/InterpretSection";
import { ConclusionSection } from "../../components/report/sections/ConclusionSection";
import { RecommendSection } from "../../components/report/sections/RecommendSection";
import { SignatureSection } from "../../components/report/sections/SignatureSection";

export function ReportPrint() {
  const { id = "preview" } = useParams();
  const { data } = useReportData(id);
  const containerRef = useRef<HTMLDivElement>(null);

  // Puppeteer waits for data-pdf-ready attribute before capturing
  useEffect(() => {
    if (!data || !containerRef.current) return;
    const raf = requestAnimationFrame(() => {
      containerRef.current?.setAttribute("data-pdf-ready", "true");
    });
    return () => cancelAnimationFrame(raf);
  }, [data]);

  if (!data) return null;

  return (
    <PrintLayout>
      <div ref={containerRef}>
        <ReportCoverSection meta={data.meta} />
        <CompanyInfoSection
          applicant={data.applicant}
          performer={data.performer}
          evalScope={data.evalScope}
        />
        <EvalScopeSection meta={data.meta} evalScope={data.evalScope} />
        <div style={{ pageBreakBefore: "always" }}>
          <DatasetSection
            datasetInfo={data.datasetInfo}
            datasetSamples={data.datasetSamples}
            datasetDiagnosis={data.datasetDiagnosis}
          />
          <EvalEnvSection meta={data.meta} evalScope={data.evalScope} evalEnv={data.evalEnv} />
        </div>
        <div style={{ pageBreakBefore: "always" }}>
          <TcListSection tcList={data.tcList} metricFormulas={data.metricFormulas} />
        </div>
        <div style={{ pageBreakBefore: "always" }}>
          <DataValidationSection
            dataValidation={data.dataValidation}
            kpiResults={data.kpiResults}
            totalSamples={data.datasetInfo.sampleCount}
          />
          <KpiResultSection kpiResults={data.kpiResults} />
        </div>
        <div style={{ pageBreakBefore: "always" }}>
          <ChartSection charts={data.charts} />
          <LatencySection latency={data.latency} />
        </div>
        <div style={{ pageBreakBefore: "always" }}>
          <InterpretSection interpretation={data.interpretation} />
          <ConclusionSection conclusion={data.conclusion} />
          <RecommendSection recommendations={data.recommendations} />
          <SignatureSection signature={data.signature} />
        </div>
      </div>
    </PrintLayout>
  );
}
