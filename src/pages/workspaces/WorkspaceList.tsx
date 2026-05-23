import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, FolderKanban } from "lucide-react";
import { AppHeader } from "../../layout/components/AppHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useWorkspaceStore } from "../../utils/stores/useWorkspaceStore";

export function WorkspaceList() {
  const navigate = useNavigate();
  const { workspaces, createWorkspace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const sortedWorkspaces = useMemo(
    () =>
      [...workspaces].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [workspaces],
  );

  const handleCreateWorkspace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) return;

    const workspace = createWorkspace({ name, description });
    setName("");
    setDescription("");
    navigate(`/workspaces/${workspace.id}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-8 py-8">
        <section className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Workspaces</p>
            <h1 className="text-2xl font-semibold text-foreground">
              Evaluation Workspaces
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Save model evaluation results by workspace and compare them.
            </p>
          </div>
        </section>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Create Workspace</CardTitle>
            <CardDescription>
              Name the workspace by model group, evaluation goal, or dataset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
              onSubmit={handleCreateWorkspace}
            >
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Name</Label>
                <Input
                  id="workspace-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Document classification model comparison"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-description">Description</Label>
                <Input
                  id="workspace-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Evaluation goal or dataset"
                />
              </div>
              <Button type="submit" disabled={!name.trim()}>
                Create
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {sortedWorkspaces.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold">
                  No workspaces yet
                </h2>
                <p className="text-sm text-muted-foreground">
                  Create your first workspace to organize evaluation results.
                </p>
              </div>
            </div>
          ) : (
            sortedWorkspaces.map((workspace) => (
              <Card key={workspace.id} className="rounded-lg">
                <CardHeader>
                  <CardTitle>{workspace.name}</CardTitle>
                  {workspace.description && (
                    <CardDescription>{workspace.description}</CardDescription>
                  )}
                  <CardAction>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/workspaces/${workspace.id}`}>
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardAction>
                </CardHeader>
              </Card>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
