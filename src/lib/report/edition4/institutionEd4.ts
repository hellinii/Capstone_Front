/**
 * 판 4 시험기관 주소·이메일 — 재료 목록 "시험기관 정보" 행의 고정값(2026-10-26 결정, 서술 설계 D48). 지금 값은 가상이며, 실제
 * 주소가 정해지면 값만 바꾼다. 전화는 싣지 않는다. ISO/IEC 17025 §7.8.2.1 b)(시험기관 이름과 주소)를 채우려고 싣는다.
 *
 * 기관 이름과 같은 길로 저장한다: 기관 이름("리트머스")은 run 을 만들 때 `DEFAULT_PERFORMER` 가 `FinalReportData.performer` 에
 * 들어가 저장되고, 발급본은 그 저장 데이터를 서버에 보관한다. 주소·이메일도 **판 4 run 을 만들 때** 같은 `performer` 에 찍어 둔다.
 * 그래서 이 값을 나중에 바꿔도 이미 만든 판 4 run 과 발급본(보관된 저장 데이터)의 글은 바뀌지 않는다(§6.6 끝 "발급 당시 모양").
 * 그리는 쪽(표지 발급 기관 줄·1.1 시험기관 표)은 저장된 `performer.address`·`performer.email` 만 읽고, 이 상수를 읽지 않는다.
 *
 * 서버 기관 행(`GET /api/organization`, 발급 기록의 기관 스냅샷)은 쓰지 않는다 — 그 행에는 지금 주소가 비어 있고 이메일 칸이
 * 없어서, 서버 값을 함께 보면 같은 값을 두 곳에서 정하게 된다(판정 지점 하나). `applyIssuance` 는 이 두 칸을 그대로 둔다.
 * 판 3 run 의 `performer` 에는 이 두 칸이 없다(판 3 저장 데이터를 바꾸지 않는다).
 */
import type { PerformerInfo } from "../../../types/finalReport.types";
import { DEFAULT_PERFORMER } from "../reportConstants";

/** 재료 목록 "시험기관 정보" 행의 주소·이메일(가상 값). 예시본 표지·1.1 시험기관 표의 글자와 같다. */
export const ED4_INSTITUTION_CONTACT: Readonly<Required<Pick<PerformerInfo, "address" | "email">>> = {
  address: "서울특별시 중구 시험로 123, 4층",
  email: "contact@litmus.example",
};

/** 판 4 run 을 만들 때 저장하는 수행기관 — 판 3 과 같은 이름·평가자·연락처에 주소·이메일을 더한다. */
export function performerEd4(): PerformerInfo {
  return { ...DEFAULT_PERFORMER, ...ED4_INSTITUTION_CONTACT };
}
