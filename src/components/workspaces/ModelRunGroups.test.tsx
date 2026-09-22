import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ModelRunGroups } from "./ModelRunGroups";
import type { WorkspaceEvaluationRun } from "../../types/workspace.types";

const read = (p: string) => readFileSync(resolve(__dirname, "../..", p), "utf-8");

function makeRun(over: Partial<WorkspaceEvaluationRun> & { id: string }): WorkspaceEvaluationRun {
  return {
    workspaceId: "ws-1",
    modelName: "Face recognizer",
    versionName: "v1.0.0",
    reportId: "",
    createdAt: "2026-09-01T00:00:00.000Z",
    workflowSnapshot: {} as WorkspaceEvaluationRun["workflowSnapshot"],
    reportData: {} as WorkspaceEvaluationRun["reportData"],
    ...over,
  };
}

function renderGroups(
  runs: WorkspaceEvaluationRun[],
  onNewVersion: (run: WorkspaceEvaluationRun) => void = vi.fn(),
) {
  return render(
    <MemoryRouter>
      <ModelRunGroups
        workspaceId="ws-1"
        runs={runs}
        onNewVersion={onNewVersion}
        onDelete={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe("모델별 묶기", () => {
  it("모델마다 카드를 하나씩 만든다", () => {
    renderGroups([
      makeRun({ id: "a", modelName: "Face recognizer" }),
      makeRun({ id: "b", modelName: "Defect detector" }),
    ]);

    expect(screen.getByText("Face recognizer")).toBeInTheDocument();
    expect(screen.getByText("Defect detector")).toBeInTheDocument();
  });

  it("평가가 둘 이상일 때만 Compare 를 띄운다(비교할 대상이 없는 버튼 금지)", () => {
    renderGroups([makeRun({ id: "a" })]);
    expect(screen.queryByRole("link", { name: /Compare/i })).not.toBeInTheDocument();
  });

  it("Compare 는 모델별 비교 경로로 간다(이름을 URL 인코딩해서)", () => {
    renderGroups([
      makeRun({ id: "a", modelName: "얼굴 인식", createdAt: "2026-09-01T00:00:00.000Z" }),
      makeRun({ id: "b", modelName: "얼굴 인식", createdAt: "2026-09-10T00:00:00.000Z", versionName: "v1.1.0" }),
    ]);

    fireEvent.click(screen.getByRole("checkbox", { name: /Select v1.0.0/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Select v1.1.0/i }));

    // id 는 고른 순서대로 실린다. 표시 순서는 비교 화면이 최신순으로 다시 세우므로
    // (selectComparisonRuns) URL 의 순서는 표에 영향을 주지 않는다.
    expect(screen.getByRole("link", { name: /Compare/i })).toHaveAttribute(
      "href",
      `/workspaces/ws-1/models/${encodeURIComponent("얼굴 인식")}?runs=a,b`,
    );
  });

  it("카드 안의 표는 모델명 열을 반복하지 않는다", () => {
    renderGroups([makeRun({ id: "a" })]);
    expect(screen.queryByText("Model Name")).not.toBeInTheDocument();
  });
});

describe("'Edit' → 'New version'", () => {
  /**
   * 종전 'Edit' 은 과거 평가를 고치는 동작처럼 보였지만 실제로는 입력을 물려받아
   * run 을 하나 더 만든다. 이름이 동작과 어긋나 있었다.
   */
  it("버튼 이름이 New version 이다", () => {
    renderGroups([makeRun({ id: "a" })]);

    expect(screen.getByRole("button", { name: /New version/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Edit$/i })).not.toBeInTheDocument();
  });

  it("버전이 여러 개여도 모델당 하나다(행마다 놓지 않는다)", () => {
    renderGroups([
      makeRun({ id: "old", versionName: "v1.0.0", createdAt: "2026-09-01T00:00:00.000Z" }),
      makeRun({ id: "new", versionName: "v1.0.1", createdAt: "2026-09-10T00:00:00.000Z" }),
    ]);

    expect(screen.getAllByRole("button", { name: /New version/i })).toHaveLength(1);
  });

  it("가장 최근 버전의 입력을 물려받는다(다음 버전은 직전에서 잇는다)", () => {
    const onNewVersion = vi.fn();
    renderGroups(
      [
        makeRun({ id: "old", versionName: "v1.0.0", createdAt: "2026-09-01T00:00:00.000Z" }),
        makeRun({ id: "new", versionName: "v1.0.1", createdAt: "2026-09-10T00:00:00.000Z" }),
      ],
      onNewVersion,
    );

    screen.getByRole("button", { name: /New version/i }).click();

    expect(onNewVersion).toHaveBeenCalledWith(expect.objectContaining({ id: "new" }));
  });

  it("평가가 하나뿐인 모델에도 나온다(Compare 와 달리 대상이 늘 있다)", () => {
    renderGroups([makeRun({ id: "a" })]);

    expect(screen.getByRole("button", { name: /New version/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Compare/i })).not.toBeInTheDocument();
  });

  it("버전을 한 칸 올려 제안한다(같은 번호로 두 열이 겹치지 않게)", () => {
    const source = read("pages/workspaces/WorkspaceDetail.tsx");
    expect(source).toContain("nextVersionName(run.versionName)");
  });

  it("기존 run 을 덮어쓰지 않는다 — 삭제 외에 스토어를 고치는 호출이 없다", () => {
    const source = read("pages/workspaces/WorkspaceDetail.tsx");
    expect(source).not.toContain("updateEvaluationRun");
  });
});

describe("배선 — 만들어 두고 붙이지 않는 실수 차단", () => {
  it("비교 화면이 라우트에 등록돼 있다", () => {
    expect(read("routes.ts")).toContain("/workspaces/:workspaceId/models/:modelName");
  });

  /**
   * 평가 결과 화면에는 비교 입구를 두지 않는다.
   *
   * 그 버튼이 열던 화면은 워크스페이스의 비교 화면과 **같은 것**이었다 — 자기 역할이 없는
   * 지름길이었다. 게다가 비교는 어느 버전을 세울지 고르는 일에서 시작하는데, 그 선택은
   * 모델 카드에서만 할 수 있다. 고를 수 없는 자리의 입구는 사용자를 아무것도 고르지 않은
   * 비교 화면으로 떨어뜨릴 뿐이다.
   */
  it("평가 결과 화면에는 비교 입구가 없다", () => {
    const source = read("pages/report/EvaluationSummary.tsx");
    expect(source).not.toContain("compareTo");
    expect(source).not.toContain("/models/");
  });

  it("워크스페이스 상세가 모델 카드로 그린다", () => {
    expect(read("pages/workspaces/WorkspaceDetail.tsx")).toContain("<ModelRunGroups");
  });
});

describe("비교 대상 고르기 (최대 3개)", () => {
  /** 최신순으로 v1.0.0 … v1.(n-1).0 짜리 평가 n 건. */
  function manyRuns(count: number) {
    return Array.from({ length: count }, (_, i) =>
      makeRun({
        id: `run-${i}`,
        versionName: `v1.${i}.0`,
        createdAt: `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );
  }

  const box = (version: string) =>
    screen.getByRole("checkbox", { name: new RegExp(`Select ${version}`, "i") });

  /** Radix 체크박스의 상태 변경은 act 안에서 일어나야 반영된다. */
  const tick = (version: string) => fireEvent.click(box(version));

  it("평가가 하나뿐이면 체크박스가 아예 없다(비교할 대상이 없다)", () => {
    renderGroups([makeRun({ id: "a" })]);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("평가가 둘 이상이면 행마다 체크박스가 생긴다", () => {
    renderGroups(manyRuns(4));

    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
  });

  it("고른 것이 비교 링크에 실린다", () => {
    renderGroups(manyRuns(4));

    tick("v1.3.0");
    tick("v1.1.0");

    expect(screen.getByRole("link", { name: /Compare/i })).toHaveAttribute(
      "href",
      "/workspaces/ws-1/models/Face%20recognizer?runs=run-3,run-1",
    );
  });

  it("셋을 채우면 나머지는 더 고를 수 없다", () => {
    renderGroups(manyRuns(5));

    tick("v1.4.0");
    tick("v1.3.0");
    tick("v1.2.0");

    expect(box("v1.1.0")).toBeDisabled();
    expect(box("v1.0.0")).toBeDisabled();
  });

  it("셋을 채워도 고른 것은 풀 수 있다(바꿀 수 없는 상태에 가두지 않는다)", () => {
    renderGroups(manyRuns(5));

    tick("v1.4.0");
    tick("v1.3.0");
    tick("v1.2.0");

    expect(box("v1.2.0")).not.toBeDisabled();

    tick("v1.2.0");
    expect(box("v1.1.0")).not.toBeDisabled();
  });

  it("넷째를 눌러도 선택이 셋을 넘지 않는다", () => {
    renderGroups(manyRuns(5));

    tick("v1.4.0");
    tick("v1.3.0");
    tick("v1.2.0");
    tick("v1.1.0");

    expect(screen.getByRole("link", { name: /Compare/i })).toHaveAttribute(
      "href",
      "/workspaces/ws-1/models/Face%20recognizer?runs=run-4,run-3,run-2",
    );
  });

  it("고르지 않으면 Compare 가 링크가 아니다(빈 비교 화면으로 떨어뜨리지 않는다)", () => {
    renderGroups(manyRuns(3));

    expect(screen.queryByRole("link", { name: /Compare/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Compare/i })).toBeInTheDocument();
  });

  it("하나만 고른 것도 비교가 아니다(열이 하나인 표)", () => {
    renderGroups(manyRuns(3));

    tick("v1.2.0");

    expect(screen.queryByRole("link", { name: /Compare/i })).not.toBeInTheDocument();
  });

  it("고르지 않고 누르면 최소 두 개를 고르라고 말한다", () => {
    renderGroups(manyRuns(3));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Compare/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select at least two versions to compare.",
    );
  });

  it("안내가 뜬 뒤 둘을 고르면 안내가 사라지고 링크가 된다", () => {
    renderGroups(manyRuns(3));

    fireEvent.click(screen.getByRole("button", { name: /Compare/i }));
    tick("v1.2.0");
    tick("v1.1.0");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Compare/i })).toHaveAttribute(
      "href",
      "/workspaces/ws-1/models/Face%20recognizer?runs=run-2,run-1",
    );
  });
});

describe("발급 여부 표기는 그대로 유지된다", () => {
  it("성적서를 낸 평가와 안 낸 평가가 구분된다", () => {
    renderGroups([
      makeRun({ id: "a", reportId: "RPT-1", versionName: "v1.0.0" }),
      makeRun({ id: "b", reportId: "", versionName: "v1.1.0", createdAt: "2026-09-10T00:00:00.000Z" }),
    ]);

    const rows = screen.getAllByRole("row");
    const issued = rows.find((row) => within(row).queryByText("v1.0.0"));
    const draft = rows.find((row) => within(row).queryByText("v1.1.0"));

    expect(within(issued!).getByText("Report issued")).toBeInTheDocument();
    expect(within(draft!).getByText("Evaluation only")).toBeInTheDocument();
  });
});
