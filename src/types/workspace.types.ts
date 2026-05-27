import type { FinalReportData } from "./finalReport.types";
import type { MapWorkflowToReportInput } from "../lib/report/mapWorkflowToFinalReport";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface WorkspaceEvaluationRun {
  id: string;
  workspaceId: string;
  modelName: string;
  versionName: string;
  reportId: string;
  workflowSnapshot: MapWorkflowToReportInput;
  reportData: FinalReportData;
  createdAt: string;
}
