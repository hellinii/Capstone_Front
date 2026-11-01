/**
 * 심판 읽기 재료(judgeMaterialEd4.ts)와 요청에 붙이기(narrativeRequest.attachJudgeMaterial) — 심판 라운드 J2 ②.
 *
 * - 재료 글자 = 성적서 화면이 찍는 글자(같은 그리기 함수를 부른다 — 여기서는 저장된 판 4 픽스처로 몇 자리를 맞댄다).
 * - 판 3 요청은 그대로(같은 객체), 판 4 요청에는 맨 끝 키로 붙는다. 재료 상한·본문 예산을 넘으면 붙이지 않는다.
 * - 계약 사본(src/test/contract/judge_material_ed4.json)은 sha256 고정, 옆 저장소가 있으면 바이트 대조.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadEd4, type Ed4Tag } from "../../../test/edition4/render/ed4Fixtures";
import type { NarrativeRequestPayload } from "../buildFactSheet";
import { NARRATIVE_BODY_BUDGET_BYTES } from "../factSheetLimits";
import { attachJudgeMaterial } from "../narrativeRequest";
import { ed4RecommendRows } from "./render/recommendEd4";
import { buildJudgeMaterialEd4, MAX_JUDGE_MATERIAL_CHARS } from "./judgeMaterialEd4";

const TAGS: Ed4Tag[] = ["bc_strong", "digits_strong", "yeast_strong"];
const CONTRACT = resolve(__dirname, "../../../test/contract/judge_material_ed4.json");
const BACKEND_COPY = resolve(__dirname, "../../../../../Capstone_Back/tests/contract/judge_material_ed4.json");
/** 심판 라운드 J2 ②(2026-10-29)에 만든 바이트. 백엔드 tests/test_judge_material.py MATERIAL_SHA256 과 같은 값이다. */
const CONTRACT_SHA256 = createHash("sha256").update(readFileSync(CONTRACT)).digest("hex");

describe.each(TAGS)("재료 글자 = 화면 글자(%s)", (tag) => {
  const data = loadEd4(tag, "final");
  const mat = buildJudgeMaterialEd4(data);
  const seg = (id: string) => mat.segments.find((s) => s.id === id);

  it("판·점검 표 버전·조각이 있다", () => {
    expect(mat.version).toBe("judge-material-1");
    expect(mat.material_check_version).toBe(data.materialCheck?.version ?? null);
    expect(mat.segments.length).toBeGreaterThan(5);
    expect(new Set(mat.segments.map((s) => s.id)).size).toBe(mat.segments.length);
  });

  it("4.2 표·근거, 고정 17 은 저장된 글 그대로", () => {
    const v = data.edition4Values!.verdict;
    expect(seg("4.2-table")!.rows).toEqual([[v.label, v.countText]]);
    expect(seg("4.2-basis")!.text).toBe(v.basis);
    expect(seg("4.4-fixed17")!.text).toBe(data.errorRatioSentence);
  });

  it("권고표 줄은 화면 권고표의 앞 두 칸과 같고 문제 번호가 붙는다", () => {
    const rows = mat.segments.filter((s) => s.kind === "recommend_rows");
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const side = r.place === "6.1" ? "9.1" : "9.2";
      const mine = (data.problems ?? []).filter((p) => p.recommend_section === side);
      const screen = ed4RecommendRows(data, mine).map((row) => [row[0], row[1]]);
      // 화면은 문제마다 권고 수만큼 줄을 찍는다 — 재료는 문제마다 한 줄(백엔드가 권고 수만큼 펼친다)
      expect(r.rows).toEqual(mine.map((p) => screen.find((s) => s[1].startsWith(`${p.id} `))));
      expect(r.row_keys).toEqual(mine.map((p) => p.id));
    }
  });

  it("빈 칸 고정 문구는 slot_empty, 숫자 칸 이름은 계약 어휘", () => {
    expect(seg("5.4-b18")!.when).toBe("slot_empty");
    expect(seg("5.6-fixed15")!.when).toBe("slot_empty");
    const vocab = Object.keys(JSON.parse(readFileSync(CONTRACT, "utf8")).number_fields).map((k) => k.split("<")[0]);
    const fields = mat.segments.flatMap((s) => s.numbers.map((n) => n.field));
    expect(fields.length).toBeGreaterThan(0);
    for (const f of fields) expect([f, vocab.some((p) => f!.startsWith(p))]).toEqual([f, true]);
    // 숫자 글자는 그 조각의 글·칸 어딘가에 찍혀 있다
    for (const s of mat.segments) {
      const printed = [s.text ?? "", ...(s.rows ?? []).flat()].join("\n");
      for (const n of s.numbers) expect([s.id, n.text, printed.includes(n.text)]).toEqual([s.id, n.text, true]);
    }
  });
});

describe("요청에 붙이기", () => {
  const data = loadEd4("bc_strong", "final");
  const base = (edition?: 4): NarrativeRequestPayload => ({
    task_type: "binary",
    report_purpose: "external",
    ...(edition ? { report_edition: edition } : {}),
    fact_sheet: {} as NarrativeRequestPayload["fact_sheet"],
  });

  it("판 3 요청은 그대로(같은 객체)", () => {
    const p = base();
    expect(attachJudgeMaterial(p, data)).toBe(p);
  });

  it("판 4 요청은 맨 끝 키로 붙는다", () => {
    const out = attachJudgeMaterial(base(4), data);
    expect(Object.keys(out)).toEqual(["task_type", "report_purpose", "report_edition", "fact_sheet", "judge_material"]);
    expect(out.judge_material).toEqual(buildJudgeMaterialEd4(data));
  });

  it("붙이면 본문 예산을 넘으면 붙이지 않는다", () => {
    const big = { ...base(4), client_inputs: { pad: "x".repeat(NARRATIVE_BODY_BUDGET_BYTES - 2000) } };
    expect(attachJudgeMaterial(big, data)).toBe(big);
  });

  it("재료가 상한을 넘으면 붙이지 않는다", () => {
    const huge = { ...data, errorRatioSentence: "가".repeat(MAX_JUDGE_MATERIAL_CHARS) };
    const p = base(4);
    expect(attachJudgeMaterial(p, huge)).toBe(p);
  });
});

describe("계약 사본", () => {
  it("sha256 고정(백엔드 시험과 같은 값)", () => {
    expect(CONTRACT_SHA256).toBe("bc32c9ecdfec3f3fe4de03a254525a361e3b534dae53b94df780f2de33474e63");
  });

  it.skipIf(!existsSync(BACKEND_COPY))("백엔드 사본과 바이트가 같다", () => {
    expect(readFileSync(BACKEND_COPY).equals(readFileSync(CONTRACT))).toBe(true);
  });
});
