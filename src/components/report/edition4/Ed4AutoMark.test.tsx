/**
 * 판 4 자동 작성 표시(서술 설계 D54) — 서술 칸 왼쪽 세로줄(`Ed4AutoMark`, 속성 `data-ed4-auto-mark`)과 범례(고정 문구 27).
 *
 * 긋는 곳: 칸(D36)의 서술 글 — 5.1~5.6(칸 8.2·7.1·7.2·8.1·8.3·7.3), 6.1·6.2(9 칸의 두 부분 — 서술과 권고표를 한 줄로).
 * AI 칸·규칙 템플릿 대체 칸 모두 같게. 긋지 않는 곳: 절·소절 제목, ※ 줄, 범례, 칸 안 고정 문구(11a·11b·12), 빈 칸 고정 문구
 * (B18·15 — 칸 출처 fixed), 고정 문구 6(문제 0개), 자리표시(대기·실패·미작성), 서술 칸 밖의 표(1~4절의 표).
 * 범례는 ※ 줄 바로 다음 형제(5.1 앞)에 늘 — 화면·인쇄·번호 열기. 판 3 성적서에는 둘 다 없다.
 *
 * 세 경로(화면 `ReportSections`·인쇄 `/report/:id/print`·번호 열기 `/report/no/:번호`)를 실제 입구로 그려 DOM 을 본다 — 인쇄 경로
 * 배선이 빠지면 인쇄 시험이 잡는다.
 */
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { ReportSections } from "../ReportSections";
import { ED4_AUTO_MARK_LINE } from "./shared/Ed4AutoMark";
import { Edition4Report } from "./Edition4Report";
import { normalizeReportContent } from "../../../lib/report/normalizeReportContent";
import { byNumberText, printText } from "../../../test/edition4/render/renderEd4";
import { loadEd4, loadEd4Issuance, type Ed4Tag } from "../../../test/edition4/render/ed4Fixtures";
import type { FinalReportData } from "../../../types/finalReport.types";

/** 고정 문구 27·※ 줄(고정 문구 rev 134 문안 칸 글자 그대로 옮겨 적음). */
const LEGEND = "※ 왼쪽에 세로줄이 있는 부분은 평가 시스템이 시험 결과를 바탕으로 자동 작성한 것입니다.";
const NOTE = "※ 5절은 4절의 시험 결과를 해석한 참고 의견이며, 시험 결과에 해당하지 않습니다.";
const MARK = "[data-ed4-auto-mark]";
const ALL_SLOTS = ["8.2", "7.1", "7.2", "8.1", "8.3", "7.3", "9.1", "9.2"];

const copy = (data: FinalReportData): FinalReportData => structuredClone(data);
const squash = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------------ *
 * 세 경로 DOM
 * ------------------------------------------------------------------ */
type Path = "screen" | "print" | "byNumber";

/** 화면 — 앱 입구(ReportSections)로 그린 DOM 을 cb 에 넘긴다. */
function withScreen(data: FinalReportData, cb: (root: Element) => void) {
  const view = render(
    <MemoryRouter>
      <ReportSections data={normalizeReportContent(structuredClone(data))} />
    </MemoryRouter>,
  );
  try {
    cb(view.container);
  } finally {
    view.unmount();
  }
}

async function withPath(path: Path, tag: Ed4Tag, data: FinalReportData, cb: (root: Element) => void) {
  if (path === "screen") return withScreen(data, cb);
  let seen = false;
  const inspect = (root: Element) => {
    seen = true;
    cb(root);
  };
  if (path === "print") await printText(data, undefined, { inspect });
  else await byNumberText(data, loadEd4Issuance(tag), { inspect });
  expect(seen, "inspect 가 불리지 않았다").toBe(true);
}

const marks = (root: Element) => [...root.querySelectorAll<HTMLElement>(MARK)];
const markSlots = (root: Element) => marks(root).map((m) => m.dataset.ed4AutoMark);
const paragraphWith = (root: Element, text: string) => {
  const hits = [...root.querySelectorAll("p")].filter((p) => squash(p.textContent) === squash(text));
  expect(hits, `"${text.slice(0, 30)}…" 문단이 하나가 아니다`).toHaveLength(1);
  return hits[0];
};
const partOf = (el: Element) => el.closest("[data-ed4-part]")?.getAttribute("data-ed4-part");

