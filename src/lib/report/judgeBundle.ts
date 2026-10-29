/**
 * 판 4 서술 작업 결과의 고객용 심판 묶음(`result.judge`) 읽기 — 심판 라운드 J6(계획 14-5).
 *
 * 계약은 `src/test/contract/judge_bundle_ed4.json`(백엔드와 같은 바이트). 닫힌 쪽으로 읽는다: gate 가 passed·held 밖이거나,
 * 보류 종류·축·건수의 모양이 계약과 다르면 묶음을 버린다(undefined) — 그러면 판 4 성적서는 "심판 기록 없음"으로 잠긴다
 * (`reportLock.ts`). 근거 인용·사유·주장 목록은 계약상 오지 않고, 여기서도 옮기지 않는다(모르는 키는 버린다).
 */

export type JudgeGate = "passed" | "held";
export type JudgeHeldKind = "gate_failed" | "timeout" | "judge_error" | "no_key" | "budget" | "job_limit" | "no_material";
export type JudgeAxis = "faithfulness" | "consistency" | "coverage" | "readability";

export const JUDGE_HELD_KINDS: readonly JudgeHeldKind[] = [
  "gate_failed",
  "timeout",
  "judge_error",
  "no_key",
  "budget",
  "job_limit",
  "no_material",
];
export const JUDGE_AXES: readonly JudgeAxis[] = ["faithfulness", "consistency", "coverage", "readability"];

export interface JudgeCoverageItem {
  /** 필수 내용 항목 id(예 "분석-1"). */
  id: string;
  described: boolean;
  /** "있음" 판정이 인용한 글이 판 4 에서 실제로 찍힌 자리(예 "5.2"). 서술되지 않았으면 null. */
  place: string | null;
}

export interface JudgeCounts {
  faithfulness?: { checked: number; matched: number };
  consistency?: { checked: number; contradictions: number };
  coverage?: { applicable: number; described: number; notApplicable: number; items: JudgeCoverageItem[] };
  readability?: { rules: number; violations: number };
}

/** 성적서 데이터에 저장하는 심판 묶음(camelCase). 발급 보관본에도 그대로 들어간다(계약상 내부 정보는 없다). */
export interface JudgeBundle {
  gate: JudgeGate;
  heldKind: JudgeHeldKind | null;
  retryAllowed: boolean;
  criteriaVersion: string;
  model: string;
  axes: JudgeAxis[];
  /** passed 일 때만 값, held 면 null. */
  counts: JudgeCounts | null;
}

/**
 * 필수 내용 항목 id(심판 기준 18개 — 고객용 이름·영향 문장은 `edition4/appendix.ts` COVERAGE_ITEMS, 같은 목록을 시험이 대조).
 * 모르는 id 가 오면(기준과 화면이 어긋남) 묶음을 버린다 — 고객 성적서에 내부 id 를 찍지 않게(닫힌 쪽, J7 검토).
 */
export const COVERAGE_IDS: readonly string[] = [
  "분석-1", "분석-2", "분석-3", "분석-4", "분석-5", "분석-6", "분석-7",
  "소견-1", "소견-2", "소견-3", "소견-4", "소견-5", "소견-6", "소견-7", "소견-8",
  "권고-1", "권고-2", "권고-3",
];

const isCount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function toCounts(raw: unknown, axes: JudgeAxis[]): JudgeCounts | null {
  if (!isObj(raw)) return null;
  const out: JudgeCounts = {};
  for (const axis of axes) {
    const c = raw[axis];
    if (!isObj(c)) return null;
    if (axis === "faithfulness") {
      if (!isCount(c.checked) || !isCount(c.matched)) return null;
      out.faithfulness = { checked: c.checked, matched: c.matched };
    } else if (axis === "consistency") {
      if (!isCount(c.checked) || !isCount(c.contradictions)) return null;
      out.consistency = { checked: c.checked, contradictions: c.contradictions };
    } else if (axis === "coverage") {
      if (!isCount(c.applicable) || !isCount(c.described) || !isCount(c.not_applicable) || !Array.isArray(c.items)) return null;
      const items: JudgeCoverageItem[] = [];
      for (const it of c.items) {
        if (!isObj(it) || typeof it.id !== "string" || typeof it.described !== "boolean") return null;
        if (!COVERAGE_IDS.includes(it.id) || items.some((x) => x.id === it.id)) return null;
        // 서술된 항목은 찍힌 자리가 있어야 한다 — 없으면 체크리스트("서술되지 않음")와 건수가 어긋난다(J7 검토).
        if (it.described ? typeof it.place !== "string" || it.place.trim() === "" : it.place !== null) return null;
        items.push({ id: it.id, described: it.described, place: it.described ? (it.place as string) : null });
      }
      // 건수와 체크리스트가 맞아야 한다 — 1.1 요약·1.3 표(건수)와 체크리스트·빠진 목록(항목)이 같은 성적서에서 어긋나지 않게.
      if (items.length !== c.applicable || items.filter((x) => x.described).length !== c.described) return null;
      if (c.applicable + c.not_applicable !== COVERAGE_IDS.length) return null;
      out.coverage = { applicable: c.applicable, described: c.described, notApplicable: c.not_applicable, items };
    } else {
      if (!isCount(c.rules) || !isCount(c.violations)) return null;
      out.readability = { rules: c.rules, violations: c.violations };
    }
  }
  return out;
}

/** 응답의 `result.judge` → 저장할 묶음. 없거나 모양이 틀리면 undefined(닫힌 쪽 — 판 4 는 잠긴다). */
export function toJudgeBundle(raw: unknown): JudgeBundle | undefined {
  if (!isObj(raw)) return undefined;
  const gate = raw.gate;
  if (gate !== "passed" && gate !== "held") return undefined;
  if (typeof raw.retry_allowed !== "boolean") return undefined;
  if (typeof raw.criteria_version !== "string" || typeof raw.model !== "string") return undefined;
  if (!Array.isArray(raw.axes) || !raw.axes.every((a) => (JUDGE_AXES as readonly unknown[]).includes(a))) return undefined;
  // 축 순서는 계약이 고정한다 — 순서가 다르거나 겹치면 모양이 틀린 것으로 본다.
  const axes = JUDGE_AXES.filter((a) => (raw.axes as unknown[]).includes(a));
  if (axes.length !== raw.axes.length || axes.some((a, i) => a !== (raw.axes as unknown[])[i])) return undefined;
  if (gate === "passed") {
    if (raw.held_kind !== null || raw.retry_allowed !== false) return undefined;
    const counts = toCounts(raw.counts, axes);
    if (!counts) return undefined;
    return { gate, heldKind: null, retryAllowed: false, criteriaVersion: raw.criteria_version, model: raw.model, axes, counts };
  }
  if (!(JUDGE_HELD_KINDS as readonly unknown[]).includes(raw.held_kind)) return undefined;
  return {
    gate,
    heldKind: raw.held_kind as JudgeHeldKind,
    retryAllowed: raw.retry_allowed,
    criteriaVersion: raw.criteria_version,
    model: raw.model,
    axes,
    counts: null,
  };
}
