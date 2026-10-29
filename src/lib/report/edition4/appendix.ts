/**
 * 판 4 부록 1(성적서 점검 결과) 글 만들기 — 심판 라운드 J7(계획 15-2).
 *
 * 심판을 통과한 서술을 합칠 때 **한 번** 부른다(`useReportData` 의 mergeNarrative). 결과(`Appendix1Ed4`)를 성적서 데이터에 저장하고
 * 그릴 때는 다시 계산하지 않는다 — 발급 보관본의 모양이 나중 코드로 바뀌지 않게. 통과하지 않았거나(검증 중·보류) 판 4 가 아니면
 * 만들지 않는다(부록 자리를 비움 — 고정 문구 B58).
 *
 * 재료:
 * - 1.1·1.2 — 재료 선택 점검 결과(`materialCheck`, 판정할 때 판 4 행까지 만든 것 `printed.appendix`)와 신뢰구간 유무(14번 줄).
 * - 1.3 — 고객용 심판 묶음의 건수·체크리스트(`judge.counts`). 근거 인용·사유는 오지 않는다.
 * - 1.4 — 입력 점검 규칙 버전(`materialCheck.version`)과 점검 기준 버전(`judge.criteriaVersion`).
 *
 * 글 출처는 `appendixText.ts` 머리(고정 문구 3절 → 예시본 → B49~B58). 성적서를 판정하는 말·AI·모델 이름은 쓰지 않는다(D46).
 */
import type { Appendix1Ed4, AppendixRow3, FinalReportData } from "../../../types/finalReport.types";
import type { JudgeBundle, JudgeCoverageItem } from "../judgeBundle";
import { josaEuroRoNumber } from "../koreanJosa";
import { fillTemplate } from "./edition4Text";
import { isEdition4Content } from "../reportLock";
import {
  APPENDIX_COVERAGE_NOT_APPLIED,
  APPENDIX_NONE_PLACE,
  APPENDIX_OUTSIDE_HEAD,
  APPENDIX_PURPOSE_NOT_APPLIED,
  AXIS_COUNT_CASES,
  AXIS_COUNT_ITEMS,
  AXIS_ROWS,
  B50_NO_CI,
  B52_NO_PURPOSE,
  B53_FAITHFULNESS,
  B55_COVERAGE,
  B56_RULES,
  B56_VIOLATIONS,
  CONSISTENCY_CONTRADICTIONS,
  COVERAGE_NOT_DESCRIBED,
  METHOD_AUTOMATIC,
  METHOD_CRITERIA,
  METHOD_RULES,
  METHOD_TARGET,
  OUTSIDE_14,
  OUTSIDE_14_PLACE,
} from "./appendixText";

/** 고정 문구 3절 — 1.1 요약 문장의 세 자리(따로 고른다)와 빠진 목록 머리. */
export const SUMMARY_TEXT = {
  reporting: { all: "이 성적서는 TS 4213 보고 항목 {N}개를 모두 제공받았고,", some: "이 성적서는 TS 4213 보고 항목 {N}개 중 {n}개를 제공받았고," },
  purpose: { all: "목적별 점검 {K}개를 모두 충족하였으며,", some: "목적별 점검 {K}개 중 {k}개를 충족하였으며," },
  coverage: { all: "적용되는 필수 내용 {M}개를 모두 서술하였다.", some: "적용되는 필수 내용 {M}개 중 {m}개를 서술하였다." },
} as const;
export const MISSING_LEAD = "빠진 내용과 그 영향은 다음과 같다.";

