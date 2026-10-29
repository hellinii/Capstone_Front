/**
 * 판 4 부록 1 — 심판 라운드 J7(계획 15-1·15-2·15-4).
 *
 * - 문안: 상수가 고정 문구 사본(3절 요약 표·필수 내용 18개·B49~B58)과 예시본 부록 1 원문 줄에 글자 그대로 있다.
 * - 셈과 갈래: 1.1 세 자리 따로·목적별 0개·빠진 목록 순서·지연시간 겹침, 1.2 14번(신뢰구간 유무)·목적별 0개, 1.3 B53·B55·축 빼기,
 *   멀티레이블 "클래스→레이블".
 * - 재료 선택 점검 판 4 행(충족시킨 지표·일부 빠짐) — 판정할 때 함께 낸다. 판 3 결과에는 키가 없다.
 * - 금지어: 부록 글에 AI·LLM·심판·모델 이름·이모지·성적서를 판정하는 말·옛 이름("점검 표"·"체크리스트")이 없다.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildAppendix1, COVERAGE_ITEMS, MISSING_LEAD, SUMMARY_TEXT } from "./appendix";
import * as A from "./appendixText";
import { loadEd4 } from "../../../test/edition4/render/ed4Fixtures";
import { checkMaterialSelection, type MaterialCheckInput } from "../materialCheck";
import type { Appendix1Ed4, FinalReportData } from "../../../types/finalReport.types";
import type { JudgeBundle } from "../judgeBundle";

const WORDING = JSON.parse(readFileSync(resolve(__dirname, "../../../test/edition4/fixedWording.ed4.json"), "utf8"));
const B = (n: number): string => WORDING.appendixB_raw[`B${n}`].candidate;
const EXAMPLE_LINES: string[] = WORDING.appendix1.example_lines;
const EX = EXAMPLE_LINES.join("\n");

const copy = <T>(x: T): T => structuredClone(x);
const bc = () => loadEd4("bc_strong", "final");
const judgeOf = (d: FinalReportData) => d.judge as JudgeBundle;
const build = (d: FinalReportData, j: JudgeBundle | undefined = judgeOf(d)) => buildAppendix1(d, j) as Appendix1Ed4;
const allText = (a: Appendix1Ed4) =>
  [a.summary, ...a.missing, a.outsideHead, a.purposeNote ?? "", a.inputRecord, a.checklistNote ?? "", ...a.method,
    ...[...a.reporting, ...a.outside, ...a.purpose].flatMap((r) => [r.name, r.middle, r.result]),
    ...a.axes.flat(), ...a.checklist.flat()].join("\n");

describe("문안 = 고정 문구 사본·예시본 부록 1 글자", () => {
  it("머리 문장·소제목·표 제목·표 머리·1.4 줄·결과 글은 예시본 부록 1 원문 줄에 있다", () => {
    expect(EXAMPLE_LINES[0]).toBe(`## ${A.APPENDIX_TITLE}`);
    expect(EXAMPLE_LINES).toContain(A.APPENDIX_LEAD);
    for (const t of Object.values(A.APPENDIX_TITLES)) expect(EXAMPLE_LINES).toContain(`### ${t}`);
    for (const t of [A.APPENDIX_REPORTING_TITLE, A.APPENDIX_PURPOSE_TITLE, A.APPENDIX_RECORD_TITLE, A.APPENDIX_AXES_TITLE, A.APPENDIX_CHECKLIST_TITLE]) {
      expect(EXAMPLE_LINES).toContain(t);
    }
    const head = (cols: readonly string[]) => `| ${cols.join(" | ")} |`;
    for (const cols of [A.APPENDIX_REPORTING_COLUMNS, A.APPENDIX_OUTSIDE_COLUMNS, A.APPENDIX_PURPOSE_COLUMNS, A.APPENDIX_RECORD_COLUMNS, A.APPENDIX_AXES_COLUMNS, A.APPENDIX_CHECKLIST_COLUMNS]) {
      expect(EXAMPLE_LINES).toContain(head(cols));
    }
    expect(EXAMPLE_LINES).toContain(A.APPENDIX_OUTSIDE_HEAD.replace("{n}", "3"));
    expect(EXAMPLE_LINES).toContain(A.APPENDIX_PURPOSE_NOT_APPLIED.replace("{n}", "3"));
    expect(EXAMPLE_LINES).toContain(A.APPENDIX_COVERAGE_NOT_APPLIED.replace("{n}", "2"));
    expect(EXAMPLE_LINES).toContain(`| ${A.APPENDIX_RECORD_ACK} | 확인 후 진행 (2026-10-22 18:45) |`);
    expect(EXAMPLE_LINES).toContain(`| ${A.OUTSIDE_13.name} | — | ${A.OUTSIDE_13.notApplicable} |`);
    expect(EXAMPLE_LINES).toContain(`| ${A.OUTSIDE_12.name} | — | ${A.OUTSIDE_12.notApplicable} |`);
    expect(EXAMPLE_LINES).toContain(`| ${A.OUTSIDE_14.name} | ${A.OUTSIDE_14_PLACE} | ${A.OUTSIDE_14.recorded} |`);
    for (const k of ["faithfulness", "consistency", "coverage", "readability"] as const) {
      expect(EX).toContain(`| ${A.AXIS_ROWS[k].name} | ${A.AXIS_ROWS[k].what} |`);
    }
    expect(EX).toContain(`| ${A.AXIS_ROWS.faithfulness.all} |`);
    expect(EX).toContain(`| ${A.AXIS_ROWS.consistency.all} |`);
    expect(EX).toContain(`| 16개 | ${A.AXIS_ROWS.coverage.all} |`);
    expect(EXAMPLE_LINES).toContain(`- ${A.METHOD_RULES.replace("{v}(으)로", "2.0으로")}`);
    for (const t of [A.METHOD_AUTOMATIC, A.METHOD_TARGET]) expect(EXAMPLE_LINES).toContain(`- ${t}`);
    expect(EXAMPLE_LINES).toContain(`- ${A.METHOD_CRITERIA.replace("{버전}", "1.0")}`);
    const fn = A.PURPOSE_ROW_TEXT.riskFN;
    expect(EXAMPLE_LINES).toContain(`| ${fn.name} | ${fn.need} | 충족 (Recall) |`);
    // 예시본 보고 항목 표의 실린 곳 = 판 4 자리 대응표(1~11번).
    for (const [item, place] of Object.entries(A.REPORTING_PLACE_ED4)) {
      if (Number(item) === 12) continue;
      const row = EXAMPLE_LINES.find((l) => l.startsWith("| ") && l.split("|")[2]?.trim() === place);
      expect(row, `항목 ${item}`).toBeTruthy();
    }
  });

  it("1.1 요약 문장 세 자리·빠진 목록 머리 = 고정 문구 3절", () => {
    const s = WORDING.appendix1.summary;
    expect(SUMMARY_TEXT.reporting).toEqual(s["보고 항목"]);
    expect(SUMMARY_TEXT.purpose).toEqual(s["목적별 점검"]);
    expect(SUMMARY_TEXT.coverage).toEqual(s["필수 내용"]);
    expect(MISSING_LEAD).toBe(WORDING.appendix1.missing_lead);
  });

  it("필수 내용 18개의 고객용 이름·영향 문장 = 고정 문구 3절 표(순서까지)", () => {
    expect(COVERAGE_ITEMS.map((c) => c.id)).toEqual(Object.keys(WORDING.appendix1.coverage));
    for (const c of COVERAGE_ITEMS) expect({ name: c.name, impact: c.impact }).toEqual(WORDING.appendix1.coverage[c.id]);
  });

  it("B49~B56 = 고정 문구 1.1 표 문구 칸", () => {
    expect(B(49).startsWith(`${A.B49_PARTIAL} / 예: `)).toBe(true);
    expect(B(50)).toBe(`실린 곳 "${A.APPENDIX_NONE_PLACE}", 결과 "${A.B50_NO_CI}"`);
    expect(B(51).startsWith(`${A.B51_MET.replace("{지표 이름}", "{지표 이름}, {지표 이름}")} / 예: `)).toBe(true);
    expect(B(52)).toBe(A.B52_NO_PURPOSE);
    expect(B(53).startsWith(`${A.B53_FAITHFULNESS} / 예: `)).toBe(true);
    expect(B(55).startsWith(`${A.B55_COVERAGE} / `)).toBe(true);
    expect(B(55)).toContain("체크리스트는 항목마다 찍힌 자리");
    expect(B(56)).toBe(`${A.B56_RULES.replace("{n}", "2")} | ${A.B56_VIOLATIONS}`);
  });
});

describe("bc_strong(예시본 갈래) — 부록 1 글 정확값", () => {
  const a = build(bc());

  it("1.1 — 11개 중 10개 · 목적별 1개 모두 · 필수 16개 모두, 빠진 목록은 지연시간 한 줄", () => {
    expect(a.summary).toBe(
      "이 성적서는 TS 4213 보고 항목 11개 중 10개를 제공받았고, 목적별 점검 1개를 모두 충족하였으며, 적용되는 필수 내용 16개를 모두 서술하였다.",
    );
    expect(a.missing).toEqual(["추론 효율성(지연시간): 응답 속도가 용도에 맞는지 판단할 수 없다."]);
  });

  it("1.3 — 검사 건수·결과(합성 묶음 81·33·16·2/0), 체크리스트는 묶음의 자리 그대로", () => {
    expect(a.axes).toEqual([
      ["사실 일치", A.AXIS_ROWS.faithfulness.what, "81건", "모두 일치"],
      ["일관성", A.AXIS_ROWS.consistency.what, "33건", "모순 없음"],
      ["필수 내용", A.AXIS_ROWS.coverage.what, "16개", "모두 서술"],
      ["표기", A.AXIS_ROWS.readability.what, "코드 규칙 2개", "위반 0건"],
    ]);
    expect(a.checklist.find(([n]) => n === "지표별 기준 충족 정도")).toEqual(["지표별 기준 충족 정도", "5.4, 5.5"]);
    expect(a.checklistNote).toBe("이 성적서에 적용되지 않는 필수 내용 2개는 싣지 않았다.");
  });

  it("1.4 — 입력 점검 규칙·점검 기준 버전이 찍힌다", () => {
    expect(a.method[0]).toBe("1~4절은 입력 점검 규칙 2.0으로 점검하였다.");
    expect(a.method[3]).toBe("5~6절 점검 기준은 v1.0이다.");
  });
});

describe("만들지 않는 경우 — 부록 자리 비움(B58)", () => {
  it("판 3·묶음 없음·보류·건수 없음·재료 선택 점검 판 4 행 없음 → null", () => {
    const d = bc();
    expect(buildAppendix1({ ...d, contentSchema: 3 }, judgeOf(d))).toBeNull();
    expect(buildAppendix1(d, undefined)).toBeNull();
    expect(buildAppendix1(d, { ...judgeOf(d), gate: "held", heldKind: "gate_failed", counts: null })).toBeNull();
    expect(buildAppendix1(d, { ...judgeOf(d), counts: null })).toBeNull();
    const noRows = copy(d);
    delete noRows.materialCheck!.printed.appendix;
    expect(buildAppendix1(noRows, judgeOf(d))).toBeNull();
  });
});

describe("갈래 — 예시본에 없는 것(B49~B58)", () => {
  it("1.1 세 자리는 따로 고른다 — 보고 항목은 모두, 필수 내용은 일부", () => {
    const d = copy(bc());
    d.materialCheck!.reporting.provided = d.materialCheck!.reporting.total;
    d.materialCheck!.reporting.items = d.materialCheck!.reporting.items.map((i) => ({ ...i, provided: true, missing: [] }));
    d.materialCheck!.printed.impacts = [];
    const j = copy(judgeOf(d));
    j.counts!.coverage!.described = 14;
    j.counts!.coverage!.items[0].described = false;
    j.counts!.coverage!.items[0].place = null;
    j.counts!.coverage!.items[15].described = false;
    j.counts!.coverage!.items[15].place = null;
    const a = build(d, j);
    expect(a.summary).toBe(
      "이 성적서는 TS 4213 보고 항목 11개를 모두 제공받았고, 목적별 점검 1개를 모두 충족하였으며, 적용되는 필수 내용 16개 중 14개를 서술하였다.",
    );
    expect(a.axes[2][3]).toBe("적용 16항목 중 14항목 서술됨 (해당 없음 2)");
    expect(a.checklist[0]).toEqual(["가장 약한 클래스", "서술되지 않음"]);
    // 빠진 목록: 필수 내용 줄만(기준 순서), 고객용 이름·영향 문장.
    expect(a.missing).toEqual([
      "가장 약한 클래스: 가장 약한 클래스와 그 값은 4.4 표에만 있고 소견에서 해석하지 않았다.",
      "권고의 기대 효과: 권고를 따르면 무엇이 나아지는지 설명하지 않았다.",
    ]);
  });

  it("빠진 목록 순서 — 보고 항목 줄 → 목적별 줄 → 필수 내용 줄", () => {
    const d = copy(bc());
    d.materialCheck!.purpose = {
      applicable: 1,
      met: 0,
      lines: [{ id: "riskDirection", met: false, title: "위험 방향 → 재현율·정밀도", declared: "FN", recommended: ["M3"], shortfall: "위험 영향." }],
    };
    const j = copy(judgeOf(d));
    j.counts!.coverage!.items[0] = { id: "분석-1", described: false, place: null };
    j.counts!.coverage!.described -= 1;
    expect(build(d, j).missing).toEqual([
      "추론 효율성(지연시간): 응답 속도가 용도에 맞는지 판단할 수 없다.",
      "위험 방향 → 재현율·정밀도: 위험 영향.",
      "가장 약한 클래스: 가장 약한 클래스와 그 값은 4.4 표에만 있고 소견에서 해석하지 않았다.",
    ]);
  });

  it("서술되지 않은 항목은 자리가 와도 '서술되지 않음'(묶음 계약은 null 이지만 닫힌 쪽)", () => {
    const j = copy(judgeOf(bc()));
    j.counts!.coverage!.items[0] = { id: "분석-1", described: false, place: "5.2" };
    expect(build(bc(), j).checklist[0]).toEqual(["가장 약한 클래스", "서술되지 않음"]);
  });

  it("목적별 점검 0개 — 1.1 목적별 구절을 빼고, 1.2 는 표 없이 B52", () => {
    const d = copy(bc());
    d.materialCheck!.purpose = { applicable: 0, met: 0, lines: [] };
    d.materialCheck!.printed.appendix = { ...d.materialCheck!.printed.appendix!, purpose: [], purposeNotApplied: 4 };
    const a = build(d);
    expect(a.summary).toBe("이 성적서는 TS 4213 보고 항목 11개 중 10개를 제공받았고, 적용되는 필수 내용 16개를 모두 서술하였다.");
    expect(a.purpose).toEqual([]);
    expect(a.purposeNote).toBe(A.B52_NO_PURPOSE);
  });

  it("목적별 미충족 줄은 '{점검 이름}: {영향 문장}', 지연시간이 보고 항목 8번과 겹치면 보고 항목 줄 하나만", () => {
    const d = copy(bc());
    const lines = [
      { id: "latency", met: false, title: "사용 방식 → 지연시간", declared: "대화형", recommended: [], shortfall: "지연 영향." },
      { id: "riskDirection", met: false, title: "위험 방향 → 재현율·정밀도", declared: "FN", recommended: ["M3"], shortfall: "위험 영향." },
    ] as const;
    d.materialCheck!.purpose = { applicable: 2, met: 0, lines: lines.map((l) => ({ ...l, recommended: [...l.recommended] })) };
    const a = build(d);
    expect(a.missing).toEqual([
      "추론 효율성(지연시간): 응답 속도가 용도에 맞는지 판단할 수 없다.",
      "위험 방향 → 재현율·정밀도: 위험 영향.",
    ]);
  });

  it("신뢰구간이 없으면 14번 줄은 '—' · B50", () => {
    const d = copy(bc());
    delete d.confidenceIntervalNote;
    expect(build(d).outside.at(-1)).toEqual({ name: A.OUTSIDE_14.name, middle: "—", result: A.B50_NO_CI });
    expect(build(bc()).outside.at(-1)).toEqual({ name: A.OUTSIDE_14.name, middle: "1.3", result: A.OUTSIDE_14.recorded });
  });

  it("사실 일치가 전부 일치가 아니면 B53, 모순이 있으면 '모순 n건'(통과 성적서에는 나오지 않음 — 닫힌 쪽 대비)", () => {
    const j = copy(judgeOf(bc()));
    j.counts!.faithfulness = { checked: 81, matched: 80 };
    j.counts!.consistency = { checked: 33, contradictions: 1 };
    const a = build(bc(), j);
    expect(a.axes[0][3]).toBe("81건 중 80건 일치");
    expect(a.axes[1][3]).toBe("모순 1건");
  });

  it("축을 빼면(7.7) 그 행이 빠지고, 필수 내용 축이면 체크리스트·1.1 구절도 함께 빠진다", () => {
    const j = copy(judgeOf(bc()));
    j.axes = ["faithfulness", "consistency", "readability"];
    delete j.counts!.coverage;
    const a = build(bc(), j);
    expect(a.axes.map((r) => r[0])).toEqual(["사실 일치", "일관성", "표기"]);
    expect(a.checklist).toEqual([]);
    expect(a.checklistNote).toBeNull();
    expect(a.summary).toBe("이 성적서는 TS 4213 보고 항목 11개 중 10개를 제공받았고, 목적별 점검 1개를 모두 충족하였다.");
  });

  it("멀티레이블은 필수 내용 이름·영향 문장의 '클래스'를 '레이블'로(체크리스트·1.1)", () => {
    const y = loadEd4("yeast_strong", "final");
    const j = copy(judgeOf(y));
    j.counts!.coverage!.items[0] = { id: "분석-1", described: false, place: null };
    j.counts!.coverage!.described -= 1;
    const a = build(y, j);
    expect(a.checklist[0]).toEqual(["가장 약한 레이블", "서술되지 않음"]);
    // 조사도 끝소리에 맞춘다("클래스와" → "레이블과").
    expect(a.missing).toContain("가장 약한 레이블: 가장 약한 레이블과 그 값은 4.4 표에만 있고 소견에서 해석하지 않았다.");
    expect(allText(a)).not.toMatch(/가장 약한 클래스/);
  });
});

describe("재료 선택 점검 판 4 행(15-1) — 판정할 때 함께", () => {
  const base = (over: Partial<MaterialCheckInput>): MaterialCheckInput => ({
    taskType: "binary",
    materials: bc().materials!,
    systemSpec: { os: "a", cpu: "b", gpu: "c", memory: "d", software: "e" },
    latencyMapped: true,
    perspective: { criticalErrorType: { text: "Missed (FN)" }, usageMode: { text: "Batch" } } as never,
    selectedMetricIds: ["M1", "M5", "M3"],
    beta: 2,
    imbalanceRatio: 1.5,
    distributionSource: "validation",
    edition: 4,
    ...over,
  });

  it("충족시킨 지표는 의뢰자가 고른 순서로(B51) — Fβ(β>1)와 Recall 둘 다", async () => {
    const r = checkMaterialSelection(base({}));
    const { METRICS } = await import("../../../data/evaluationData");
    const fbeta = METRICS.find((m) => m.id === "M5")!.name;
    expect(r.printed.appendix!.purpose).toEqual([
      { name: "위험 방향이 FN", middle: "재현율 또는 β가 1보다 큰 Fβ", result: `충족 (${fbeta}, Recall)` },
    ]);
    // β 가 1 이하면 Fβ 는 FN 쪽 충족 지표가 아니다 — Recall 만.
    expect(checkMaterialSelection(base({ beta: 0.5 })).printed.appendix!.purpose[0].result).toBe("충족 (Recall)");
    expect(r.printed.appendix!.purposeNotApplied).toBe(3);
  });

  it("FP 갈래·미충족(β 가 맞지 않음)", () => {
    const r = checkMaterialSelection(
      base({ perspective: { criticalErrorType: { text: "False alarm (FP)" }, usageMode: { text: "Batch" } } as never, selectedMetricIds: ["M1", "M5"], beta: 2 }),
    );
    expect(r.printed.appendix!.purpose).toEqual([{ name: "위험 방향이 FP", middle: "정밀도 또는 β가 1보다 작은 Fβ", result: "미충족" }]);
  });

  it("판 3 결과에는 부록 행이 없다(판 3 보관본 모양 그대로)", () => {
    expect(checkMaterialSelection(base({ edition: 3 })).printed).not.toHaveProperty("appendix");
    expect(checkMaterialSelection(base({ edition: undefined })).printed).not.toHaveProperty("appendix");
  });

  it("여러 칸 항목이 일부만 빠지면 B49(빠진 칸을 쉼표로), 통째로 빠지면 '제공되지 않음'", () => {
    const r = checkMaterialSelection(base({ systemSpec: { os: "a", cpu: "b", gpu: "", memory: "", software: "e" } }));
    expect(r.printed.appendix!.reporting.find((x) => x.name === "추론 환경")).toEqual({
      name: "추론 환경",
      middle: "2.1",
      result: "제공되지 않음 (빠진 것: GPU, 메모리)",
    });
    const none = checkMaterialSelection(base({ latencyMapped: false }));
    expect(none.printed.appendix!.reporting.find((x) => x.name === "추론 효율성(지연시간)")!.result).toBe("제공되지 않음");
  });

  it("점검 수 밖 줄 — 이진 13·12, 다중 13 '기재'·12, 멀티레이블 13 만(12 는 보고 항목 표에)", () => {
    const names = (t: MaterialCheckInput["taskType"]) =>
      checkMaterialSelection(base({ taskType: t })).printed.appendix!.outside.map((r) => [r.name, r.middle, r.result]);
    expect(names("binary")).toEqual([
      [A.OUTSIDE_13.name, "—", A.OUTSIDE_13.notApplicable],
      [A.OUTSIDE_12.name, "—", A.OUTSIDE_12.notApplicable],
    ]);
    expect(names("multiclass")[0]).toEqual([A.OUTSIDE_13.name, "3.3", A.OUTSIDE_13.recorded]);
    expect(names("multilabel")).toEqual([[A.OUTSIDE_13.name, "—", A.OUTSIDE_13.notApplicable]]);
  });
});

describe("금지어 — 부록 글(세 픽스처)", () => {
  it.each(["bc_strong", "digits_strong", "yeast_strong"] as const)("%s", (tag) => {
    const d = loadEd4(tag, "final");
    const text = allText(build(d)) + "\n" + [A.APPENDIX_TITLE, A.APPENDIX_LEAD, ...Object.values(A.APPENDIX_TITLES)].join("\n");
    expect(text).not.toMatch(/\bAI\b|LLM|심판|gpt|claude|sonnet|sol\b/i);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(text).not.toMatch(/좋음|나쁨|불완전|우수|미흡/);
    expect(text).not.toMatch(/점검 표|체크리스트/);
    expect(text).toContain("입력 점검 규칙");
    expect(text).toContain("점검 기준");
  });
});
