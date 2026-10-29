/**
 * 판 4 심판 결과의 화면 흐름(심판 라운드 J6, 계획 14-5·Q6·Q7) — 실제 `<Report />`·`<ReportPrint />` 를 그리고 fetch 만 가짜로 둔다.
 *
 * - 단계 judging 은 "검증 중"(B35), 그동안 인쇄·발급은 잠긴다.
 * - 통과(passed) → 완료(done), 인쇄·발급이 열리고 발급 요청에 작업 번호(narrative_job_id)를 싣는다.
 * - 보류(held) → 서술은 보이고 보류 띠(B37 + 종류별 둘째 줄), 인쇄·발급·정정 잠금(B45), 인쇄 화면도 잠금.
 * - 다시 만들기는 백엔드 retry_allowed 하나만 따른다. 누르면 저장된 요청으로 새 작업 하나(평가는 다시 안 함), 옛 심판 묶음은 지운다.
 * - 판 4 인데 심판 묶음이 없거나 모양이 틀리면 "심판 기록 없음"(B46)으로 잠그고 다시 만들기를 준다(닫힌 쪽 기본값).
 * - 서버가 판 4 발급을 거절(409, 심판 사유 코드)하면 B48 안내.
 *
 * 판 4 run 은 판 4 렌더 픽스처(서술 대기 중 저장값 `bc_strong.pending.json` + 그때의 run 서술 상태)로 심는다 — 앱이 판 4 평가에서
 * 저장한 그대로다.
 */
import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fastPolling, resetAll, storedRun } from "./reportJob.harness";
import { Report } from "../pages/report/Report";
import { ReportPrint } from "../pages/report/ReportPrint";
import { useWorkspaceStore } from "../utils/stores/useWorkspaceStore";
import type { WorkspaceEvaluationRun } from "../types/workspace.types";
import { judgeServerDetail } from "../test/judgeServerRejections";
import {
  B37_HELD_HEAD,
  B38_HELD_GATE_FAILED,
  B40_HELD_JUDGE_ERROR,
  B40_HELD_JUDGE_ERROR_RETRY,
  B42_HELD_BUDGET,
  B43_HELD_JOB_LIMIT,
  B45_LOCK_HELD,
  B46_LOCK_NO_RECORD,
} from "../lib/report/edition4/edition4Text";

const FIX = resolve(__dirname, "../test/edition4/render/fixtures");
const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const CONTRACT = readJson(resolve(__dirname, "../test/contract/judge_bundle_ed4.json"));
const JOBS_INPUT = readJson(resolve(__dirname, "../test/edition4/render/inputs/bc_strong.jobs.ed4.json"));

const RUN = "run-j6";
const JOB_ID = "job-j6";

function seedEd4Pending() {
  const pending = readJson(resolve(FIX, "bc_strong.pending.json"));
  const narrative = readJson(resolve(FIX, "bc_strong.pending.narrative.json"));
  const run = {
    id: RUN,
    workspaceId: "ws-1",
    modelName: "m",
    versionName: "v",
    reportId: pending.meta.reportId,
    workflowSnapshot: undefined,
    reportData: pending,
    createdAt: "2026-10-29T00:00:00.000Z",
    narrative: { ...narrative, jobId: JOB_ID, startedAt: new Date().toISOString() },
  } as unknown as WorkspaceEvaluationRun;
  useWorkspaceStore.setState({ workspaces: [], evaluationRuns: [run], activeWorkspaceId: "ws-1" });
}

/** 판 4 완료 응답 — 판 4 렌더 입력의 서술 결과에 심판 묶음을 바꿔 끼운다(undefined 면 키 없음). */
function doneWith(judge: unknown, jobId = JOB_ID) {
  const result = { ...structuredClone(JOBS_INPUT.done.result) };
  if (judge === undefined) delete result.judge;
  else result.judge = judge;
  return { ...structuredClone(JOBS_INPUT.done), job_id: jobId, result };
}
const running = (stage: string) => ({ ...structuredClone(JOBS_INPUT.running), job_id: JOB_ID, stage });
const PASSED = CONTRACT.examples.passed;
const held = (kind: string, retry: boolean) => ({ ...CONTRACT.examples.held, held_kind: kind, retry_allowed: retry });