/** 고정 문구 3절 — 필수 내용 18개의 고객용 이름과 빠졌을 때 영향 문장(순서 = 심판 기준의 항목 순서). */
export const COVERAGE_ITEMS: ReadonlyArray<{ id: string; name: string; impact: string }> = [
  { id: "분석-1", name: "가장 약한 클래스", impact: "가장 약한 클래스와 그 값은 4.4 표에만 있고 소견에서 해석하지 않았다." },
  { id: "분석-2", name: "가장 많이 틀린 곳", impact: "가장 많이 틀린 곳과 그 건수는 4.4 표에만 있고 소견에서 해석하지 않았다." },
  { id: "분석-3", name: "클래스 불균형의 영향", impact: "불균형 비율은 4.5에 값만 있고, 그 영향은 소견에서 해석하지 않았다." },
  { id: "분석-4", name: "오류의 성격", impact: "오류가 판정 경계 근처에서 났는지, 높은 확신으로 났는지 소견에서 다루지 않았다." },
  { id: "분석-5", name: "평균 방식 사이의 차이", impact: "평균 방식(매크로·가중·마이크로)에 따라 지표값이 달라지는 이유를 소견에서 설명하지 않았다." },
  { id: "분석-6", name: "학습·평가 데이터의 분포 차이", impact: "두 데이터의 클래스 비율은 4.5에 값만 있고, 그 차이가 결과에 주는 영향은 소견에서 다루지 않았다." },
  { id: "분석-7", name: "선언한 위험 쪽 오류", impact: "의뢰자가 더 위험하다고 선언한 오류의 건수는 4.4 표에만 있고, 그 의미는 소견에서 다루지 않았다." },
  { id: "소견-1", name: "판정과 판정 규칙", impact: "판정은 4.2에, 판정 규칙은 3.4에 있으나 소견에서 둘을 연결해 설명하지 않았다." },
  { id: "소견-2", name: "지표별 기준 충족 정도", impact: "지표마다 기준을 얼마나 넘거나 못 넘었는지는 4.3 표에만 있고 소견에서 설명하지 않았다." },
  { id: "소견-3", name: "참조 범위 대비 위치", impact: "지표가 참조 범위(벤치마크)의 어디에 있는지는 4.6 표에만 있고 소견에서 해석하지 않았다." },
  { id: "소견-4", name: "응답 시간의 용도 적합성", impact: "응답 시간은 4.8에 값만 있고, 모델 용도에 충분한지는 소견에서 판단하지 않았다." },
  { id: "소견-5", name: "운영 시 예상되는 실패", impact: "운영에 들어갔을 때 예상되는 실패를 소견에서 다루지 않았다." },
  { id: "소견-6", name: "결과의 불확실성", impact: "주요 지표의 신뢰구간은 4.3 표에만 있고, 그것이 판정을 흔들 수 있는지는 소견에서 해석하지 않았다." },
  { id: "소견-7", name: "평가 데이터의 대표성", impact: "평가 데이터의 출처는 2.2에 있으나, 모델 용도를 얼마나 대표하는지는 소견에서 다루지 않았다." },
  { id: "소견-8", name: "목표값의 수준", impact: "목표값이 참조 범위보다 낮거나 높다는 사실은 4.6 표에만 있고 소견에서 짚지 않았다." },
  { id: "권고-1", name: "권고의 근거", impact: "각 권고가 어떤 약점에서 나왔는지 설명하지 않았다." },
  { id: "권고-2", name: "권고의 우선순위", impact: "권고 사이의 우선순위를 설명하지 않았다." },
  { id: "권고-3", name: "권고의 기대 효과", impact: "권고를 따르면 무엇이 나아지는지 설명하지 않았다." },
];

/**
 * 멀티레이블 성적서는 "클래스"를 "레이블"로 바꿔 찍는다(고정 문구 3절). 끝소리가 달라(스 → 블, 받침 ㄹ) 바로 뒤 조사도 바꾼다 —
 * "클래스와" → "레이블과", "클래스가" → "레이블이", "클래스는" → "레이블은", "클래스를" → "레이블을"("로"는 ㄹ 받침이라 그대로).
 */
