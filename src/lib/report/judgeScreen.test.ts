/**
 * 심판 라운드 J6 순수 함수 — 심판 묶음 읽기(닫힌 쪽), 잠금 판정 한 곳, 화면 글 고르기, 화면 문안 B35~B48 글자 대조, 작업 조회의
 * judging 단계.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { COVERAGE_IDS, JUDGE_HELD_KINDS, toJudgeBundle } from "./judgeBundle";
import { COVERAGE_ITEMS } from "./edition4/appendix";
import { isEdition4Content, reportLock, type LockPhase } from "./reportLock";
import { heldNotice, isJudgeRejection, lockReasonText, serverRejectedText } from "./judgeNotice";
import { fetchNarrativeJob, mapNarrativeResult } from "./narrativeJobApi";
import * as T from "./edition4/edition4Text";
import { NARRATIVE_STAGE_LABEL } from "../../components/report/ReportStateNotices";
import { JUDGE_SERVER_MESSAGES, judgeServerDetail, type JudgeRejectionCode } from "../../test/judgeServerRejections";

const CONTRACT = JSON.parse(readFileSync(resolve(__dirname, "../../test/contract/judge_bundle_ed4.json"), "utf8"));
const WORDING = JSON.parse(readFileSync(resolve(__dirname, "../../test/edition4/fixedWording.ed4.json"), "utf8"));
const B = (n: number): string => WORDING.appendixB_raw[`B${n}`].candidate;
const PASSED = CONTRACT.examples.passed;
const HELD = CONTRACT.examples.held;

describe("심판 묶음 읽기(toJudgeBundle) — 계약 예시는 읽고, 틀린 모양은 버린다", () => {
  it("통과 예시 → camelCase 묶음(건수·체크리스트 그대로)", () => {
    expect(toJudgeBundle(PASSED)).toEqual({
      gate: "passed",
      heldKind: null,
      retryAllowed: false,
      criteriaVersion: "1.0",
      model: "gpt-6.1-sol",
      axes: ["faithfulness", "consistency", "coverage", "readability"],
      counts: {
        faithfulness: { checked: 23, matched: 23 },
        consistency: { checked: 15, contradictions: 0 },
        coverage: {
          applicable: 2,
          described: 2,
          notApplicable: 16,
          items: [
            { id: "분석-1", described: true, place: "5.2" },
            { id: "소견-1", described: true, place: "5.1" },
          ],
        },
        readability: { rules: 2, violations: 0 },
      },
    });
  });

  it("보류 예시와 계약의 보류 종류 일곱이 모두 읽힌다", () => {
    expect(Object.keys(CONTRACT.held_kinds)).toEqual([...JUDGE_HELD_KINDS]);
    for (const kind of JUDGE_HELD_KINDS) {
      expect(toJudgeBundle({ ...HELD, held_kind: kind })).toMatchObject({ gate: "held", heldKind: kind, counts: null });
    }
  });

  it("뺀 축은 건수도 없다 — 축 목록에 있는 축만 읽는다(7.7 축 빼기)", () => {
    const { coverage: _c, ...counts } = PASSED.counts;
    const b = toJudgeBundle({ ...PASSED, axes: ["faithfulness", "consistency", "readability"], counts });
    expect(b?.axes).toEqual(["faithfulness", "consistency", "readability"]);
    expect(b?.counts).not.toHaveProperty("coverage");
  });

  it.each([
    ["없음", undefined],
    ["null", null],
    ["배열", [PASSED]],
    ["모르는 gate", { ...PASSED, gate: "ok" }],
    ["gate 대문자", { ...PASSED, gate: "PASSED" }],
    ["retry_allowed 가 글", { ...HELD, retry_allowed: "true" }],
    ["통과인데 retry_allowed true", { ...PASSED, retry_allowed: true }],
    ["통과인데 held_kind", { ...PASSED, held_kind: "timeout" }],
    ["통과인데 건수 없음", { ...PASSED, counts: null }],
    ["통과인데 한 축 건수 빠짐", { ...PASSED, counts: { ...PASSED.counts, readability: undefined } }],
    ["건수가 음수", { ...PASSED, counts: { ...PASSED.counts, faithfulness: { checked: -1, matched: 0 } } }],
    ["건수가 소수", { ...PASSED, counts: { ...PASSED.counts, consistency: { checked: 1.5, contradictions: 0 } } }],
    ["체크리스트 항목 모양", { ...PASSED, counts: { ...PASSED.counts, coverage: { ...PASSED.counts.coverage, items: [{ id: 1 }] } } }],
    ["모르는 보류 종류", { ...HELD, held_kind: "later" }],
    ["보류 종류 없음", { ...HELD, held_kind: null }],
    ["모르는 축", { ...PASSED, axes: [...PASSED.axes, "style"] }],
    ["축 순서 바뀜", { ...PASSED, axes: ["consistency", "faithfulness", "coverage", "readability"] }],
    ["축 겹침", { ...PASSED, axes: ["faithfulness", "faithfulness"] }],
    ["모델 이름 없음", { ...PASSED, model: null }],
    ["서술됨인데 자리 없음", { ...PASSED, counts: { ...PASSED.counts, coverage: { ...PASSED.counts.coverage, items: [{ id: "분석-1", described: true, place: null }, PASSED.counts.coverage.items[1]] } } }],
    ["서술 안 됨인데 자리 있음", { ...PASSED, counts: { ...PASSED.counts, coverage: { ...PASSED.counts.coverage, described: 1, items: [{ id: "분석-1", described: false, place: "5.2" }, PASSED.counts.coverage.items[1]] } } }],
    ["모르는 항목 id", { ...PASSED, counts: { ...PASSED.counts, coverage: { ...PASSED.counts.coverage, items: [{ id: "분석-9", described: true, place: "5.2" }, PASSED.counts.coverage.items[1]] } } }],
    ["항목 id 겹침", { ...PASSED, counts: { ...PASSED.counts, coverage: { ...PASSED.counts.coverage, items: [PASSED.counts.coverage.items[0], PASSED.counts.coverage.items[0]] } } }],
    ["적용 수 ≠ 항목 수", { ...PASSED, counts: { ...PASSED.counts, coverage: { ...PASSED.counts.coverage, applicable: 3, not_applicable: 15 } } }],
    ["서술 수 ≠ 서술된 항목 수", { ...PASSED, counts: { ...PASSED.counts, coverage: { ...PASSED.counts.coverage, described: 1 } } }],
    ["적용 + 해당 없음 ≠ 18", { ...PASSED, counts: { ...PASSED.counts, coverage: { ...PASSED.counts.coverage, not_applicable: 15 } } }],
    ["기준 버전 없음", { ...PASSED, criteria_version: 1 }],
  ])("%s → undefined", (_name, raw) => {
    expect(toJudgeBundle(raw)).toBeUndefined();
  });

  it("필수 내용 항목 id 목록 = 부록 필수 내용 18개(같은 순서)", () => {
    expect(COVERAGE_IDS).toEqual(COVERAGE_ITEMS.map((c) => c.id));
  });

  it("작업 결과 매핑에 묶음이 실린다 — 판 3 결과(키 없음)는 undefined", () => {
    expect(mapNarrativeResult({ judge: PASSED }).judge?.gate).toBe("passed");
    expect(mapNarrativeResult({}).judge).toBeUndefined();
    expect(mapNarrativeResult({ judge: { gate: "ok" } }).judge).toBeUndefined();
  });

  it("묶음에 내부 정보 키가 와도 옮기지 않는다(계약 never_in_bundle)", () => {
    const b = toJudgeBundle({ ...PASSED, reasons: ["x"], quotes: ["y"], cost: 1 }) as unknown as Record<string, unknown>;
    expect(Object.keys(b).sort()).toEqual(["axes", "counts", "criteriaVersion", "gate", "heldKind", "model", "retryAllowed"]);
  });
});

describe("판 판정(isEdition4Content) — 백엔드 발급 검사와 같은 닫힌 쪽 규칙", () => {
  it.each([
    [undefined, false],
    [null, false],
    [1, false],
    [2, false],
    [3, false],
    [4, true],
    ["4", true],
    ["3", true],
    [4.5, true],
    [0, true],
    [5, true],
  ])("contentSchema %s → %s", (schema, expected) => {
    expect(isEdition4Content({ contentSchema: schema as never })).toBe(expected);
  });
});

describe("잠금 판정(reportLock) 행렬", () => {
  const ed3 = { contentSchema: 3, isEvaluated: true } as const;
  const ed4 = (judge?: unknown) => ({ contentSchema: 4, isEvaluated: true, judge: judge === undefined ? undefined : toJudgeBundle(judge) });
  const phases: LockPhase[] = ["none", "pending", "failed"];

  it("서술이 끝나지 않았으면(none·pending·failed) 판과 묶음에 관계없이 narrative", () => {
    for (const phase of phases) {
      expect(reportLock(phase, ed3)).toBe("narrative");
      expect(reportLock(phase, ed4(PASSED))).toBe("narrative");
    }
  });

  it("완성본 표시가 없거나 데이터가 없으면 narrative", () => {
    expect(reportLock("done", { ...ed3, isEvaluated: false })).toBe("narrative");
    expect(reportLock("done", null)).toBe("narrative");
  });

  it("판 3·판 1 은 묶음 없이 열린다(지금 그대로)", () => {
    expect(reportLock("done", ed3)).toBeNull();
    expect(reportLock("done", { isEvaluated: true })).toBeNull();
  });

  it("판 4: 통과 + done 만 열림, 보류 judge_held, 묶음 없음·틀림 judge_missing", () => {
    expect(reportLock("done", ed4(PASSED))).toBeNull();
    expect(reportLock("done", ed4(HELD))).toBe("judge_held");
    expect(reportLock("held", ed4(HELD))).toBe("judge_held");
    expect(reportLock("done", ed4())).toBe("judge_missing");
    expect(reportLock("done", ed4({ gate: "ok" }))).toBe("judge_missing");
    // 서술 상태가 보류인데 묶음이 통과면 어긋난 상태 — 닫힌 쪽으로 잠근다.
    expect(reportLock("held", ed4(PASSED))).toBe("judge_held");
    // 저장된 묶음의 gate 가 손상되면(옛 저장본 등) 잠근다.
    expect(reportLock("done", { contentSchema: 4, isEvaluated: true, judge: { gate: "x" } as never })).toBe("judge_missing");
  });
});

describe("화면 글 고르기(judgeNotice)", () => {
  const bundle = (kind: string, retry: boolean) => toJudgeBundle({ ...HELD, held_kind: kind, retry_allowed: retry });

  it("종류별 둘째 줄 B38~B44, 머리는 B37", () => {
    const lines: Record<string, string> = {
      gate_failed: T.B38_HELD_GATE_FAILED,
      timeout: T.B39_HELD_TIMEOUT,
      no_key: T.B41_HELD_NO_KEY,
      budget: T.B42_HELD_BUDGET,
      job_limit: T.B43_HELD_JOB_LIMIT,
      no_material: T.B44_HELD_NO_MATERIAL,
    };
    for (const [kind, line] of Object.entries(lines)) {
      expect(heldNotice(bundle(kind, false))).toEqual({ head: T.B37_HELD_HEAD, line, retry: false });
    }
    expect(heldNotice(bundle("judge_error", true))).toEqual({ head: T.B37_HELD_HEAD, line: T.B40_HELD_JUDGE_ERROR_RETRY, retry: true });
    expect(heldNotice(bundle("judge_error", false))).toEqual({ head: T.B37_HELD_HEAD, line: T.B40_HELD_JUDGE_ERROR, retry: false });
  });

  it("다시 만들기는 retry_allowed 그대로 — 종류로 다시 가르지 않는다", () => {
    for (const kind of JUDGE_HELD_KINDS) {
      expect(heldNotice(bundle(kind, true)).retry).toBe(true);
      expect(heldNotice(bundle(kind, false)).retry).toBe(false);
    }
  });

  it("묶음 없음·통과 묶음(보류 상태와 어긋남) → B46 한 줄, 다시 만들기 줌", () => {
    expect(heldNotice(undefined)).toEqual({ head: T.B46_LOCK_NO_RECORD, line: null, retry: true });
    expect(heldNotice(toJudgeBundle(PASSED))).toEqual({ head: T.B46_LOCK_NO_RECORD, line: null, retry: true });
  });

  it("잠금 이유 글 — 보류 B45, 기록 없음 B46, 서술 미완료는 넘긴 글 그대로", () => {
    expect(lockReasonText("judge_held", "x")).toBe(T.B45_LOCK_HELD);
    expect(lockReasonText("judge_missing", "x")).toBe(T.B46_LOCK_NO_RECORD);
    expect(lockReasonText("narrative", "서술이 끝나지 않아 인쇄·발급할 수 없습니다.")).toBe("서술이 끝나지 않아 인쇄·발급할 수 없습니다.");
  });

  it("서버 거절 — 409 이고 글 끝 괄호가 심판 사유 코드일 때만, B48 에 서버 글 그대로", () => {
    const codes = ["judge_job_missing", "judge_job_not_found", "judge_job_not_edition4", "judge_record_expired", "judge_not_passed"];
    for (const code of codes) expect(isJudgeRejection(409, `글 (${code})`)).toBe(true);
    expect(isJudgeRejection(403, "글 (judge_not_passed)")).toBe(false);
    expect(isJudgeRejection(409, "기관 정보가 시드되지 않았습니다.")).toBe(false);
    expect(isJudgeRejection(undefined, "글 (judge_not_passed)")).toBe(false);
    expect(serverRejectedText("글 (judge_not_passed)")).toBe("서버가 발급을 거절했습니다: 글 (judge_not_passed)");
  });

  it("서버의 실제 거절 글 여덟 개(2026-10-29 문안, 마침표 둘·두 문장) — 모두 심판 거절로 알아보고 B48 에 글 그대로", () => {
    const codes = Object.keys(JUDGE_SERVER_MESSAGES) as JudgeRejectionCode[];
    expect(codes).toHaveLength(8);
    for (const code of codes) {
      const detail = judgeServerDetail(code);
      // 사유 코드 괄호 앞 글은 두 문장이고 마침표로 끝난다 — 정규식이 앞 문장의 마침표·쉼표에 흔들리지 않아야 한다.
      expect(JUDGE_SERVER_MESSAGES[code].split(". ")).toHaveLength(2);
      expect(isJudgeRejection(409, detail), code).toBe(true);
      expect(isJudgeRejection(409, `${detail}\n`), `${code} 끝 줄바꿈`).toBe(true);
      expect(isJudgeRejection(400, detail), `${code} 400`).toBe(false);
      expect(serverRejectedText(detail)).toBe(`서버가 발급을 거절했습니다: ${JUDGE_SERVER_MESSAGES[code]} (${code})`);
    }
  });

  it("사유 코드는 글 끝 괄호에서만 — 앞 문장에 괄호·코드가 있어도 끝이 아니면 심판 거절이 아니다", () => {
    const msg = JUDGE_SERVER_MESSAGES.judge_not_passed;
    expect(isJudgeRejection(409, `${msg} (judge_not_passed).`)).toBe(false);
    expect(isJudgeRejection(409, `(judge_not_passed) ${msg}`)).toBe(false);
    expect(isJudgeRejection(409, `${msg} (judge_not_passed) 다시 시도해 주세요.`)).toBe(false);
    expect(isJudgeRejection(409, `${msg}(judge_not_passed)`)).toBe(true);
    expect(isJudgeRejection(409, `앞 문장(발급 보류). 뒤 문장, 쉼표. (judge_not_passed)`)).toBe(true);
    expect(isJudgeRejection(409, `${msg} (발급 보류)`)).toBe(false);
  });
});

describe("화면 문안 = 고정 문구 사본 1.1 표 B35~B48 글자", () => {
  it("B35 검증 중 = 단계 이름표 judging, B36 = 지금 이름 '다시 만드는 중'", () => {
    expect(T.B35_STAGE_JUDGING).toBe(B(35));
    expect(NARRATIVE_STAGE_LABEL.judging).toBe(B(35));
    expect(B(36).startsWith(`${NARRATIVE_STAGE_LABEL.regenerating} `)).toBe(true);
  });

  it("B37·B38·B39·B41~B46 은 문구 칸 그대로", () => {
    const pairs: Array<[string, number]> = [
      [T.B37_HELD_HEAD, 37],
      [T.B38_HELD_GATE_FAILED, 38],
      [T.B39_HELD_TIMEOUT, 39],
      [T.B41_HELD_NO_KEY, 41],
      [T.B42_HELD_BUDGET, 42],
      [T.B43_HELD_JOB_LIMIT, 43],
      [T.B44_HELD_NO_MATERIAL, 44],
      [T.B45_LOCK_HELD, 45],
      [T.B46_LOCK_NO_RECORD, 46],
    ];
    for (const [text, n] of pairs) expect(text, `B${n}`).toBe(B(n));
  });

  it("B40 두 글, B47·B48 틀(예 앞부분)", () => {
    expect(B(40)).toBe(`다시 만들기가 있을 때: ${T.B40_HELD_JUDGE_ERROR_RETRY} / 없을 때: ${T.B40_HELD_JUDGE_ERROR}`);
    expect(B(47).startsWith(`${T.B47_JUDGE_MODEL} / 예: `)).toBe(true);
    expect(T.B48_SERVER_REJECTED).toBe(B(48));
  });
});

describe("작업 조회 — judging 단계", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("stage judging → running/judging(모르는 단계로 '대기 중'에 떨어지지 않음)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ status: "running", stage: "judging" }) }) as unknown as Response),
    );
    expect(await fetchNarrativeJob("j")).toEqual({ kind: "running", stage: "judging" });
  });
});
