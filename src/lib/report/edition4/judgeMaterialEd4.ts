/**
 * 판 4 서술 요청의 심판 읽기 재료(`judge_material`, 심판 라운드 J2 ②, 계획 10-1).
 *
 * 심판은 성적서에 찍힌 글을 읽는다(설계 4절 읽는 범위). AI 칸·규칙 문장 글은 백엔드가 생성 결과로 가지고 있으므로, 여기서는
 * 범위 안에서 **프론트가 찍는 것** — 고정 문구와 표 — 만 화면과 같은 함수로 만들어 그 글자 그대로 싣는다(판정 지점 하나 —
 * 백엔드가 같은 글을 다시 만들지 않는다). 4.6 참조 범위 표는 백엔드가 작업을 만들 때 계산하는 값이라 여기 없다(백엔드가 만든다).
 *
 * 범위(판 3 칸 이름 → 판 4 자리):
 * - 8(8절 머리) → 4.2 종합 판정 표·근거 문장
 * - 8.3 → 4.3 판정 여유 열(판정 대상 지표만)
 * - 7.1 → 3.3 예측 산출 문장·레이블별 임계값 표, 4.4 건수 표·고정 17·최약 클래스·예측 편향·최다 오분류 쌍·임계값 조정 여지 표
 * - 8.2 → 5.1 뒤 고정 11a·11b, 7.2 → 5.3 앞 고정 12, 8.1 → 4.6 고정 16 과 5.4 빈 칸 B18, 7.3 → 5.6 빈 칸 고정 15
 * - 9 → 6절 권고표의 우선순위·대응 문제 칸(행마다 문제 번호 — 권고·기대 효과는 백엔드가 서술 결과로 채움), 문제 0개면 고정 6
 * 5절 머리의 ※ 줄·범례(자동 작성 표시 안내)는 성적서 내용에 대한 말이 아니라 싣지 않는다.
 *
 * 숫자마다 출처 칸 이름(field)을 붙이는 것은 구조화된 값에서 칸을 만드는 표뿐이다(일관성 값 묶기용). 이미 글로 저장된 문장
 * (고정 17·근거 문장·임계값 표)의 숫자는 출처를 모른다 — 숫자 목록에 넣지 않는다(LLM 은 글 전체를 읽는다).
 */
import type { FinalReportData } from "../../../types/finalReport.types";
import { NO_PROBLEM_SENTENCE } from "../reportConstants";
import { NO_ADDITIONAL_OBSERVATION_TEXT } from "../narrativeSectionText";
import { priorityLabelEd4, problemLabel } from "../problemList";
import { B18_NOT_APPLICABLE } from "./edition4Text";
import { ED4_RECOMMEND_SECTIONS } from "./narrativeSlots";
import { derivationEd4 } from "./render/methodEd4";
import { ED3_PER_LABEL_COLUMNS } from "./render/methodText";
import { EX_RECOMMEND_COLUMNS } from "./render/recommendText";
import { metricRowEd4, verdictBasisEd4, verdictRowEd4 } from "./render/resultsCore";
import { EX_4_2_COLUMNS, EX_4_3_COLUMNS } from "./render/resultsCoreText";
import {
  confusionCountsTable,
  confusionPairsTable,
  predictionBiasTable,
  thresholdTable,
  weakestClassTable,
  type DetailTable,
} from "./render/resultsDetail";

export const JUDGE_MATERIAL_VERSION = "judge-material-1";
/** 재료 글자 수 상한 — 백엔드 app/judge/material.py MAX_MATERIAL_CHARS 와 같은 값(공백 없는 JSON). 넘으면 싣지 않는다. */
export const MAX_JUDGE_MATERIAL_CHARS = 300_000;

export interface JudgeNumber {
  text: string;
  field: string | null;
}

export interface JudgeSegment {
  id: string;
  slot: "7.1" | "7.2" | "7.3" | "8.1" | "8.2" | "8.3" | "9" | "8";
  place: string;
  kind: "fixed" | "table" | "recommend_rows";
  when?: "slot_empty";
  text?: string;
  header?: string[];
  rows?: string[][];
  row_keys?: string[];
  numbers: JudgeNumber[];
}

