/**
 * 판 4 부록 1(성적서 점검 결과) 글 — 심판 라운드 J7(계획 15-4).
 *
 * 문안 출처 규칙(고정 문구 3절 끝): 1.1 요약 문장은 고정 문구 3절 그대로, 머리 문장·소제목·표 제목과 머리·1.4 줄은 예시본 부록 1 글자
 * 그대로, 예시본에 없는 갈래(보고 항목 일부 빠짐, 신뢰구간 없음, 충족 지표 여럿, 목적별 점검 0개, 1.3 검사 건수의 셈)는 고정 문구
 * B49~B58. 시험(`appendix.test.ts`)이 고정 문구 사본(`fixedWording.ed4.json` 의 appendix1·appendixB_raw)과 글자를 대조한다.
 *
 * 예시본·B49~B58 에 없던 글(목적별 점검 행의 선언·필요한 것, 지연시간 "충족", 점검 수 밖 머리의 곳 수 등)은 고정 문구 3절 "예시본과
 * B49~B58에 없는 부록 글" 문단(2026-10-29 민서 승인)이 정본이다 — 사본 `appendix1.approved_extra` 와 글자 대조.
 */

/** 예시본 부록 1 글자. */
export const APPENDIX_TITLE = "부록 1. 성적서 점검 결과";
export const APPENDIX_LEAD =
  "이 성적서에 들어가야 할 내용이 모두 들어갔는지 점검한 결과이다. 1~4절은 정해진 점검 규칙으로, 5~6절의 소견은 시험 데이터와 대조해 점검하였다.";
/** 부록 소제목(ED4_TITLES 와 따로 — 번호가 "부록 1.1" 꼴이라 절 번호 정렬에 넣지 않는다, 계획 15-3). */
export const APPENDIX_TITLES = {
  "1.1": "부록 1.1 요약",
  "1.2": "부록 1.2 시험 결과 점검(1~4절)",
  "1.3": "부록 1.3 소견 점검(5~6절)",
  "1.4": "부록 1.4 점검 방법과 한계",
} as const;
export const APPENDIX_REPORTING_TITLE = "TS 4213 보고 항목";
export const APPENDIX_REPORTING_COLUMNS = ["보고 항목", "실린 곳", "결과"] as const;
export const APPENDIX_OUTSIDE_HEAD = "TS 4213이 보고를 요구하는 14곳 가운데 다음 {n}곳은 위 점검 수에 넣지 않았다.";
export const APPENDIX_OUTSIDE_COLUMNS = ["보고 요구", "실린 곳", "결과"] as const;
export const APPENDIX_PURPOSE_TITLE = "목적별 점검";
export const APPENDIX_PURPOSE_COLUMNS = ["선언", "필요한 것", "결과"] as const;
export const APPENDIX_PURPOSE_NOT_APPLIED = "이 성적서에 적용되지 않는 목적별 점검 {n}개는 싣지 않았다.";
export const APPENDIX_RECORD_TITLE = "입력 점검 기록";
export const APPENDIX_RECORD_COLUMNS = ["항목", "기록"] as const;
export const APPENDIX_RECORD_ACK = "부족 항목 안내 확인";
export const APPENDIX_AXES_TITLE = "검증 결과";
export const APPENDIX_AXES_COLUMNS = ["검사", "확인한 것", "검사 건수", "결과"] as const;
export const APPENDIX_CHECKLIST_TITLE = "필수 내용 확인";
export const APPENDIX_CHECKLIST_COLUMNS = ["필수 내용", "서술 위치"] as const;
export const APPENDIX_COVERAGE_NOT_APPLIED = "이 성적서에 적용되지 않는 필수 내용 {n}개는 싣지 않았다.";

/** 예시본 1.2 의 결과 글. */
export const APPENDIX_PROVIDED = "제공";
export const APPENDIX_NOT_PROVIDED = "제공되지 않음";
export const APPENDIX_NONE_PLACE = "—";
/** 점검 수 밖 줄(예시본 1.2 둘째 표의 세 행). */
export const OUTSIDE_12 = { name: "멀티레이블 지표의 선택 기준", notApplicable: "해당 없음 (다중 레이블에만 적용)" } as const;
export const OUTSIDE_13 = {
  name: "다중 클래스 평균 방식의 선택 기준",
  notApplicable: "해당 없음 (다중 클래스에만 적용)",
  /** 재료 선택 점검 4.2 표 아래(점검-2, 2026-10-29 민서 결정). 다중 클래스만. */
  recorded: "기재 (의뢰자가 밝힌 클래스 중요도와, 그에 맞는 평균 방식 지표가 시험 항목에 있는지)",
} as const;
export const OUTSIDE_14 = { name: "통계적 유의성 검정의 적용 여부", recorded: "기재 (모든 성적서에 늘 적음)" } as const;

