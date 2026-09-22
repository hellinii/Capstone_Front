import { describe, it, expect } from "vitest";
import { nextVersionName } from "./nextVersionName";

describe("nextVersionName — 'New version' 이 제안하는 다음 이름", () => {
  it("semver 의 맨 끝 자리를 올린다", () => {
    expect(nextVersionName("v1.0.0")).toBe("v1.0.1");
    expect(nextVersionName("v1.2.9")).toBe("v1.2.10");
  });

  it("두 자리 버전도 맨 끝을 올린다", () => {
    expect(nextVersionName("v1.0")).toBe("v1.1");
    expect(nextVersionName("2.3")).toBe("2.4");
  });

  it("접두사 유무와 무관하게 동작한다", () => {
    expect(nextVersionName("1.0.0")).toBe("1.0.1");
    expect(nextVersionName("release-7")).toBe("release-8");
  });

  it("숫자 뒤에 붙은 꼬리표를 보존한다", () => {
    expect(nextVersionName("v2.0-beta")).toBe("v2.1-beta");
  });

  it("앞자리 0 의 자릿수를 유지한다", () => {
    expect(nextVersionName("v1.09")).toBe("v1.10");
    expect(nextVersionName("build-007")).toBe("build-008");
  });

  it("숫자가 없는 이름은 그대로 둔다(틀린 추측보다 무동작이 낫다)", () => {
    expect(nextVersionName("baseline")).toBe("baseline");
    expect(nextVersionName("final")).toBe("final");
  });

  it("비어 있으면 첫 버전을 제안한다", () => {
    expect(nextVersionName("")).toBe("v1.0.0");
    expect(nextVersionName("   ")).toBe("v1.0.0");
  });
});