export interface JudgeMaterial {
  version: typeof JUDGE_MATERIAL_VERSION;
  material_check_version: string | null;
  segments: JudgeSegment[];
}

const fixed = (id: string, slot: JudgeSegment["slot"], place: string, text: string, numbers: JudgeNumber[] = []): JudgeSegment => ({
  id, slot, place, kind: "fixed", text, numbers,
});

/** 표 하나 → 조각 하나(소제목은 글로, 표 아래 줄은 text 에). numbersOf 는 행 → 숫자 칸들. */
function tableSegment(
  id: string,
  slot: JudgeSegment["slot"],
  place: string,
  table: DetailTable | null,
  numbersOf: (rowIndex: number, row: string[]) => JudgeNumber[] = () => [],
): JudgeSegment | null {
  if (!table) return null;
  return {
    id,
    slot,
    place,
    kind: "table",
    text: [table.title, ...table.notes].filter((t): t is string => !!t).join("\n"),
    header: [...table.columns],
    rows: table.rows.map((r) => [...r]),
    numbers: table.rows.flatMap((r, i) => numbersOf(i, r)),
  };
}

const num = (text: string, field: string | null): JudgeNumber[] => (/\d/.test(text) ? [{ text, field }] : []);

export function buildJudgeMaterialEd4(data: FinalReportData): JudgeMaterial {
  const segments: Array<JudgeSegment | null> = [];
  const facts = data.narrativeFacts;
  const kpis = data.kpiResults ?? [];
  const taskType = data.meta.taskType;
  const descriptions = data.datasetInfo?.classLabelDescriptions;

  // 4.2 종합 판정(8절 머리)
  const verdictRow = verdictRowEd4(data);
  const verdict = data.edition4Values?.verdict;
  if (verdictRow) {
    const counts = /^(\d+)개 중 (\d+)개$/.exec(verdictRow[1]);
    segments.push({
      id: "4.2-table", slot: "8", place: "4.2", kind: "table", text: "", header: [...EX_4_2_COLUMNS], rows: [verdictRow],
      numbers: counts && verdict
        ? [{ text: counts[1], field: "verdict.judged_count" }, { text: counts[2], field: "verdict.passed_count" }]
        : [],
    });
  }
  const basis = verdictBasisEd4(data);
  if (basis) segments.push(fixed("4.2-basis", "8", "4.2", basis));

  // 4.3 판정 여유 열(판 3 8.3 근소 줄) — 판정 대상 지표만, [지표, 판정 여유]
  const marginRows = kpis.filter((r) => r.judgmentMargin).map((r) => {
    const row = metricRowEd4(r, kpis);
    return [row[1], row[6]];
  });
  if (marginRows.length > 0) {
    segments.push({
      id: "4.3-margin", slot: "8.3", place: "4.3", kind: "table", text: "",
      header: [EX_4_3_COLUMNS[1], EX_4_3_COLUMNS[6]], rows: marginRows, numbers: [],
    });
  }

  // 3.3 예측 산출(판 3 7.1 앞 고정 문구 9)
  const derivation = derivationEd4(data);
  if (derivation) {
    const threshold = data.meta.derivedPrediction?.threshold;
    segments.push(fixed("3.3-derivation", "7.1", "3.3", derivation.statement,
      typeof threshold === "number" ? num(String(threshold), "derived_prediction.threshold") : []));
    if (derivation.perLabelRows.length > 0) {
      segments.push({
        id: "3.3-per-label", slot: "7.1", place: "3.3", kind: "table", text: "", header: [...ED3_PER_LABEL_COLUMNS],
        rows: derivation.perLabelRows.map((r) => [...r]), numbers: [],
      });
    }
  }

  // 4.4 오분류(판 3 7.1)
  const counts = data.confusionCounts;
  segments.push(tableSegment("4.4-counts", "7.1", "4.4", confusionCountsTable(counts), (i, row) => {
    const label = counts!.rows[i].label;
    return (["tp", "tn", "fp", "fn"] as const).flatMap((k, j) => num(row[j + 1], `confusion_counts.${label}.${k}`));
  }));
  if (data.errorRatioSentence) segments.push(fixed("4.4-fixed17", "7.1", "4.4", data.errorRatioSentence));
  segments.push(tableSegment("4.4-weakest", "7.1", "4.4", weakestClassTable(facts, kpis, descriptions, taskType), (_i, row) => [
    ...num(row[1], "facts.weakest_class.f1"),
    ...num(row[2], "facts.weakest_class.support"),
    ...num(row[3], "facts.weakest_class.share"),
    ...num(row[4], "facts.weakest_class.gap"),
  ]));
  const bias = facts?.prediction_bias;
  segments.push(tableSegment("4.4-bias", "7.1", "4.4", predictionBiasTable(facts, descriptions), (i, row) => {
    const label = bias!.rows[i].label ?? "*";
    return [
      ...num(row[1], `facts.prediction_bias.${label}.predicted`),
      ...num(row[2], `facts.prediction_bias.${label}.actual`),
      ...num(row[3], `facts.prediction_bias.${label}.difference`),
    ];
  }));
  const pairs = facts?.top_confusion_pairs ?? [];
  segments.push(tableSegment("4.4-pairs", "7.1", "4.4", confusionPairsTable(facts, taskType, descriptions), (i, row) => {
    const p = pairs[i];
    return [...num(row[1], `facts.top_confusion_pairs.${p.actual}>${p.predicted}.count`),
      ...num(row[2], `facts.top_confusion_pairs.${p.actual}>${p.predicted}.share_of_errors`)];
  }));
  segments.push(tableSegment("4.4-threshold", "7.1", "4.4", thresholdTable(data.edition4Values?.thresholdTable)));

  // 5절 칸 앞뒤 고정 문구
  if (data.sourceRelationSentence?.trim()) segments.push(fixed("5.1-fixed11", "8.2", "5.1", data.sourceRelationSentence));
  if (data.labelCautionSentence?.trim()) segments.push(fixed("5.3-fixed12", "7.2", "5.3", data.labelCautionSentence));
  if (data.noBenchmarkSentence?.trim()) segments.push(fixed("4.6-fixed16", "8.1", "4.6", data.noBenchmarkSentence));
  // 빈 칸 고정 문구 — 그 칸 서술이 빈 글일 때만 찍힌다(백엔드가 서술 결과로 고른다)
  segments.push({ ...fixed("5.4-b18", "8.1", "5.4", B18_NOT_APPLICABLE), when: "slot_empty" });
  segments.push({ ...fixed("5.6-fixed15", "7.3", "5.6", NO_ADDITIONAL_OBSERVATION_TEXT), when: "slot_empty" });

  // 6절 권고표의 프론트 몫(우선순위·대응 문제) — 문제 0개면 고정 6
  const problems = data.problems ?? [];
  if (data.problems !== undefined && problems.length === 0) {
    segments.push(fixed("6-fixed6", "9", "6", NO_PROBLEM_SENTENCE));
  }
  for (const { slot, edition4_place } of ED4_RECOMMEND_SECTIONS) {
    const mine = problems.filter((p) => p.recommend_section === slot);
    if (mine.length === 0) continue;
    segments.push({
      id: `${edition4_place}-recommend`, slot: "9", place: edition4_place, kind: "recommend_rows", text: "",
      header: [...EX_RECOMMEND_COLUMNS], rows: mine.map((p) => [priorityLabelEd4(p.priority), problemLabel(p)]),
      row_keys: mine.map((p) => p.id), numbers: [],
    });
  }

  return {
    version: JUDGE_MATERIAL_VERSION,
    material_check_version: data.materialCheck?.version ?? null,
    segments: segments.filter((s): s is JudgeSegment => s !== null),
  };
}
