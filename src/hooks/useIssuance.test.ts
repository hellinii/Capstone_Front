/**
 * 발급 전 용량 확인 — 서버는 성적서 원본을 1 MiB 까지만 받는다. 넘으면 서버의 422 대신
 * 이유와 고칠 곳을 알리고 요청을 보내지 않는다.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/report/issuanceApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/report/issuanceApi")>();
  return { ...actual, issueReport: vi.fn(), reissueReport: vi.fn() };
});

import { issueReport, reissueReport } from "../lib/report/issuanceApi";
import { useIssuance } from "./useIssuance";
import { ISSUE_CONTENT_MAX_BYTES } from "../utils/image/examplePreview";
import type { FinalReportData } from "../types/finalReport.types";
import { JUDGE_SERVER_MESSAGES, judgeServerDetail } from "../test/judgeServerRejections";

function report(extraBytes: number): FinalReportData {
  return {
    meta: { reportId: "", issuedAt: "" },
    isEvaluated: true,
    trainingDatasetInfo: {
      validExamples: [{ name: "big.jpg", size: "5 MB", type: "image/jpeg", previewUrl: "a".repeat(extraBytes) }],
    },
  } as unknown as FinalReportData;
}

afterEach(() => vi.restoreAllMocks());

describe("발급 전 용량 확인", () => {
  it("상한을 넘으면 서버에 보내지 않고 이유를 알린다", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { result } = renderHook(() => useIssuance("run-1", report(ISSUE_CONTENT_MAX_BYTES)));

    await act(() => result.current.issue());

    expect(issueReport).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(expect.stringContaining("예시 이미지"));
  });

  it("상한 안이면 그대로 발급을 요청한다", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(issueReport).mockRejectedValueOnce(new Error("network")); // 요청이 나갔는지만 본다
    const { result } = renderHook(() => useIssuance("run-1", report(1_000)));

    await act(() => result.current.issue());

    expect(issueReport).toHaveBeenCalledTimes(1);
  });
});

describe("발급 비고 (B16)", () => {
  it("적은 비고는 앞뒤 공백을 떼어 보내고, 비거나 공백뿐이면 보내지 않는다", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(issueReport).mockClear();
    vi.mocked(issueReport).mockRejectedValue(new Error("network")); // 요청 본문만 본다
    const { result } = renderHook(() => useIssuance("run-1", report(1_000)));

    await act(() => result.current.issue(" 고객 제출용 "));
    await act(() => result.current.issue("   "));
    await act(() => result.current.issue());

    const notes = vi.mocked(issueReport).mock.calls.map(([payload]) => payload.note);
    expect(notes).toEqual(["고객 제출용", undefined, undefined]);
  });
});



/** 서술 라운드 S3b — 끝나지 않은 서술은 완성본이 아니다. 발급·정정 발급 모두 서술 done 이어야 한다. */
describe("서술이 끝나지 않으면 발급·정정 발급을 잠근다", () => {
  it("서술이 끝나지 않았으면 발급할 수 없고 요청도 보내지 않는다", async () => {
    vi.mocked(issueReport).mockClear();
    const { result } = renderHook(() => useIssuance("run-1", report(1_000), "pending"));
    expect(result.current.canIssue).toBe(false);
    await act(() => result.current.issue());
    expect(issueReport).not.toHaveBeenCalled();
  });

  it("완성본 표시(isEvaluated)가 없으면 서술 상태가 done 이어도 잠근다", () => {
    const draft = { ...report(1_000), isEvaluated: false } as FinalReportData;
    expect(renderHook(() => useIssuance("run-1", draft, "done")).result.current.canIssue).toBe(false);
  });

  it("발급된 성적서도 서술이 끝나지 않았으면 정정 발급을 보내지 않는다", async () => {
    vi.mocked(reissueReport).mockClear();
    const issued = { ...report(1_000), meta: { reportId: "RPT-2026-0001", issuedAt: "x" } } as unknown as FinalReportData;
    const { result } = renderHook(() => useIssuance("run-1", issued, "pending"));
    await act(() => result.current.reissue("오타 수정"));
    expect(reissueReport).not.toHaveBeenCalled();
  });

  it("서술이 끝난 완성본은 정정 발급을 보낸다", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(reissueReport).mockClear();
    vi.mocked(reissueReport).mockRejectedValueOnce(new Error("network"));
    const issued = { ...report(1_000), meta: { reportId: "RPT-2026-0001", issuedAt: "x" } } as unknown as FinalReportData;
    const { result } = renderHook(() => useIssuance("run-1", issued, "done"));
    await act(() => result.current.reissue("오타 수정"));
    expect(reissueReport).toHaveBeenCalledTimes(1);
  });
});

