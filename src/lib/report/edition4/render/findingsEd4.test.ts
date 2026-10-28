/** 판 4 5절 칸 배치 순수 함수(갈래 b5) — 칸→자리, 저장 문장 자리, 빈 칸 규칙, 배지 규칙. 그린 글 시험은 `Ed4Findings.test.tsx`. */
import { describe, expect, it } from "vitest";

import { loadEd4 } from "../../../../test/edition4/render/ed4Fixtures";
import type { FinalReportData } from "../../../../types/finalReport.types";
import { NARRATIVE_FAILED_TEXT, NARRATIVE_PENDING_TEXT } from "../../../../components/report/shared/narrativePlaceholder";
import { ed4AutoMarked, ed4FindingBlocks, ed4SlotBody } from "./findingsEd4";

const copy = (d: FinalReportData) => structuredClone(d);

describe("ed4FindingBlocks — 칸→자리(대응표 순서)", () => {
  it("bc_strong: 자리·칸 순서와 서술 글이 오는 저장 칸", () => {
    const data = loadEd4("bc_strong", "issued");
    const blocks = ed4FindingBlocks(data);
    expect(blocks.map((b) => [b.place, b.slot])).toEqual([
      ["5.1", "8.2"],
      ["5.2", "7.1"],
      ["5.3", "7.2"],
      ["5.4", "8.1"],
      ["5.5", "8.3"],
      ["5.6", "7.3"],
    ]);
    expect(blocks.map((b) => b.body)).toEqual([
      { kind: "narrative", text: data.conclusion.narrative },
      { kind: "narrative", text: data.interpretation.confusionAnalysis },
      { kind: "narrative", text: data.interpretation.distributionAnalysis },
      { kind: "narrative", text: data.conclusion.benchmark },
      { kind: "narrative", text: data.conclusion.risks },
      { kind: "narrative", text: data.interpretation.additionalObservations },
    ]);
    expect(blocks.map((b) => b.badge)).toEqual([null, null, null, null, null, null]);
  });

  it("11a 는 5.1 뒤에만, 12 는 5.3 앞에만(digits_strong)", () => {
    const data = loadEd4("digits_strong", "issued");
    const blocks = ed4FindingBlocks(data);
    expect(blocks.map((b) => b.after)).toEqual([[data.sourceRelationSentence], [], [], [], [], []]);
    expect(blocks.map((b) => b.before)).toEqual([[], [], [data.labelCautionSentence], [], [], []]);
  });

  it("저장 문장이 null·빈 글이면 자리도 비운다(yeast_strong 12 = null)", () => {
    const data = copy(loadEd4("yeast_strong", "issued"));
    expect(ed4FindingBlocks(data)[2].before).toEqual([]);
    data.sourceRelationSentence = "";
    expect(ed4FindingBlocks(data)[0].after).toEqual([]);
  });

  it("배지 — fallback 칸만(digits_strong 8.1), 대기·실패면 없음", () => {
    expect(ed4FindingBlocks(loadEd4("digits_strong", "issued")).map((b) => b.badge)).toEqual([null, null, null, "fallback", null, null]);
    const waiting = { ...copy(loadEd4("digits_strong", "issued")), narrativeSource: "failed" as const };
    expect(ed4FindingBlocks(waiting).map((b) => b.badge)).toEqual([null, null, null, null, null, null]);
  });

  it("7.3 빈 글 + 키 있음 → 고정 문구 15(yeast_strong)", () => {
    expect(ed4FindingBlocks(loadEd4("yeast_strong", "issued"))[5].body).toEqual({ kind: "fixed", text: "해당 없음" });
  });

  it("8.1 빈 글 + fixed → B18, 빈 글 + llm → 판 3 자리표시", () => {
    const data = copy(loadEd4("bc_strong", "issued"));
    data.conclusion.benchmark = "";
    expect(ed4FindingBlocks(data)[3].body).toEqual({
      kind: "placeholder",
      text: "자동 서술 생성 연동 예정 — 현재는 규칙 기반 판정·점수만 표시됩니다.",
    });
    data.narrativeSections = { ...data.narrativeSections, "8.1": "fixed" };
    expect(ed4FindingBlocks(data)[3].body).toEqual({ kind: "fixed", text: "해당 없음" });
  });
});