type Reply = { status?: number; body: unknown };
interface Stub {
  calls: Array<{ method: string; url: string; body?: any }>;
  views: Reply[];
  create: Reply[];
  issue: Reply[];
  count: (method: string, re: RegExp) => number;
}
const JOBS = /\/api\/narrative\/jobs$/;
const JOB = /\/api\/narrative\/jobs\/[^/]+$/;
const ISSUE = /\/api\/reports\/issue$/;

function stub(init: Partial<Pick<Stub, "views" | "create" | "issue">>): Stub {
  const s: Stub = {
    calls: [],
    views: init.views ?? [],
    create: init.create ?? [],
    issue: init.issue ?? [],
    count: (m, re) => s.calls.filter((c) => c.method === m && re.test(c.url)).length,
  };
  const take = (q: Reply[]) => {
    const next = q.length > 1 ? q.shift()! : q[0];
    if (!next) throw new Error("준비되지 않은 응답");
    const status = next.status ?? 200;
    return { ok: status >= 200 && status < 300, status, json: async () => structuredClone(next.body) } as unknown as Response;
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      const method = (options?.method ?? "GET").toUpperCase();
      const body = typeof options?.body === "string" ? JSON.parse(options.body) : undefined;
      s.calls.push({ method, url, body });
      if (method === "GET" && JOB.test(url)) return take(s.views);
      if (method === "POST" && JOBS.test(url)) return take(s.create);
      if (method === "POST" && ISSUE.test(url)) return take(s.issue);
      if (method === "GET" && /\/api\/organization$/.test(url)) return { ok: false, status: 404, json: async () => ({}) } as Response;
      throw new Error(`모르는 요청 ${method} ${url}`);
    }),
  );
  return s;
}

function renderPage(strict = false) {
  const tree = (
    <MemoryRouter initialEntries={[`/report/${RUN}`]}>
      <Routes>
        <Route path="/report/:id" element={<Report />} />
      </Routes>
    </MemoryRouter>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

function renderPrint() {
  return render(
    <MemoryRouter initialEntries={[`/report/${RUN}/print`]}>
      <Routes>
        <Route path="/report/:id/print" element={<ReportPrint />} />
      </Routes>
    </MemoryRouter>,
  );
}

const pdfButton = () => screen.getByRole("button", { name: /PDF 다운로드/ });
const issueButton = () => screen.getByRole("button", { name: /^발급$/ });
const banner = () => screen.getByTestId("judge-held-banner");
const retryButton = () => screen.queryByRole("button", { name: "서술 다시 만들기" });

let restorePolling: () => void;
beforeEach(() => {
  resetAll();
  restorePolling = fastPolling();
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
});
afterEach(() => {
  restorePolling();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetAll();
});

describe("검증 중(judging) — 단계 이름 B35, 인쇄·발급 잠금", () => {
  it("조회 단계가 judging 이면 띠에 '검증 중', PDF·발급 잠김, 저장 상태는 pending 그대로", async () => {
    stub({ views: [{ body: running("judging") }] });
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("검증 중"));
    expect(screen.getByRole("status")).not.toHaveTextContent("대기 중");
    expect(pdfButton()).toBeDisabled();
    expect(issueButton()).toBeDisabled();
    expect(storedRun(RUN)!.narrative!.status).toBe("pending");
  });
});

describe("통과 — done, 인쇄·발급 열림, 발급 요청에 작업 번호", () => {
  it("passed 묶음이면 done(요청 지움)·묶음 저장, 발급 본문에 narrative_job_id", async () => {
    const s = stub({
      views: [{ body: doneWith(PASSED) }],
      issue: [{ status: 500, body: { detail: "끝" } }],
    });
    vi.spyOn(window, "alert").mockImplementation(() => {});
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(storedRun(RUN)!.narrative!.status).toBe("done"));
    expect(storedRun(RUN)!.narrative).toEqual({ status: "done", jobId: JOB_ID });
    expect(storedRun(RUN)!.reportData.judge).toMatchObject({ gate: "passed", model: "gpt-6.1-sol", criteriaVersion: "1.0" });
    await waitFor(() => expect(issueButton()).toBeEnabled());
    expect(pdfButton()).toBeEnabled();
    expect(screen.queryByTestId("judge-held-banner")).toBeNull();
    fireEvent.click(issueButton());
    const dialogIssue = await screen.findAllByRole("button", { name: /^발급$/ });
    fireEvent.click(dialogIssue[dialogIssue.length - 1]);
    await waitFor(() => expect(s.count("POST", ISSUE)).toBe(1));
    expect(s.calls.find((c) => ISSUE.test(c.url))!.body.narrative_job_id).toBe(JOB_ID);
  });
});