/**
 * 심판 라운드 J6 — 판 4 는 잠금 판정 한 곳(`reportLock`)을 이 훅도 본다(버튼 밖에서 부르는 길). 발급·정정 발급 요청에 서술 작업
 * 번호를 싣는다(서버 발급 검사가 이 번호로 심판 통과를 본다).
 */
describe("판 4 심판 잠금·작업 번호 (심판 라운드 J6)", () => {
  const PASSED = {
    gate: "passed",
    heldKind: null,
    retryAllowed: false,
    criteriaVersion: "1.0",
    model: "gpt-6.1-sol",
    axes: ["faithfulness"],
    counts: { faithfulness: { checked: 1, matched: 1 } },
  } as const;
  const ed4 = (judge: unknown, reportId = "") =>
    ({ ...report(1_000), contentSchema: 4, judge, meta: { reportId, issuedAt: "" } }) as unknown as FinalReportData;

  async function seedRun(jobId: string | null) {
    const { useWorkspaceStore } = await import("../utils/stores/useWorkspaceStore");
    useWorkspaceStore.setState({
      evaluationRuns: [{ id: "run-1", narrative: { status: "done", jobId } } as never],
    });
  }

  it.each([
    ["보류 묶음", { ...PASSED, gate: "held", heldKind: "gate_failed", counts: null }, "held"],
    ["묶음 없음", undefined, "done"],
  ] as const)("%s — canIssue false, issue()·reissue() 를 직접 불러도 요청 없음", async (_n, judge, phase) => {
    vi.mocked(issueReport).mockClear();
    vi.mocked(reissueReport).mockClear();
    const a = renderHook(() => useIssuance("run-1", ed4(judge), phase));
    expect(a.result.current.canIssue).toBe(false);
    await act(() => a.result.current.issue());
    const b = renderHook(() => useIssuance("run-1", ed4(judge, "RPT-2026-0009"), phase));
    await act(() => b.result.current.reissue("정정"));
    expect(issueReport).not.toHaveBeenCalled();
    expect(reissueReport).not.toHaveBeenCalled();
  });

  it("통과 묶음 — 발급·정정 발급 요청에 run 의 작업 번호를 싣는다", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    await seedRun("job-77");
    vi.mocked(issueReport).mockClear();
    vi.mocked(reissueReport).mockClear();
    vi.mocked(issueReport).mockRejectedValueOnce(new Error("network"));
    vi.mocked(reissueReport).mockRejectedValueOnce(new Error("network"));
    const a = renderHook(() => useIssuance("run-1", ed4(PASSED), "done"));
    expect(a.result.current.canIssue).toBe(true);
    await act(() => a.result.current.issue());
    expect(vi.mocked(issueReport).mock.calls[0][0].narrativeJobId).toBe("job-77");
    const b = renderHook(() => useIssuance("run-1", ed4(PASSED, "RPT-2026-0009"), "done"));
    await act(() => b.result.current.reissue("정정"));
    expect(vi.mocked(reissueReport).mock.calls[0][2].narrativeJobId).toBe("job-77");
  });

  it("정정 발급이 심판 사유로 409 거절되면 B48 안내", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    await seedRun("job-77");
    const { IssuanceRequestError } = await import("../lib/report/issuanceApi");
    vi.mocked(reissueReport).mockRejectedValueOnce(new IssuanceRequestError(judgeServerDetail("judge_narrative_mismatch"), 409));
    const b = renderHook(() => useIssuance("run-1", ed4(PASSED, "RPT-2026-0009"), "done"));
    await act(() => b.result.current.reissue("정정"));
    expect(alert).toHaveBeenCalledWith(
      `서버가 발급을 거절했습니다: ${JUDGE_SERVER_MESSAGES.judge_narrative_mismatch} (judge_narrative_mismatch)`,
    );
  });
});
