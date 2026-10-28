/**
 * 시험기관 주소·이메일(심판 라운드 1단계, 서술 설계 D48·재료 목록 "시험기관 정보" 행) — 값은 예시본과 같은 글자, 판 4 run 을 만들 때
 * `performer` 에 찍고, 발급 기록을 덧입혀도(`applyIssuance`) 저장값을 그대로 둔다. 판 3 데이터에는 키를 더하지 않는다.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadEd4, loadEd4Issuance } from "../../../test/edition4/render/ed4Fixtures";
import type { FinalReportData } from "../../../types/finalReport.types";
import { applyIssuance, type IssuanceResult } from "../issuanceApi";
import { DEFAULT_PERFORMER } from "../reportConstants";
import { ED4_INSTITUTION_CONTACT, performerEd4 } from "./institutionEd4";

const EXAMPLE = readFileSync(resolve(__dirname, "../../../test/edition4/rpt0001/example.md"), "utf8").split("\n");

describe("값 — 재료 목록 고정값 = 예시본 글자", () => {
  it("주소·이메일(손으로 옮겨 적은 재료 목록 값)", () => {
    expect(ED4_INSTITUTION_CONTACT).toEqual({ address: "서울특별시 중구 시험로 123, 4층", email: "contact@litmus.example" });
  });

  it("예시본 표지 발급 기관 줄과 1.1 시험기관 표 두 행에 같은 글자", () => {
    const { address, email } = ED4_INSTITUTION_CONTACT;
    expect(EXAMPLE).toContain(`발급 기관: ${DEFAULT_PERFORMER.orgName} (${address}, ${email})`);
    expect(EXAMPLE).toContain(`| 주소 | ${address} |`);
    expect(EXAMPLE).toContain(`| 이메일 | ${email} |`);
  });

  it("performerEd4 = 판 3 수행기관 + 주소·이메일(전화 칸 없음), 부를 때마다 새 객체", () => {
    expect(performerEd4()).toEqual({ ...DEFAULT_PERFORMER, ...ED4_INSTITUTION_CONTACT });
    expect(Object.keys(performerEd4()).sort()).toEqual(["address", "contact", "email", "evaluator", "orgName"]);
    expect(performerEd4()).not.toBe(performerEd4());
    expect(DEFAULT_PERFORMER).not.toHaveProperty("address");
  });
});

describe("applyIssuance — 발급 기록을 덧입혀도 저장된 주소·이메일 그대로", () => {
  const issuanceWith = (address: string | null): IssuanceResult => {
    const r = structuredClone(loadEd4Issuance("bc_strong"));
    r.organization.address = address;
    return r;
  };

  it("판 4 run — 서버 기관 행의 address 가 있어도 저장값, 없어도 저장값", () => {
    const final = loadEd4("bc_strong", "final");
    for (const address of ["서버에 적힌 다른 주소", null]) {
      const out = applyIssuance(final, issuanceWith(address));
      expect(out.performer.address).toBe("서울특별시 중구 시험로 123, 4층");
      expect(out.performer.email).toBe("contact@litmus.example");
      expect(out.performer.orgName).toBe("리트머스");
    }
  });

  it("주소·이메일 칸이 없는 데이터(판 3·옛 판 4)에는 키를 더하지 않는다 — 서버 address 가 있어도", () => {
    const old: FinalReportData = structuredClone(loadEd4("bc_strong", "final"));
    delete old.performer.address;
    delete old.performer.email;
    const out = applyIssuance(old, issuanceWith("서버에 적힌 다른 주소"));
    expect(out.performer).not.toHaveProperty("address");
    expect(out.performer).not.toHaveProperty("email");
    expect(Object.keys(out.performer).sort()).toEqual(["contact", "evaluator", "orgName"]);
  });

  it("한쪽만 저장돼 있으면 그쪽만 남긴다", () => {
    const onlyEmail: FinalReportData = structuredClone(loadEd4("bc_strong", "final"));
    delete onlyEmail.performer.address;
    const out = applyIssuance(onlyEmail, issuanceWith("서버 주소"));
    expect(out.performer).not.toHaveProperty("address");
    expect(out.performer.email).toBe("contact@litmus.example");
  });
});