describe("보류 — 서술은 보이고 띠·잠금", () => {
  it("gate_failed(다시 만들기 없음) — held·요청 보존, B37+B38, 버튼 없음, PDF·발급 잠김과 B45", async () => {
    stub({ views: [{ body: doneWith(held("gate_failed", false)) }] });
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(storedRun(RUN)!.narrative!.status).toBe("held"));
    expect(storedRun(RUN)!.narrative!.input).toBeTruthy();
    expect(storedRun(RUN)!.reportData.isEvaluated).toBe(true);
    await waitFor(() => expect(banner()).toHaveTextContent(B37_HELD_HEAD));
    expect(banner()).toHaveTextContent(B38_HELD_GATE_FAILED);
    expect(retryButton()).toBeNull();
    expect(pdfButton()).toBeDisabled();
    expect(issueButton()).toBeDisabled();
    expect(screen.getAllByText(B45_LOCK_HELD).length).toBeGreaterThan(0);
    // 서술은 보인다(예시본 5.2 첫 글 — 판 4 입력의 칸 7.1).
    expect(screen.getByText(JOBS_INPUT.done.result.interpretation.confusion_analysis)).toBeInTheDocument();
  });

  it("judge_error — 둘째 줄은 retry_allowed 로 고른다(B40 두 글)", async () => {
    stub({ views: [{ body: doneWith(held("judge_error", true)) }] });
    seedEd4Pending();
    const view = renderPage();
    await waitFor(() => expect(banner()).toHaveTextContent(B40_HELD_JUDGE_ERROR_RETRY));
    expect(retryButton()).not.toBeNull();
    view.unmount();
    resetAll();
    stub({ views: [{ body: doneWith(held("judge_error", false)) }] });
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(banner()).toHaveTextContent(B40_HELD_JUDGE_ERROR));
    expect(banner()).not.toHaveTextContent(B40_HELD_JUDGE_ERROR_RETRY);
    expect(retryButton()).toBeNull();
  });

  it("다시 만들기는 종류가 아니라 retry_allowed 를 따른다 — gate_failed 라도 true 면 버튼(판정 지점은 백엔드 하나)", async () => {
    stub({ views: [{ body: doneWith(held("gate_failed", true)) }] });
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(banner()).toHaveTextContent(B38_HELD_GATE_FAILED));
    expect(retryButton()).not.toBeNull();
  });

  it("budget(다시 만들기 있음) — StrictMode 에서 두 번 눌러도 새 작업 하나, 평가 없음, 옛 묶음 지움, 새 작업 pending", async () => {
    const s = stub({
      views: [{ body: doneWith(held("budget", true)) }],
      create: [{ body: { job_id: "job-j6-2", status: "running", stage: "queued", benchmark_refs: [], result: null } }],
    });
    seedEd4Pending();
    const sent = storedRun(RUN)!.narrative!.input;
    renderPage(true);
    await waitFor(() => expect(banner()).toHaveTextContent(B42_HELD_BUDGET));
    s.views.splice(0, s.views.length, { body: running("generating") });
    const button = retryButton()!;
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(storedRun(RUN)!.narrative).toMatchObject({ status: "pending", jobId: "job-j6-2" }));
    expect(s.count("POST", JOBS)).toBe(1);
    expect(s.calls.filter((c) => c.method === "POST" && /\/api\/evaluate$/.test(c.url))).toHaveLength(0);
    expect(s.calls.find((c) => c.method === "POST" && JOBS.test(c.url))!.body).toEqual(sent);
    expect(storedRun(RUN)!.reportData).not.toHaveProperty("judge");
    expect(storedRun(RUN)!.reportData.isEvaluated).toBe(false);
  });

  it("인쇄 화면도 잠근다 — 제목은 B45(판 3 '서술이 끝나지 않아' 글이 아님)", async () => {
    stub({ views: [{ body: doneWith(held("no_key", false)) }] });
    seedEd4Pending();
    const view = renderPage();
    await waitFor(() => expect(storedRun(RUN)!.narrative!.status).toBe("held"));
    view.unmount();
    vi.stubGlobal("print", vi.fn());
    renderPrint();
    expect(await screen.findByRole("heading", { name: B45_LOCK_HELD })).toBeInTheDocument();
    expect(screen.queryByText(/서술이 끝나지 않아/)).toBeNull();
  });

  it("행 없이 바로 끝난 결과(작업 행 상한) — held·jobId 없음, B43, 다시 만들기 없음", async () => {
    stub({ views: [{ body: doneWith(held("gate_failed", true)) }] });
    seedEd4Pending();
    // 실패한 run 에서 다시 만들기 → 서버가 행 없이 바로 결과(판 4 job_limit 보류)를 준다.
    const s = stub({
      create: [{ body: { status: "done", benchmark_refs: [], result: doneWith(held("job_limit", false)).result } }],
    });
    useWorkspaceStore.setState((st) => ({
      evaluationRuns: st.evaluationRuns.map((r) => ({ ...r, narrative: { status: "failed", jobId: null, failure: "error", input: r.narrative!.input } })),
    }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "서술 다시 만들기" }));
    await waitFor(() => expect(storedRun(RUN)!.narrative!.status).toBe("held"));
    expect(storedRun(RUN)!.narrative!.jobId).toBeNull();
    expect(s.count("POST", JOBS)).toBe(1);
    await waitFor(() => expect(banner()).toHaveTextContent(B43_HELD_JOB_LIMIT));
    expect(retryButton()).toBeNull();
    expect(issueButton()).toBeDisabled();
  });
});

