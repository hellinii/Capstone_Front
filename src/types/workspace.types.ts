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
  createdAt: string;
}