const ML_PARTICLES: Record<string, string> = { 와: "과", 가: "이", 는: "은", 를: "을" };
const forTask = (text: string, multilabel: boolean) =>
  multilabel ? text.replace(/클래스([와가는를])?/g, (_m, p?: string) => `레이블${p ? ML_PARTICLES[p] : ""}`) : text;

/** 심판 묶음의 체크리스트 항목을 기준 순서로(모르는 id 는 뒤에, 받은 순서). */
function orderedItems(items: JudgeCoverageItem[]): Array<JudgeCoverageItem & { name: string; impact: string }> {
  const known = COVERAGE_ITEMS.flatMap((def) => {
    const item = items.find((i) => i.id === def.id);
    return item ? [{ ...item, name: def.name, impact: def.impact }] : [];
  });
  const unknown = items.filter((i) => !COVERAGE_ITEMS.some((d) => d.id === i.id)).map((i) => ({ ...i, name: i.id, impact: "" }));
  return [...known, ...unknown];
}

/** 부록 1 을 만들 수 있으면 글, 아니면 null(판 4 아님·심판 통과 아님·재료 선택 점검 판 4 행 없음). */
export function buildAppendix1(report: FinalReportData, judge: JudgeBundle | undefined): Appendix1Ed4 | null {
  if (!isEdition4Content(report) || !judge || judge.gate !== "passed" || !judge.counts) return null;
  const check = report.materialCheck;
  const rows = check?.printed.appendix;
  if (!check || !rows) return null;
  const multilabel = report.meta.taskType === "multilabel";
  const counts = judge.counts;
  const coverage = counts.coverage;
  const items = coverage ? orderedItems(coverage.items) : [];

  // 1.1 요약 문장 — 세 자리를 따로 고른다. 목적별 점검이 0개면 그 구절을 뺀다. 필수 내용 축을 뺐으면(7.7) 그 구절도 뺀다.
  const { total: N, provided: n } = check.reporting;
  const { applicable: K, met: k } = check.purpose;
  const parts = [fillTemplate(n === N ? SUMMARY_TEXT.reporting.all : SUMMARY_TEXT.reporting.some, { N: String(N), n: String(n) })];
  if (K > 0) parts.push(fillTemplate(k === K ? SUMMARY_TEXT.purpose.all : SUMMARY_TEXT.purpose.some, { K: String(K), k: String(k) }));
  if (coverage) {
    parts.push(
      fillTemplate(coverage.described === coverage.applicable ? SUMMARY_TEXT.coverage.all : SUMMARY_TEXT.coverage.some, {
        M: String(coverage.applicable),
        m: String(coverage.described),
      }),
    );
  }
  let summary = parts.join(" ");
  // 필수 내용 구절이 없으면 앞 구절의 이음 끝("…받았고," / "…하였으며,")으로 문장이 끝나지 않게 마침표로 맺는다.
  if (!coverage) summary = summary.replace(/(받았고|하였으며),$/, (_m, w: string) => (w === "받았고" ? "받았다." : "하였다."));

  // 1.1 빠진 목록 — 보고 항목 줄(항목 번호 순) → 목적별 줄(점검 순서) → 필수 내용 줄. 지연시간이 보고 항목 8번과 목적별
  // 점검으로 함께 빠지면 보고 항목 줄 하나만(고정 문구 3절, D32).
  const latencyMissing = check.reporting.items.some((item) => item.item === 8 && !item.provided);
  const missing = [
    ...check.printed.impacts,
    ...check.purpose.lines
      .filter((line) => !line.met && !(line.id === "latency" && latencyMissing))
      .map((line) => `${line.title}: ${line.shortfall}`),
    ...items.filter((i) => !i.described && i.impact).map((i) => `${forTask(i.name, multilabel)}: ${forTask(i.impact, multilabel)}`),
  ];

  // 1.2 점검 수 밖 — 12·13번(판정 때 만든 행) + 14번(신뢰구간 유무).
  const hasCi = report.confidenceIntervalNote !== undefined;
  const outside: AppendixRow3[] = [
    ...rows.outside,
    hasCi
      ? { name: OUTSIDE_14.name, middle: OUTSIDE_14_PLACE, result: OUTSIDE_14.recorded }
      : { name: OUTSIDE_14.name, middle: APPENDIX_NONE_PLACE, result: B50_NO_CI },
  ];
  const purposeNote =
    rows.purpose.length === 0
      ? B52_NO_PURPOSE
      : rows.purposeNotApplied > 0
        ? fillTemplate(APPENDIX_PURPOSE_NOT_APPLIED, { n: String(rows.purposeNotApplied) })
        : null;

  // 1.3 검증 결과 — 실은 축만, 계약 순서.
  const axes: Appendix1Ed4["axes"] = [];
  for (const axis of judge.axes) {
    if (axis === "faithfulness" && counts.faithfulness) {
      const { checked, matched } = counts.faithfulness;
      axes.push([
        AXIS_ROWS.faithfulness.name,
        AXIS_ROWS.faithfulness.what,
        fillTemplate(AXIS_COUNT_CASES, { n: String(checked) }),
        matched === checked ? AXIS_ROWS.faithfulness.all : fillTemplate(B53_FAITHFULNESS, { n: String(checked), m: String(matched) }),
      ]);
    } else if (axis === "consistency" && counts.consistency) {
      const { checked, contradictions } = counts.consistency;
      axes.push([
        AXIS_ROWS.consistency.name,
        AXIS_ROWS.consistency.what,
        fillTemplate(AXIS_COUNT_CASES, { n: String(checked) }),
        contradictions === 0 ? AXIS_ROWS.consistency.all : fillTemplate(CONSISTENCY_CONTRADICTIONS, { n: String(contradictions) }),
      ]);
    } else if (axis === "coverage" && coverage) {
      axes.push([
        AXIS_ROWS.coverage.name,
        AXIS_ROWS.coverage.what,
        fillTemplate(AXIS_COUNT_ITEMS, { n: String(coverage.applicable) }),
        coverage.described === coverage.applicable
          ? AXIS_ROWS.coverage.all
          : fillTemplate(B55_COVERAGE, {
              M: String(coverage.applicable),
              m: String(coverage.described),
              k: String(coverage.notApplicable),
            }),
      ]);
    } else if (axis === "readability" && counts.readability) {
      axes.push([
        AXIS_ROWS.readability.name,
        AXIS_ROWS.readability.what,
        fillTemplate(B56_RULES, { n: String(counts.readability.rules) }),
        fillTemplate(B56_VIOLATIONS, { n: String(counts.readability.violations) }),
      ]);
    }
  }

  // 1.3 필수 내용 확인 — 적용 항목마다 실제로 찍힌 자리(Q5), 빠진 항목은 "서술되지 않음".
  const checklist: Appendix1Ed4["checklist"] = items.map((i) => [
    forTask(i.name, multilabel),
    i.described && i.place ? i.place : COVERAGE_NOT_DESCRIBED,
  ]);
  const checklistNote =
    coverage && coverage.notApplicable > 0
      ? fillTemplate(APPENDIX_COVERAGE_NOT_APPLIED, { n: String(coverage.notApplicable) })
      : null;

  const version = check.version;
  return {
    summary,
    missing,
    reporting: rows.reporting,
    outsideHead: fillTemplate(APPENDIX_OUTSIDE_HEAD, { n: String(outside.length) }),
    outside,
    purpose: rows.purpose,
    purposeNote,
    inputRecord: check.printed.summary[2]?.value ?? "",
    axes,
    checklist,
    checklistNote,
    method: [
      METHOD_RULES.replace("{v}(으)로", `${version}${josaEuroRoNumber(version)}`),
      METHOD_AUTOMATIC,
      METHOD_TARGET,
      fillTemplate(METHOD_CRITERIA, { 버전: judge.criteriaVersion }),
    ],
  };
}
