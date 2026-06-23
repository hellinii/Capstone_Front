import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Workspace,
  WorkspaceEvaluationRun,
} from "../../types/workspace.types";

interface WorkspaceState {
  workspaces: Workspace[];
  evaluationRuns: WorkspaceEvaluationRun[];
  activeWorkspaceId: string | null;
  createWorkspace: (input: { name: string; description?: string }) => Workspace;
  setActiveWorkspace: (workspaceId: string | null) => void;
  addEvaluationRun: (
    input: Omit<WorkspaceEvaluationRun, "id" | "createdAt">,
  ) => WorkspaceEvaluationRun;
  deleteWorkspace: (id: string) => void;
  deleteEvaluationRun: (id: string) => void;
}

function createId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomId}`;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      evaluationRuns: [],
      activeWorkspaceId: null,

      createWorkspace: ({ name, description = "" }) => {
        const workspace: Workspace = {
          id: createId("workspace"),
          name: name.trim(),
          description: description.trim(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          workspaces: [workspace, ...state.workspaces],
          activeWorkspaceId: workspace.id,
        }));

        return workspace;
      },

      setActiveWorkspace: (workspaceId) =>
        set({ activeWorkspaceId: workspaceId }),

      addEvaluationRun: (input) => {
        const run: WorkspaceEvaluationRun = {
          ...input,
          id: createId("run"),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          evaluationRuns: [run, ...state.evaluationRuns],
        }));

        return run;
      },

      deleteWorkspace: (id) =>
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== id),
          evaluationRuns: state.evaluationRuns.filter((r) => r.workspaceId !== id),
          activeWorkspaceId: state.activeWorkspaceId === id ? null : state.activeWorkspaceId,
        })),

      deleteEvaluationRun: (id) =>
        set((state) => ({
          evaluationRuns: state.evaluationRuns.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "ml-evaluation-workspaces",
      version: 1,
    },
  ),
);
