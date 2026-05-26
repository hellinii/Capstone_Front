import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ClipboardList, Plus } from "lucide-react";
import { AppHeader } from "../../layout/components/AppHeader";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useWorkspaceStore } from "../../utils/stores/useWorkspaceStore";

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function WorkspaceDetail() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { workspaces, evaluationRuns, setActiveWorkspace } =
    useWorkspaceStore();

  const workspace = workspaces.find((item) => item.id === workspaceId);

  if (!workspaceId || !workspace) {
    return <Navigate to="/workspaces" replace />;
  }

  const runs = evaluationRuns
    .filter((run) => run.workspaceId === workspaceId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const handleStartEvaluation = () => {
    setActiveWorkspace(workspaceId);
    navigate("/app/basic-info");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-8 py-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <Link to="/workspaces">
                <ArrowLeft className="h-4 w-4" />
                Workspaces
              </Link>
            </Button>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          <Button onClick={handleStartEvaluation}>
            <Plus className="h-4 w-4" />
            Start Evaluation
          </Button>
        </section>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Evaluation Results</CardTitle>
            <CardDescription>
              Review the model name, version, and created date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold">
                    No evaluation results yet
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Start an evaluation to show results here.
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">
                        {run.modelName}
                      </TableCell>
                      <TableCell>{run.versionName}</TableCell>
                      <TableCell>{formatCreatedAt(run.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
