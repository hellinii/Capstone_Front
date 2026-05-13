import { useParams } from "react-router";
import { useReportData } from "../../hooks/useReportData";
import { usePdfDownload } from "../../hooks/usePdfDownload";
import { ReportLayout } from "../../components/report/layout/ReportLayout";
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

export function Report() {
  const { id = "preview" } = useParams();
  const { data } = useReportData(id);
  const { download } = usePdfDownload(id);

  if (!data) return null;

  return (
    <ReportLayout onDownload={download}>
      <ReportCoverSection meta={data.meta} />
      <CompanyInfoSection
        applicant={data.applicant}
        performer={data.performer}
        evalScope={data.evalScope}
      />
      <EvalScopeSection meta={data.meta} evalScope={data.evalScope} />
      <DatasetSection
        datasetInfo={data.datasetInfo}
        datasetSamples={data.datasetSamples}
        datasetDiagnosis={data.datasetDiagnosis}
      />
      <EvalEnvSection meta={data.meta} evalScope={data.evalScope} evalEnv={data.evalEnv} />
      <TcListSection tcList={data.tcList} metricFormulas={data.metricFormulas} />
      <DataValidationSection
        dataValidation={data.dataValidation}
        kpiResults={data.kpiResults}
        totalSamples={data.datasetInfo.sampleCount}
      />
      <KpiResultSection kpiResults={data.kpiResults} />
      <ChartSection charts={data.charts} />
      <LatencySection latency={data.latency} />
      <InterpretSection interpretation={data.interpretation} />
      <ConclusionSection conclusion={data.conclusion} />
      <RecommendSection recommendations={data.recommendations} />
      <SignatureSection signature={data.signature} />
    </ReportLayout>
  );
}