describe("심판 기록 없음(닫힌 쪽 기본값) — B46, 다시 만들기 줌", () => {
  it.each([
    ["묶음 없음(옛 백엔드)", undefined],
    ["모르는 gate", { ...PASSED, gate: "ok" }],
    ["통과인데 건수가 없음", { ...PASSED, counts: null }],
    ["모르는 보류 종류", held("later", true)],
  ])("%s → held, B46, PDF·발급 잠김", async (_name, judge) => {
    stub({ views: [{ body: doneWith(judge) }] });
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(storedRun(RUN)!.narrative!.status).toBe("held"));
    expect(storedRun(RUN)!.reportData).not.toHaveProperty("judge");
    await waitFor(() => expect(banner()).toHaveTextContent(B46_LOCK_NO_RECORD));
    expect(banner()).not.toHaveTextContent(B37_HELD_HEAD);
    expect(retryButton()).not.toBeNull();
    expect(pdfButton()).toBeDisabled();
    expect(issueButton()).toBeDisabled();
  });
});

describe("서버 발급 거절(409) — B48", () => {
  async function issueWith(reply: Reply) {
    stub({ views: [{ body: doneWith(PASSED) }], issue: [reply] });
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(issueButton()).toBeEnabled());
    fireEvent.click(issueButton());
    const buttons = await screen.findAllByRole("button", { name: /^발급$/ });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
    return alert.mock.calls[0][0];
  }

  it("심판 사유 코드가 붙은 409 → '서버가 발급을 거절했습니다: {서버 글}'(코드 그대로)", async () => {
    const detail = judgeServerDetail("judge_not_passed");
    expect(await issueWith({ status: 409, body: { detail } })).toBe(`서버가 발급을 거절했습니다: ${detail}`);
  });

  it("심판이 아닌 409 는 지금 안내 그대로('발급 실패: …')", async () => {
    expect(await issueWith({ status: 409, body: { detail: "기관 정보가 시드되지 않았습니다." } })).toBe(
      "발급 실패: 기관 정보가 시드되지 않았습니다.",
    );
  });
});