/** "#rrggbb" → jsdom 이 정규화한 "rgb(r, g, b)". */
const rgbOf = (hex: string) => {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${n.join(", ")})`;
};

/** 표시 하나의 모양 — 선 굵기·종류·색이 있고 글과 간격이 있다(선 빼기 변이 잡기). */
function expectLine(mark: HTMLElement) {
  expect(mark.style.borderLeftWidth).toBe(ED4_AUTO_MARK_LINE.width);
  expect(mark.style.borderLeftStyle).toBe("solid");
  expect(mark.style.borderLeftColor).toBe(rgbOf(ED4_AUTO_MARK_LINE.color));
  expect(mark.style.paddingLeft).toBe(ED4_AUTO_MARK_LINE.gap);
}

describe("선 모양 — 흑백 인쇄에 남는 값(PDF 회색조·1비트 비교로 정함)", () => {
  it("2px #444 · 글과 10px, 회색값은 1비트 임계 128 보다 충분히 어둡다(≤ 100 — #777=119 는 임계에 붙고 #999 부터 사라졌다)", () => {
    expect(ED4_AUTO_MARK_LINE).toEqual({ width: "2px", color: "#444444", gap: "10px" });
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(ED4_AUTO_MARK_LINE.color.slice(i, i + 2), 16));
    expect(Math.round(0.299 * r + 0.587 * g + 0.114 * b)).toBeLessThanOrEqual(100);
  });

  it("선은 글 왼쪽 여백 쪽(음수 margin = 굵기 + 간격) — 칸 글의 시작 위치가 다른 문단과 같다(실제 위치는 화면 스모크에서 확인)", () => {
    const shift = parseFloat(ED4_AUTO_MARK_LINE.width) + parseFloat(ED4_AUTO_MARK_LINE.gap);
    withScreen(loadEd4("bc_strong", "issued"), (root) => {
      expect(marks(root).length).toBeGreaterThan(0);
      for (const m of marks(root)) expect(m.style.marginLeft).toBe(`calc(-${shift}px)`);
    });
  });
});

/** 공통 단정 — 범례 자리, 긋지 않는 자리(제목·※·범례·1~4절 표). */
function expectCommon(root: Element) {
  const note = paragraphWith(root, NOTE);
  const legend = paragraphWith(root, LEGEND);
  expect(note.nextElementSibling).toBe(legend);
  expect(partOf(legend)).toBe("Ed4Findings");
  expect(legend.nextElementSibling?.getAttribute("data-ed4-slot")).toBe("8.2");
  expect(note.closest(MARK)).toBeNull();
  expect(legend.closest(MARK)).toBeNull();
  // 제목은 늘 표시 밖, 표시는 5·6절 안에만.
  expect(root.querySelectorAll(`${MARK} h1, ${MARK} h2, ${MARK} h3, ${MARK} h4`)).toHaveLength(0);
  for (const m of marks(root)) expect(["Ed4Findings", "Ed4Recommend"]).toContain(partOf(m));
  // 표시 안의 표는 6절 권고표뿐(서술 칸 밖의 표 — 1~4절 — 에는 긋지 않는다).
  const tables = [...root.querySelectorAll("table")];
  const outside = tables.filter((t) => partOf(t) !== "Ed4Recommend");
  expect(outside.length).toBeGreaterThan(0);
  for (const t of outside) expect(t.closest(MARK)).toBeNull();
  for (const m of marks(root)) expectLine(m);
}

/* ------------------------------------------------------------------ *
 * 픽스처 세 입력 × 세 경로
 * ------------------------------------------------------------------ */
describe.each<Path>(["screen", "print", "byNumber"])("경로 %s", (path) => {
  const load = (tag: Ed4Tag) => (path === "byNumber" ? loadEd4(tag, "final") : loadEd4(tag, "issued"));

  it("bc_strong(모든 칸 AI) — 칸 8개 부분에 긋는다, 칸 글만(11a 는 밖), 6.1·6.2 는 서술+권고표 한 줄", async () => {
    const data = load("bc_strong");
    await withPath(path, "bc_strong", data, (root) => {
      expectCommon(root);
      expect(markSlots(root)).toEqual(ALL_SLOTS);
      const byslot = Object.fromEntries(marks(root).map((m) => [m.dataset.ed4AutoMark, m]));
      expect(squash(byslot["8.2"].textContent)).toBe(squash(data.conclusion.narrative));
      expect(squash(byslot["7.1"].textContent)).toBe(squash(data.interpretation.confusionAnalysis));
      expect(squash(byslot["7.2"].textContent)).toBe(squash(data.interpretation.distributionAnalysis));
      expect(squash(byslot["8.1"].textContent)).toBe(squash(data.conclusion.benchmark));
      expect(squash(byslot["8.3"].textContent)).toBe(squash(data.conclusion.risks));
      expect(squash(byslot["7.3"].textContent)).toBe(squash(data.interpretation.additionalObservations));
      // 11a(고정 문구)는 5.1 칸 안이지만 표시 밖 — 서술 바로 다음 형제.
      const same = paragraphWith(root, data.sourceRelationSentence!);
      expect(same.closest(MARK)).toBeNull();
      expect(byslot["8.2"].nextElementSibling).toBe(same);
      // 9 칸: 부분마다 표시 하나에 서술 문단과 권고표가 함께.
      for (const slot of ["9.1", "9.2"]) {
        const m = byslot[slot];
        expect(m.querySelectorAll("table")).toHaveLength(1);
        expect(m.firstElementChild?.tagName).toBe("P");
        expect(m.lastElementChild?.tagName).toBe("TABLE");
        expect(m.parentElement?.getAttribute("data-ed4-slot")).toBe(slot);
      }
      expect(squash(byslot["9.1"].querySelector("p")!.textContent)).toBe(squash(data.recommendationNarrative.dataQuality));
      expect(squash(byslot["9.2"].querySelector("p")!.textContent)).toBe(squash(data.recommendationNarrative.modelOps));
    });
  });

  it("digits_strong — 규칙 템플릿 대체 칸(8.1 fallback)도 똑같이 긋고, 12 는 5.3 칸 안이지만 표시 밖", async () => {
    const data = load("digits_strong");
    expect(data.narrativeSections?.["8.1"]).toBe("fallback");
    await withPath(path, "digits_strong", data, (root) => {
      expectCommon(root);
      expect(markSlots(root)).toEqual(ALL_SLOTS);
      const m81 = marks(root).find((m) => m.dataset.ed4AutoMark === "8.1")!;
      const m82 = marks(root).find((m) => m.dataset.ed4AutoMark === "8.2")!;
      expect(m81.getAttribute("style")).toBe(m82.getAttribute("style"));
      const caution = paragraphWith(root, data.labelCautionSentence!);
      expect(caution.closest(MARK)).toBeNull();
      expect(caution.nextElementSibling?.getAttribute("data-ed4-auto-mark")).toBe("7.2");
    });
  });

  it("yeast_strong — 7.3 이 빈 칸 고정 문구 15 '해당 없음'(fixed)이면 그 칸은 긋지 않는다", async () => {
    const data = load("yeast_strong");
    expect(data.narrativeSections?.["7.3"]).toBe("fixed");
    await withPath(path, "yeast_strong", data, (root) => {
      expectCommon(root);
      expect(markSlots(root)).toEqual(ALL_SLOTS.filter((s) => s !== "7.3"));
      const slot73 = root.querySelector('[data-ed4-slot="7.3"]')!;
      expect(squash(slot73.textContent)).toBe("5.6 추가 관찰해당 없음");
      expect(slot73.querySelector(MARK)).toBeNull();
    });
  });
});

/* ------------------------------------------------------------------ *
 * 여러 문단 서술 — 칸마다 표시 하나(검토 지적: 문단마다 따로 감싸면 문단 사이 여백에서 선이 끊겨 칸 단위가 깨진다)
 * 판 4 픽스처의 서술은 모두 한 문단이라, 복사본의 칸을 빈 줄로 나눈 여러 문단으로 바꿔 세 경로에서 본다.
 * ------------------------------------------------------------------ */
describe.each<Path>(["screen", "print", "byNumber"])("여러 문단 서술 — 경로 %s", (path) => {
  it("5.1(칸 8.2) 두 문단·5.6(칸 7.3) 세 문단·6.1(칸 9.1) 두 문단 + 권고표 — 칸마다 표시 하나, 그 안에 문단 수만큼 p", async () => {
    const tag: Ed4Tag = "bc_strong";
    const data = copy(path === "byNumber" ? loadEd4(tag, "final") : loadEd4(tag, "issued"));
    const paras = {
      "8.2": ["5.1 첫 문단 — 여러 문단 시험.", "5.1 둘째 문단 — 여러 문단 시험."],
      "7.3": ["5.6 첫 문단.", "5.6 둘째 문단.", "5.6 셋째 문단."],
      "9.1": ["6.1 첫 문단 — 여러 문단 시험.", "6.1 둘째 문단 — 여러 문단 시험."],
    };
    data.conclusion.narrative = paras["8.2"].join("\n\n");
    data.interpretation.additionalObservations = paras["7.3"].join("\n \n"); // 공백 낀 빈 줄도 문단 나눔
    data.recommendationNarrative = { ...data.recommendationNarrative, dataQuality: paras["9.1"].join("\n\n") };
    await withPath(path, tag, data, (root) => {
      expectCommon(root);
      // 칸마다 표시는 정확히 하나(문단마다 나뉘면 같은 칸 이름이 여러 번 나온다).
      expect(markSlots(root)).toEqual(ALL_SLOTS);
      for (const [slot, ps] of Object.entries(paras)) {
        const m = marks(root).find((x) => x.dataset.ed4AutoMark === slot)!;
        const inner = [...m.children].filter((c) => c.tagName === "P");
        expect(inner.map((p) => squash(p.textContent)), `칸 ${slot} 표시 안 문단`).toEqual(ps);
        expect(m.parentElement?.getAttribute("data-ed4-slot")).toBe(slot);
      }
      // 6.1: 문단 둘 다음에 권고표 — 셋 모두 한 표시 안(선이 서술 끝에서 끊기지 않는다).
      const m91 = marks(root).find((x) => x.dataset.ed4AutoMark === "9.1")!;
      expect([...m91.children].map((c) => c.tagName)).toEqual(["P", "P", "TABLE"]);
      // 11a 는 여전히 5.1 표시 바로 다음 형제(표시 밖).
      const m82 = marks(root).find((x) => x.dataset.ed4AutoMark === "8.2")!;
      expect(m82.nextElementSibling).toBe(paragraphWith(root, data.sourceRelationSentence!));
    });
  });
});

/* ------------------------------------------------------------------ *
 * 픽스처에 없는 갈래(복사본) — 화면·인쇄(부품 직접 두 mode)
 * ------------------------------------------------------------------ */
function withBoth(data: FinalReportData, cb: (root: Element, mode: "screen" | "print") => void) {
  for (const mode of ["screen", "print"] as const) {
    const view = render(<Edition4Report data={normalizeReportContent(structuredClone(data))} mode={mode} />);
    try {
      cb(view.container, mode);
    } finally {
      view.unmount();
    }
  }
}

describe("긋지 않는 칸·자리", () => {
  it("B18 — 8.1 빈 글·fixed(모든 지표가 기준표 밖)면 5.4 '해당 없음'에 긋지 않는다", () => {
    const data = copy(loadEd4("digits_strong", "issued"));
    data.conclusion.benchmark = "";
    data.narrativeSections = { ...data.narrativeSections, "8.1": "fixed" };
    withBoth(data, (root) => {
      expect(markSlots(root)).toEqual(ALL_SLOTS.filter((s) => s !== "8.1"));
      expect(squash(root.querySelector('[data-ed4-slot="8.1"]')!.textContent)).toBe("5.4 참조 범위해당 없음");
    });
  });

  it.each(["pending", "failed"] as const)("서술 %s — 자리표시에는 긋지 않는다(5·6절 표시 0개), 범례는 그대로", async (kind) => {
    const data = loadEd4("bc_strong", kind);
    withBoth(data, (root) => {
      expect(marks(root)).toHaveLength(0);
      expect(paragraphWith(root, NOTE).nextElementSibling).toBe(paragraphWith(root, LEGEND));
      // 권고표는 자리표시 행뿐 — 표는 있지만 긋지 않는다.
      expect(root.querySelectorAll('[data-ed4-part="Ed4Recommend"] table').length).toBeGreaterThan(0);
    });
    withScreen(data, (root) => expect(marks(root)).toHaveLength(0));
  });

  it("평가 전 초안(문제 목록 없음·서술 없음) — 칸 자리표시·권고 표 자리 안내에 긋지 않는다", () => {
    const data = copy(loadEd4("bc_strong", "issued"));
    delete data.problems;
    delete data.narrativeSource;
    data.recommendations = [];
    data.recommendationNarrative = { dataQuality: "", modelOps: "" };
    data.conclusion.narrative = "";
    data.interpretation.confusionAnalysis = "";
    withBoth(data, (root) => {
      expect(markSlots(root)).toEqual(["7.2", "8.1", "8.3", "7.3"]);
    });
  });

  it("문제 0개 — 6절은 고정 문구 6 만이라 긋지 않는다(5절은 그대로)", () => {
    const data = copy(loadEd4("bc_strong", "issued"));
    data.problems = [];
    withBoth(data, (root) => {
      expect(markSlots(root)).toEqual(ALL_SLOTS.slice(0, 6));
      expect(root.querySelector(`[data-ed4-part="Ed4Recommend"] ${MARK}`)).toBeNull();
    });
  });

  it("B19 — 문제가 없는 소절은 서술에만 긋는다(표 없음)", () => {
    const data = copy(loadEd4("digits_strong", "issued"));
    data.problems = data.problems!.filter((p) => p.recommend_section !== "9.2");
    withBoth(data, (root) => {
      expect(markSlots(root)).toEqual(ALL_SLOTS);
      const m92 = marks(root).find((m) => m.dataset.ed4AutoMark === "9.2")!;
      expect(m92.querySelector("table")).toBeNull();
      expect(squash(m92.textContent)).toBe(squash(data.recommendationNarrative.modelOps));
    });
  });

  it("서술은 끝났는데 소절 문제의 권고가 하나도 없으면 — 서술에만 긋고 자리표시 행뿐인 표는 밖", () => {
    const data = copy(loadEd4("bc_strong", "issued"));
    data.recommendations = data.recommendations.filter((r) => r.problemId !== "P2"); // 6.1 의 P2 권고를 뺌
    withBoth(data, (root) => {
      expect(markSlots(root)).toEqual(ALL_SLOTS);
      const side = root.querySelector('[data-ed4-slot="9.1"]')!;
      const table = side.querySelector("table")!;
      expect(table.closest(MARK)).toBeNull();
      expect(side.querySelectorAll(MARK)).toHaveLength(1);
      const side2 = root.querySelector('[data-ed4-slot="9.2"]')!;
      expect(side2.querySelector("table")!.closest(MARK)).not.toBeNull();
    });
  });

  it("권고는 있는데 소절 서술이 빈 글이면 — 권고표에만 긋는다(서술 자리표시는 밖)", () => {
    const data = copy(loadEd4("bc_strong", "issued"));
    data.recommendationNarrative = { ...data.recommendationNarrative, dataQuality: "" };
    withBoth(data, (root) => {
      const side = root.querySelector('[data-ed4-slot="9.1"]')!;
      const ms = side.querySelectorAll<HTMLElement>(MARK);
      expect(ms).toHaveLength(1);
      expect(ms[0].firstElementChild?.tagName).toBe("TABLE");
      expect(side.querySelector("p")!.closest(MARK)).toBeNull();
    });
  });

  it("화면 전용 칸 배지(규칙 기반 문장)는 소절 제목 옆이라 표시 밖", () => {
    const data = loadEd4("digits_strong", "issued");
    withScreen(data, (root) => {
      const badge = [...root.querySelectorAll("span")].find((s) => s.textContent === "규칙 기반 문장")!;
      expect(badge).toBeTruthy();
      expect(badge.closest(MARK)).toBeNull();
    });
  });
});

/* ------------------------------------------------------------------ *
 * 판 3 에는 없음
 * ------------------------------------------------------------------ */
describe("판 3 성적서에는 세로줄·범례가 없다", () => {
  const ED3 = JSON.parse(
    readFileSync(resolve(__dirname, "../../../test/archive/issued/RPT-2026-0001.content.json"), "utf8"),
  ) as FinalReportData;

  it("대조군 — 판 3 데이터다(판 4 표시가 없음이 빈 이빨이 아님: 같은 입력의 판 4 는 표시 8개)", () => {
    expect(ED3.contentSchema).toBe(3);
    withScreen(loadEd4("bc_strong", "issued"), (root) => expect(marks(root)).toHaveLength(8));
  });

  it("화면", () => {
    withScreen(ED3, (root) => {
      expect(root.textContent).toContain("Section 0");
      expect(marks(root)).toHaveLength(0);
      expect(root.textContent).not.toContain(LEGEND);
    });
  });

  it("인쇄", async () => {
    let seen = false;
    const text = await printText(ED3, undefined, {
      inspect: (root) => {
        seen = true;
        expect(marks(root)).toHaveLength(0);
      },
    });
    expect(seen).toBe(true);
    expect(text).toContain("Section 0");
    expect(text).not.toContain(LEGEND);
  });
});
