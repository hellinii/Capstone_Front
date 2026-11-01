/**
 * 4.6 참조 범위 표 — 프론트가 찍는 줄과 백엔드 심판이 만드는 줄을 같은 표로 맞댄다(심판 라운드 J2 ③, 계획 정4).
 *
 * 4.6 표는 백엔드가 작업을 만들 때 계산한 참조 범위(benchmark_refs)로 그려서, 서술 요청을 보낼 때 프론트에 아직 없다. 그래서 심판이
 * 읽을 4.6 글은 백엔드(app/judge/reading.py ref_table_rows)가 자기 값으로 만든다. 그 글이 화면 글과 같은지를 이 대조 표로 본다.
 *
 * `src/test/contract/ref_table_ed4_cases.json` = 판 4 렌더 픽스처 셋(bc·digits·yeast strong final)의 참조 범위(백엔드 모양)와 화면
 * 줄(`benchmarkView`). 백엔드 tests/test_judge_reading.py 가 같은 참조 범위와 판 4 계약 예시의 지표로 같은 줄이 나오는지 본다.
 * 다시 뜨려면 `UPDATE_REF_TABLE=1 npx vitest run src/lib/report/edition4/refTableContract.test.ts`.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadEd4, type Ed4Tag } from "../../../test/edition4/render/ed4Fixtures";
import { benchmarkView } from "./render/resultsDetail";

const NAME = "ref_table_ed4_cases.json";
const PATH = resolve(__dirname, "../../../test/contract", NAME);
const BACKEND_COPY = resolve(__dirname, "../../../../../Capstone_Back/tests/contract", NAME);
const TAGS: Ed4Tag[] = ["bc_strong", "digits_strong", "yeast_strong"];
/** 심판 라운드 J2 ③(2026-10-29)에 뜬 바이트. 백엔드 tests/test_judge_reading.py 와 같은 값이다. */
const SHA256 = "85aa0cf782f19cd95abc4a6aeb2b12f1af54f729f090a8434b6765348e4e66a8";

function cases() {
  return TAGS.map((tag) => {
    const data = loadEd4(tag, "final");
    const refs = (data.conclusion?.benchmarkRefs ?? []).map((r) => ({
      metric: r.metric,
      model_value: r.modelValue,
      ref_low: r.refLow,
      ref_high: r.refHigh,
      direction: r.direction,
      quality: r.quality,
      target_value: r.targetValue ?? null,
      target_position: r.targetPosition ?? null,
      source_note: r.sourceNote,
    }));
    const view = benchmarkView(data);
    return { tag, refs, rows: view.table?.rows ?? [], notes: view.table?.notes ?? [] };
  });
}

describe("4.6 참조 범위 표 대조 표", () => {
  it("파일 = 지금 화면 줄(UPDATE_REF_TABLE=1 이면 다시 씀)", () => {
    const text = `${JSON.stringify({ name: "4.6 참조 범위 표 — 화면 줄", cases: cases() }, null, 2)}\n`;
    if (process.env.UPDATE_REF_TABLE === "1") writeFileSync(PATH, text);
    expect(readFileSync(PATH, "utf8")).toBe(text);
    expect(cases().every((c) => c.rows.length > 0)).toBe(true);
  });

  it("sha256 고정", () => {
    expect(createHash("sha256").update(readFileSync(PATH)).digest("hex")).toBe(SHA256);
  });

  it.skipIf(!existsSync(BACKEND_COPY))("백엔드 사본과 바이트가 같다", () => {
    expect(readFileSync(BACKEND_COPY).equals(readFileSync(PATH))).toBe(true);
  });
});
