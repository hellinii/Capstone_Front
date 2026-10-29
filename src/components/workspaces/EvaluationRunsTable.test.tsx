import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { EvaluationRunsTable } from "./EvaluationRunsTable";
import type { WorkspaceEvaluationRun } from "../../types/workspace.types";
import { toJudgeBundle } from "../../lib/report/judgeBundle";
import { CANDIDATE_LIST_HELD_BADGE } from "../../lib/report/judgeNotice";
import * as reportData from "../../hooks/useReportData";

// 배선 시험용 — 기본은 진짜 판정 함수 그대로, 한 시험에서만 돌려 값을 바꾼다.
vi.mock("../../hooks/useReportData", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks/useReportData")>();
  return { ...actual, narrativePhaseOf: vi.fn(actual.narrativePhaseOf) };
});

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

function renderTable(runs: WorkspaceEvaluationRun[]) {
  return render(
    <MemoryRouter>
      <EvaluationRunsTable runs={runs} onDelete={vi.fn()} />
    </MemoryRouter>,
  );
}

describe("평가 목록", () => {
  it("모델이 달라도 한 테이블에 모델명과 함께 나온다", () => {
    renderTable([
      makeRun({ id: "a", modelName: "Face recognizer" }),
      makeRun({ id: "b", modelName: "Defect detector" }),
    ]);

    expect(screen.getByRole("columnheader", { name: "모델 이름" })).toBeInTheDocument();
    expect(screen.getByText("Face recognizer")).toBeInTheDocument();
    expect(screen.getByText("Defect detector")).toBeInTheDocument();
  });

  it("성적서를 낸 평가와 안 낸 평가가 구분된다", () => {
    renderTable([
      makeRun({ id: "a", reportId: "RPT-1", versionName: "v1.0.0" }),
      makeRun({ id: "b", reportId: "", versionName: "v1.1.0" }),
    ]);

    const rows = screen.getAllByRole("row");
    const issued = rows.find((row) => within(row).queryByText("v1.0.0"));
    const draft = rows.find((row) => within(row).queryByText("v1.1.0"));

    expect(within(issued!).getByText("발급됨")).toBeInTheDocument();
    expect(within(draft!).getByText("초안")).toBeInTheDocument();
  });

  it("초안도 성적서로 간다 — 평가 결과 화면은 폐지됐다", () => {
    renderTable([
      makeRun({ id: "a", reportId: "RPT-1", versionName: "v1.0.0" }),
      makeRun({ id: "b", reportId: "", versionName: "v1.1.0" }),
    ]);

    const links = screen.getAllByRole("link", { name: /성적서/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/report/a", "/report/b"]);
  });
});

// ── 판 4 발급 보류 표시(심판 라운드 J9, 계획 14-8) ──────────────────────────────────────────────

const CONTRACT = JSON.parse(readFileSync(resolve(__dirname, "../../test/contract/judge_bundle_ed4.json"), "utf8"));
const PASSED = toJudgeBundle(CONTRACT.examples.passed)!;
const HELD = toJudgeBundle(CONTRACT.examples.held)!;

type Judge = WorkspaceEvaluationRun["reportData"]["judge"];
type Status = NonNullable<WorkspaceEvaluationRun["narrative"]>["status"] | null;

/** 성적서 데이터 최소 모양 — 판정에 쓰이는 칸(판·완성본·심판 묶음)만. status null 이면 서술 칸 없음. */
function edRun(id: string, contentSchema: unknown, status: Status, judge: Judge | undefined, isEvaluated = true) {
  const reportData = { contentSchema, isEvaluated, ...(judge === undefined ? {} : { judge }) };
  return makeRun({
    id,
    versionName: id,
    reportData: reportData as unknown as WorkspaceEvaluationRun["reportData"],
    ...(status === null ? {} : { narrative: { status } as WorkspaceEvaluationRun["narrative"] }),
  });
}

function rowOf(version: string): HTMLElement {
  const row = screen.getAllByRole("row").find((r) => within(r).queryByText(version));
  expect(row).toBeTruthy();
  return row!;
}

const HELD_CASES: Array<[string, WorkspaceEvaluationRun]> = [
  ["판 4 · 보류로 저장(held) · 보류 묶음", edRun("ed4-held", 4, "held", HELD)],
  ["판 4 · 완료로 저장된 옛 run · 보류 묶음", edRun("ed4-done-held", 4, "done", HELD)],
  // 묶음 없음 — 성적서 화면이 B46 띠로 보류를 보이는 run 이다(narrativePhaseOf). 목록도 같게(닫힌 쪽).
  ["판 4 · 완료 · 심판 묶음 없음", edRun("ed4-nojudge", 4, "done", undefined)],
];
const PLAIN_CASES: Array<[string, WorkspaceEvaluationRun]> = [
  ["판 4 · 통과", edRun("ed4-passed", 4, "done", PASSED)],
  ["판 3 · 완료(묶음 없음)", edRun("ed3-done", 3, "done", undefined)],
  ["서술 없음(평가 전)", edRun("no-narrative", 4, null, undefined, false)],
  ["판 4 · 서술 진행 중", edRun("ed4-pending", 4, "pending", undefined, false)],
  ["판 4 · 서술 실패", edRun("ed4-failed", 4, "failed", undefined, false)],
];

describe("평가 목록 — 판 4 발급 보류 표시", () => {
  afterEach(() => {
    vi.mocked(reportData.narrativePhaseOf).mockClear();
  });

  it("보류 run 에만 표시가 붙는다(보류·완료로 저장된 보류·묶음 없음)", () => {
    expect(HELD?.gate).toBe("held");
    expect(PASSED?.gate).toBe("passed");
    expect(HELD_CASES.length).toBeGreaterThan(0);
    expect(PLAIN_CASES.length).toBeGreaterThan(0);
    renderTable([...HELD_CASES, ...PLAIN_CASES].map(([, run]) => run));

    expect(screen.getAllByTestId("run-held-badge")).toHaveLength(HELD_CASES.length);
    for (const [, run] of HELD_CASES) {
      expect(within(rowOf(run.versionName)).getByText(CANDIDATE_LIST_HELD_BADGE)).toBeInTheDocument();
    }
    for (const [, run] of PLAIN_CASES) {
      expect(within(rowOf(run.versionName)).queryByText(CANDIDATE_LIST_HELD_BADGE)).toBeNull();
    }
  });

  it.each(HELD_CASES)("%s → 표시", (_name, run) => {
    renderTable([run]);
    expect(screen.getByTestId("run-held-badge")).toHaveTextContent(CANDIDATE_LIST_HELD_BADGE);
  });

  it.each(PLAIN_CASES)("%s → 표시 없음", (_name, run) => {
    renderTable([run]);
    expect(screen.getByText(run.versionName)).toBeInTheDocument();
    expect(screen.queryByTestId("run-held-badge")).toBeNull();
  });

  it("보류 표시는 초안 표시와 함께 나온다(발급 상태를 가리지 않음)", () => {
    renderTable([edRun("ed4-held", 4, "held", HELD)]);
    const row = rowOf("ed4-held");
    expect(within(row).getByText("초안")).toBeInTheDocument();
    expect(within(row).getByText(CANDIDATE_LIST_HELD_BADGE)).toBeInTheDocument();
  });

  it("배선 — 판단은 성적서 화면과 같은 narrativePhaseOf 가 한다(그 값만 바꿔도 표시가 따라간다)", async () => {
    const actual = await vi.importActual<typeof import("../../hooks/useReportData")>("../../hooks/useReportData");
    const runs = [edRun("ed4-passed", 4, "done", PASSED), edRun("ed4-held", 4, "held", HELD)];
    const phase = vi.mocked(reportData.narrativePhaseOf);
    // 판정 함수가 거꾸로 답하게 돌린다 — 통과 run 을 보류로, 보류 run 을 완료로.
    phase.mockImplementation((run) => (run?.id === "ed4-passed" ? "held" : "done"));
    try {
      renderTable(runs);
      expect(phase).toHaveBeenCalled();
      expect(within(rowOf("ed4-passed")).getByText(CANDIDATE_LIST_HELD_BADGE)).toBeInTheDocument();
      expect(within(rowOf("ed4-held")).queryByText(CANDIDATE_LIST_HELD_BADGE)).toBeNull();
    } finally {
      phase.mockImplementation(actual.narrativePhaseOf);
    }
  });

  it("표시 글 — 이모지·금지어 없음, 보류 띠 머리 B37 의 앞 낱말 그대로", async () => {
    const { B37_HELD_HEAD } = await import("../../lib/report/edition4/edition4Text");
    expect(B37_HELD_HEAD.startsWith(`${CANDIDATE_LIST_HELD_BADGE} — `)).toBe(true);
    expect(CANDIDATE_LIST_HELD_BADGE).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(CANDIDATE_LIST_HELD_BADGE).not.toMatch(/AI|LLM|심판|gpt|claude|sonnet/i);
  });
});
