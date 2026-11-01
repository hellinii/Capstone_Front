/**
 * 판 4 서술 작업 결과의 고객용 심판 묶음 — 계약 초안(심판 라운드 J1 ④, 계획 14-2).
 *
 * `src/test/contract/judge_bundle_ed4.json` 이 계약이다. 백엔드 `tests/contract/` 에 같은 바이트가 있고 백엔드
 * `tests/test_judge_bundle_contract.py` 가 같은 sha256 과 계약의 맞물림을 본다. 프론트가 이 묶음을 읽어 잠금·작성 기록·부록을
 * 정하는 코드는 J6·J7 에 이 계약의 예시로 시험한다. 지금은 바이트 고정과 옆 저장소 대조만 한다.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const NAME = "judge_bundle_ed4.json";
const PATH = resolve(__dirname, "../../test/contract", NAME);
const BACKEND_COPY = resolve(__dirname, "../../../../Capstone_Back/tests/contract", NAME);

/** 심판 라운드 J1 ④(2026-10-29)에 만든 바이트. 백엔드 tests/test_judge_bundle_contract.py 와 같은 값이다. */
const SHA256 = "e4bc794868a7bb8cc781765ae383c2de647328d434986a6cb245bdccb6d1c25e";

describe("심판 묶음 계약(판 4)", () => {
  it("바이트가 sha256 으로 고정돼 있다", () => {
    expect(createHash("sha256").update(readFileSync(PATH)).digest("hex")).toBe(SHA256);
  });

  it("예시 두 개(통과·보류)와 보류 종류 목록이 있다", () => {
    const c = JSON.parse(readFileSync(PATH, "utf8"));
    expect(Object.keys(c.examples)).toEqual(["passed", "held"]);
    expect(c.examples.passed.gate).toBe("passed");
    expect(c.examples.held.gate).toBe("held");
    expect(Object.keys(c.held_kinds)).toContain(c.examples.held.held_kind);
  });

  it.skipIf(!existsSync(BACKEND_COPY))("백엔드 사본과 바이트가 같다", () => {
    expect(readFileSync(BACKEND_COPY).equals(readFileSync(PATH))).toBe(true);
  });
});
