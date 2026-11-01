/**
 * 보고 항목 2(평가 데이터 출처) 제공 판정 — 백엔드와 같은 대조 표로 프론트 쪽을 본다(심판 라운드 1단계 통합 확인 뒤 고침).
 *
 * 항목 2 판정은 두 저장소가 따로 계산한다. 프론트는 재료 점검(`materialCheck` 항목 2 → 성적서 1.3, 판 3 은 1.4)이고, 백엔드는
 * 8.2 "평가 데이터의 대표성과 한계"(8.2-14, 판 4 는 5.1)의 조건(`required_items._eval_data_source`)이다. 서술 요청에 재료 점검
 * 결과가 실리지 않으므로 백엔드는 `client_inputs.test_data` 글에서 같은 규칙을 다시 계산한다. 둘이 갈리면 1.3 이 "판단할 수
 * 없다"고 찍은 성적서에 대표성 해석이 실리거나 그 반대가 된다.
 *
 * `src/test/contract/reporting_item2_cases.json` 이 대조 표다. 백엔드 `tests/contract/` 에 같은 바이트가 있고 백엔드
 * `tests/test_j1_item2_contract.py` 가 같은 표의 `test_data` 로 자기 판정을 본다. 이 파일은 (1) 표의 sha256, (2) 같은 입력에서
 * 프론트가 백엔드로 보내는 `test_data` 가 표와 같은지, (3) 프론트 판정이 `provided.frontend` 인지 본다. 프론트 규칙을 바꾸면 이
 * 시험이 깨지고, 표를 고치면 백엔드 사본·sha256 도 함께 고쳐야 한다(옆 저장소가 있으면 아래 바이트 대조가 알려 준다).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { ComposerValueMap } from "../../types/reportComposer.types";
import { checkMaterialSelection } from "./materialCheck";
import { buildClientInputs, buildReportMaterials, type ReportComposerInput } from "./reportMaterials";

const NAME = "reporting_item2_cases.json";
const TABLE_PATH = resolve(__dirname, "../../test/contract", NAME);
const BACKEND_COPY = resolve(__dirname, "../../../../Capstone_Back/tests/contract", NAME);

/** 심판 라운드 1단계 통합 확인 뒤 고침(2026-10-28)에 만든 바이트. 백엔드 tests/test_j1_item2_contract.py 와 같은 값이다. */
const SHA256 = "2ee408f7b451d9a8ed110054ce738445d18f917ea2be7a52b51cfb2a88d935fa";

interface Item2Case {
  name: string;
  card: boolean;
  input: ComposerValueMap;
  test_data: Record<string, string>;
  provided: { frontend: boolean; backend: boolean };
  pending?: string;
}
const TABLE: { cases: Item2Case[] } = JSON.parse(readFileSync(TABLE_PATH, "utf8"));
const CASES = TABLE.cases;

/** 평가 데이터 카드(⑦)만 바꾸는 바탕. 다른 카드는 비워 둔다 — 항목 2 판정과 test_data 에는 이 카드만 들어간다. */
const BASE: ReportComposerInput = {
  cards: { trainingData: true, testData: true, groundTruth: true, modelEnv: true },
  metrics: {},
  perspective: {},
  trainingData: {},
  testData: {},
  groundTruth: {},
  modelEnv: {},
};

function frontendSide(c: Item2Case, edition: 3 | 4) {
  const composer: ReportComposerInput = { ...BASE, cards: { ...BASE.cards, testData: c.card }, testData: c.input };
  const materials = buildReportMaterials(composer, "binary");
  const check = checkMaterialSelection({
    taskType: "binary",
    materials,
    systemSpec: { os: "", cpu: "", gpu: "", memory: "", software: "" },
    latencyMapped: false,
    perspective: {},
    selectedMetricIds: ["M1"],
    beta: 1,
    imbalanceRatio: null,
    distributionSource: null,
    edition,
  });
  const item2 = check.reporting.items.filter((item) => item.item === 2);
  expect(item2).toHaveLength(1);
  const clientInputs = buildClientInputs({
    composer,
    materials,
    model: { name: "m", version: "1", purpose: "", category: "" },
    reportPurposeNote: "",
    coreMetrics: null,
    classLabelDescriptions: {},
    runtime: {},
  });
  return { provided: item2[0].provided, testData: clientInputs.test_data };
}

describe("보고 항목 2 대조 표 — 파일", () => {
  it("박아 둔 sha256 과 바이트까지 같다", () => {
    expect(createHash("sha256").update(readFileSync(TABLE_PATH)).digest("hex")).toBe(SHA256);
  });

  it.skipIf(!existsSync(BACKEND_COPY))("백엔드 tests/contract 사본과 바이트가 같다", () => {
    expect(readFileSync(BACKEND_COPY).equals(readFileSync(TABLE_PATH))).toBe(true);
  });

  it("줄이 있고, 제공·빠짐이 둘 다 있으며, 이름이 겹치지 않는다", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(CASES.map((c) => c.provided.frontend))).toEqual(new Set([true, false]));
    expect(new Set(CASES.map((c) => c.name)).size).toBe(CASES.length);
  });

  it("두 판정이 갈리는 줄은 알려진 경계 하나뿐이고 pending 에 까닭이 있다", () => {
    const gaps = CASES.filter((c) => c.provided.frontend !== c.provided.backend);
    expect(gaps.map((c) => c.name)).toEqual(["출처 글 '제공되지 않음'(직접 적음) + 같은 출처"]);
    for (const c of CASES) expect([c.name, !!c.pending?.trim()]).toEqual([c.name, gaps.includes(c)]);
  });
});

describe.each([3, 4] as const)("보고 항목 2 대조 표 — 프론트 판정(판 %i)", (edition) => {
  it.each(CASES.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const got = frontendSide(c, edition);
    expect(got.testData).toEqual(c.test_data);
    expect(got.provided).toBe(c.provided.frontend);
  });
});