describe("훅의 다시 만들기 막기 — 버튼 밖에서 불러도 retry_allowed 를 따른다", () => {
  it("보류(다시 만들기 없음)에서 retryNarrative() 를 직접 불러도 새 작업을 만들지 않는다", async () => {
    const { renderHook } = await import("@testing-library/react");
    const { useReportData } = await import("./useReportData");
    const s = stub({
      views: [{ body: doneWith(held("gate_failed", false)) }],
      create: [{ body: { job_id: "job-x", status: "running", stage: "queued", benchmark_refs: [], result: null } }],
    });
    seedEd4Pending();
    const { result } = renderHook(() => useReportData(RUN));
    await waitFor(() => expect(storedRun(RUN)!.narrative!.status).toBe("held"));
    await act(() => result.current.retryNarrative());
    expect(s.count("POST", JOBS)).toBe(0);
    expect(storedRun(RUN)!.narrative!.status).toBe("held");
  });
});

describe("검토 반영(J6) — 보류에서 빠져나갈 길", () => {
  function seedEd4Stored(narrative: unknown, judge?: unknown) {
    const final = readJson(resolve(FIX, "bc_strong.final.json"));
    if (judge === undefined) delete final.judge;
    else final.judge = judge;
    seedEd4Pending();
    useWorkspaceStore.setState((st) => ({
      evaluationRuns: st.evaluationRuns.map((r) => ({ ...r, reportData: final, narrative: narrative as never })),
    }));
  }

  it("P1 — 보류인데 저장된 요청이 없으면(너무 큼) 다시 만들기는 평가부터: 완성본 표시·옛 묶음을 거둬 잠긴 채 갇히지 않는다", async () => {
    const { toJudgeBundle } = await import("../lib/report/judgeBundle");
    const s = stub({});
    seedEd4Stored({ status: "held", jobId: JOB_ID, input: null }, toJudgeBundle(held("budget", true)));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "서술 다시 만들기" }));
    await waitFor(() => expect(storedRun(RUN)!.narrative).toBeUndefined());
    expect(storedRun(RUN)!.reportData.isEvaluated).toBe(false);
    expect(storedRun(RUN)!.reportData).not.toHaveProperty("judge");
    expect(s.count("POST", JOBS)).toBe(0);
    // 평가 효과가 다시 돈다 — 이 run 은 평가 요청 스냅샷이 없어 '다시 평가' 안내로 간다(잠긴 성적서에 머물지 않음).
    expect(await screen.findByText("이 평가는 다시 평가해야 합니다")).toBeInTheDocument();
  });

  it("P2 — done 으로 저장된 판 4 run 인데 심판 기록이 없으면 보류로 보여 B46 띠와 다시 만들기, 인쇄도 잠김", async () => {
    stub({});
    seedEd4Stored({ status: "done", jobId: JOB_ID });
    const view = renderPage();
    await waitFor(() => expect(banner()).toHaveTextContent(B46_LOCK_NO_RECORD));
    expect(retryButton()).not.toBeNull();
    expect(issueButton()).toBeDisabled();
    view.unmount();
    vi.stubGlobal("print", vi.fn());
    const print = renderPrint();
    expect(await screen.findByRole("heading", { name: B46_LOCK_NO_RECORD })).toBeInTheDocument();
    print.unmount();
    // 버튼이 실제로 동작한다 — 저장 상태가 done 이어도 다시 만들기가 받아 준다(요청이 없으니 평가부터).
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "서술 다시 만들기" }));
    await waitFor(() => expect(storedRun(RUN)!.narrative).toBeUndefined());
  });

  it("판 4 통과 묶음으로 done 저장된 run 은 그대로 done(띠 없음, 발급 열림)", async () => {
    stub({});
    seedEd4Stored({ status: "done", jobId: JOB_ID }, readJson(resolve(FIX, "bc_strong.final.json")).judge);
    renderPage();
    await waitFor(() => expect(issueButton()).toBeEnabled());
    expect(screen.queryByTestId("judge-held-banner")).toBeNull();
  });
});