/** 예시본 1.3 표의 검사 이름·확인한 것과 결과 글. */
export const AXIS_ROWS = {
  faithfulness: { name: "사실 일치", what: "소견의 숫자·이름·비교가 시험 데이터와 맞는가", all: "모두 일치" },
  consistency: { name: "일관성", what: "판정·수치·권고가 서로 어긋나지 않는가", all: "모순 없음" },
  coverage: { name: "필수 내용", what: "독자가 알아야 할 내용을 담았는가", all: "모두 서술" },
  readability: { name: "표기", what: "로마자 코드값과 서술체 규칙을 지켰는가" },
} as const;
/** 예시본 1.3 검사 건수 꼴. */
export const AXIS_COUNT_CASES = "{n}건";
export const AXIS_COUNT_ITEMS = "{n}개";

/** 예시본 1.4 줄. */
export const METHOD_RULES = "1~4절은 입력 점검 규칙 {v}(으)로 점검하였다.";
export const METHOD_AUTOMATIC = "5~6절의 소견은 시험 데이터와 자동으로 대조하였으며, 사람의 검토가 아니다.";
export const METHOD_TARGET = "목표값이 모델 용도에 적절한지는 판단하지 않는다.";
export const METHOD_CRITERIA = "5~6절 점검 기준은 v{버전}이다.";

/** 고정 문구 B49~B56(Q8 승인). B49 — 보고 항목 일부만 빠짐(빠진 칸 이름을 쉼표로). */
export const B49_PARTIAL = "제공되지 않음 (빠진 것: {빠진 칸})";
/** B50 — 신뢰구간이 하나도 없는 성적서의 14번 줄. */
export const B50_NO_CI = "해당 없음 (신뢰구간을 산출하지 않음)";
/** B51 — 목적별 점검 충족(충족시킨 지표를 의뢰자가 고른 순서로 쉼표). */
export const B51_MET = "충족 ({지표 이름})";
/** B52 — 적용되는 목적별 점검이 0개(표를 그리지 않는다). */
export const B52_NO_PURPOSE = "목적별 점검 없음 (선택한 평가 목적에 해당하는 점검이 없음)";
/** B53 — 사실 일치 결과(전부 일치가 아닐 때. 전부 일치면 예시본 "모두 일치"). */
export const B53_FAITHFULNESS = "{n}건 중 {m}건 일치";
/** B55 — 필수 내용 결과(전부 서술이 아닐 때. 전부면 예시본 "모두 서술"). 체크리스트에서 빠진 항목은 "서술되지 않음"(심판 설계 5.5). */
export const B55_COVERAGE = "적용 {M}항목 중 {m}항목 서술됨 (해당 없음 {k})";
export const COVERAGE_NOT_DESCRIBED = "서술되지 않음";
/** B56 — 표기 검사 건수·결과. */
export const B56_RULES = "코드 규칙 {n}개";
export const B56_VIOLATIONS = "위반 {n}건";
/** 일관성에 모순이 남은 경우(통과한 성적서에는 나오지 않는다 — 닫힌 쪽 대비). */
export const CONSISTENCY_CONTRADICTIONS = "모순 {n}건";
/** 목적별 점검 미충족(심판 설계 5.5 표 "충족 (지표 이름)" 또는 "미충족"). */
export const PURPOSE_UNMET = "미충족";
/** 목적별 점검 충족인데 지표로 채우는 줄이 아님(지연시간) — 지표 이름 없이(고정 문구 3절 승인 글). */
export const PURPOSE_MET_NO_METRIC = "충족";

/** 목적별 점검 행의 선언·필요한 것(재료 선택 점검 4.3 "점검 줄 4개"). FN 갈래는 예시본 글자. */
export const PURPOSE_ROW_TEXT = {
  riskFN: { name: "위험 방향이 FN", need: "재현율 또는 β가 1보다 큰 Fβ" },
  riskFP: { name: "위험 방향이 FP", need: "정밀도 또는 β가 1보다 작은 Fβ" },
  latency: { name: "사용 방식이 대화형", need: "지연시간" },
  averaging: { name: "클래스 중요도를 고름", need: "{평균 방식} 지표" },
  curveImbalance: { name: "불균형이 크고(IR > 9) 곡선 지표를 고름", need: "AUPRC" },
} as const;

/** 판 4 에서 보고 항목이 실린 곳(예시본 1.2 의 실린 곳 칸 — 12번은 멀티레이블 3.1 지표 선택 기준 고정 문구 5 자리). */
export const REPORTING_PLACE_ED4: Record<number, string> = {
  1: "2.3",
  2: "2.2",
  3: "2.3",
  4: "2.2",
  5: "2.2",
  6: "4.4",
  7: "2.1",
  8: "4.8",
  9: "2.3",
  10: "2.1",
  11: "2.1",
  12: "3.1",
};
/** 13번(다중 클래스)의 실린 곳 — 3.3 평균 방식 문장(B7) 자리. 14번은 1.3 고정 문구 3 자리. */
export const OUTSIDE_13_PLACE = "3.3";
export const OUTSIDE_14_PLACE = "1.3";