describe("ed4SlotBody — 판 3 NarrativeBlock 규칙", () => {
  const done = loadEd4("bc_strong", "issued");
  const pending = loadEd4("bc_strong", "pending");
  const failed = loadEd4("bc_strong", "failed");

  it("글이 있으면 서술(대기여도 글이 이긴다)", () => {
    expect(ed4SlotBody(pending, "글", "빈칸", "미작성(LLM)")).toEqual({ kind: "narrative", text: "글" });
  });

  it("빈 글(공백 포함): 끝남 + 빈 칸 문구 → 그 문구 / 대기·실패 → 대기·실패 글 / 빈 칸 문구 없음 → '(LLM)' 지운 미작성 글", () => {
    expect(ed4SlotBody(done, " \n", "빈칸", "미작성(LLM)")).toEqual({ kind: "fixed", text: "빈칸" });
    expect(ed4SlotBody(pending, "", "빈칸", "미작성(LLM)")).toEqual({ kind: "placeholder", text: NARRATIVE_PENDING_TEXT });
    expect(ed4SlotBody(failed, null, "빈칸", "미작성(LLM)")).toEqual({ kind: "placeholder", text: NARRATIVE_FAILED_TEXT });
    expect(ed4SlotBody(done, undefined, undefined, "미작성(LLM)")).toEqual({ kind: "placeholder", text: "미작성" });
  });
});

describe("자동 작성 표시(서술 설계 D54) — autoMarked 는 몸통이 서술 글일 때만", () => {
  it("ed4AutoMarked — 서술 글만 참, 빈 칸 고정 문구·자리표시는 거짓", () => {
    expect(ed4AutoMarked({ kind: "narrative", text: "글" })).toBe(true);
    expect(ed4AutoMarked({ kind: "fixed", text: "해당 없음" })).toBe(false);
    expect(ed4AutoMarked({ kind: "placeholder", text: NARRATIVE_PENDING_TEXT })).toBe(false);
  });

  it("AI 칸(bc_strong)·규칙 템플릿 대체 칸(digits_strong 8.1 fallback) 모두 긋는다", () => {
    expect(ed4FindingBlocks(loadEd4("bc_strong", "issued")).map((b) => b.autoMarked)).toEqual([true, true, true, true, true, true]);
    const digits = loadEd4("digits_strong", "issued");
    expect(digits.narrativeSections?.["8.1"]).toBe("fallback");
    expect(ed4FindingBlocks(digits).map((b) => b.autoMarked)).toEqual([true, true, true, true, true, true]);
  });

  it("빈 칸 고정 문구 — 15(yeast_strong 7.3 fixed)·B18(8.1 fixed)은 긋지 않는다", () => {
    expect(ed4FindingBlocks(loadEd4("yeast_strong", "issued")).map((b) => b.autoMarked)).toEqual([true, true, true, true, true, false]);
    const data = copy(loadEd4("bc_strong", "issued"));
    data.conclusion.benchmark = "";
    data.narrativeSections = { ...data.narrativeSections, "8.1": "fixed" };
    expect(ed4FindingBlocks(data).map((b) => b.autoMarked)).toEqual([true, true, true, false, true, true]);
  });

  it("자리표시 — 대기·실패·미작성(빈 글)에는 긋지 않는다", () => {
    expect(ed4FindingBlocks(loadEd4("bc_strong", "pending")).map((b) => b.autoMarked)).toEqual([false, false, false, false, false, false]);
    expect(ed4FindingBlocks(loadEd4("bc_strong", "failed")).map((b) => b.autoMarked)).toEqual([false, false, false, false, false, false]);
    const data = copy(loadEd4("bc_strong", "issued"));
    data.interpretation.confusionAnalysis = " ";
    expect(ed4FindingBlocks(data).map((b) => b.autoMarked)).toEqual([true, false, true, true, true, true]);
  });
});