describe("부록 1 배선(J7) — 통과한 서술을 합칠 때 한 번 만들고, 보류면 비우고, 새 작업 때 지운다", () => {
  const APPENDIX = "부록 1. 성적서 점검 결과";

  it("통과 → appendix1 저장·화면에 부록 1(요약 문장 그대로)", async () => {
    stub({ views: [{ body: doneWith(JOBS_INPUT.done.result.judge) }] });
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(storedRun(RUN)!.narrative!.status).toBe("done"));
    const a = storedRun(RUN)!.reportData.appendix1!;
    expect(a.summary).toMatch(/^이 성적서는 TS 4213 보고 항목 \d+개/);
    expect(await screen.findByRole("heading", { name: APPENDIX })).toBeInTheDocument();
    expect(screen.getByText(a.summary, { exact: false })).toBeInTheDocument();
  });

  it("보류 → appendix1 없음·부록 제목도 없음(B58) — 대기 중 저장본에 옛 부록이 남아 있어도 합칠 때 버린다", async () => {
    stub({ views: [{ body: doneWith(held("gate_failed", false)) }] });
    seedEd4Pending();
    useWorkspaceStore.setState((st) => ({
      evaluationRuns: st.evaluationRuns.map((r) => ({
        ...r,
        reportData: { ...r.reportData, appendix1: { ...readJson(resolve(FIX, "bc_strong.final.json")).appendix1, summary: "옛 부록" } },
      })),
    }));
    renderPage();
    await waitFor(() => expect(banner()).toHaveTextContent(B38_HELD_GATE_FAILED));
    expect(storedRun(RUN)!.reportData).not.toHaveProperty("appendix1");
    expect(screen.queryByRole("heading", { name: APPENDIX })).toBeNull();
  });

  it("검증 중(대기) — 부록 제목 없음", async () => {
    stub({ views: [{ body: running("judging") }] });
    seedEd4Pending();
    renderPage();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("검증 중"));
    expect(screen.queryByRole("heading", { name: APPENDIX })).toBeNull();
  });

  it("다시 만들기로 새 작업을 만들면 옛 부록 글을 지운다(합칠 때가 아니라 새 작업을 만들 때)", async () => {
    const { toJudgeBundle } = await import("../lib/report/judgeBundle");
    const s = stub({
      views: [{ body: running("generating") }],
      create: [{ body: { job_id: "job-j6-3", status: "running", stage: "queued", benchmark_refs: [], result: null } }],
    });
    seedEd4Pending();
    // 보류로 저장된 run 에 옛 부록 글이 남아 있는 경우(합성) — 새 작업이 시작되면 지워져야 한다.
    const final = readJson(resolve(FIX, "bc_strong.final.json"));
    useWorkspaceStore.setState((st) => ({
      evaluationRuns: st.evaluationRuns.map((r) => ({
        ...r,
        reportData: { ...final, judge: toJudgeBundle(held("budget", true)), appendix1: { ...final.appendix1, summary: "옛 부록" } },
        narrative: { status: "held", jobId: JOB_ID, input: r.narrative!.input },
      })),
    }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "서술 다시 만들기" }));
    await waitFor(() => expect(storedRun(RUN)!.narrative).toMatchObject({ status: "pending", jobId: "job-j6-3" }));
    expect(s.count("POST", JOBS)).toBe(1);
    expect(storedRun(RUN)!.reportData).not.toHaveProperty("appendix1");
    expect(storedRun(RUN)!.reportData).not.toHaveProperty("judge");
  });
});
