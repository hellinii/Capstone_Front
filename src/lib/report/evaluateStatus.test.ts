import { describe, it, expect } from "vitest";
import { evaluateStatus } from "./evaluateStatus";

describe("evaluateStatus (D1 방향 인지 판정)", () => {
  it("높을수록 좋음: 값 ≥ 목표 → pass (경계 동률 포함)", () => {
    expect(evaluateStatus(0.9, 0.8, true)).toBe("pass");
    expect(evaluateStatus(0.8, 0.8, true)).toBe("pass");
    expect(evaluateStatus(0.7, 0.8, true)).toBe("fail");
  });

  it("낮을수록 좋음(FPR/KL/Hamming/LogLoss 등): 값 ≤ 목표 → pass (경계 동률 포함)", () => {
    expect(evaluateStatus(0.05, 0.10, false)).toBe("pass");
    expect(evaluateStatus(0.10, 0.10, false)).toBe("pass");
    expect(evaluateStatus(0.30, 0.10, false)).toBe("fail");
  });
});
