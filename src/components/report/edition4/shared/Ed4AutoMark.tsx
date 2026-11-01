/**
 * 판 4 자동 작성 표시(서술 설계 D54) — 서술 칸의 글을 감싸 왼쪽에 세로줄을 긋는다. 뜻은 5절 머리 ※ 줄 바로 아래 범례
 * (고정 문구 27, `edition4Text.ED4_FIXED_27`)가 알린다.
 *
 * - 칸 단위로 긋는다(칸의 범위는 D36: 7.1·7.2·7.3·8.1·8.2·8.3·9 — 9 는 6.1·6.2 서술과 권고표가 한 칸). 칸 안에서도 소절 제목과
 *   코드가 찍는 고정 문구(11a·11b·12)는 감싸지 않는다 — 감쌀지는 `findingsEd4`·`recommendEd4` 의 순수 함수가 정한다(여기는 모양만).
 * - AI 칸·규칙 템플릿 대체 칸 모두 같은 모양(D46 — 대체 사실은 인쇄하지 않는다). 화면·인쇄 같은 모양(성적서 본문).
 * - `data-ed4-auto-mark` 에 칸(9 칸은 부분 6.1·6.2 의 칸 이름 9.1·9.2)을 적는다 — 시험이 이 속성으로 어디에 그었는지 단정한다.
 *
 * 선 모양(2px, #444, 글과 10px)은 실제 인쇄 탭(`/report/:id/print`)의 PDF 를 회색조·1비트(임계 128)로 바꿔 견줘 정했다:
 * - #444(회색값 68)는 1비트에서도 선이 그대로 남는다. #777(119)은 남지만 임계에 붙어 있고, #999(153)·#bbb(187)는 1비트에서
 *   통째로 사라진다. 1px #000 도 남지만 0.26 mm 로 가늘어 저해상도 스캔에서 여유가 적고 본문 글자와 같은 검정이라 더 무겁다.
 * - 간격은 6·10·14px 을 견줘 10px(약 2.6 mm) — 6px 은 글에 붙어 보이고 14px 은 글에서 떠 보인다.
 * - 선은 글 왼쪽 여백 쪽에 둔다(음수 margin — 글 시작 위치는 제목·다른 문단과 같다). 안쪽에 두면(padding 으로 글을 밀면)
 *   칸 글만 들여 써져 표 폭도 줄어든다.
 * - `border-left` 는 인쇄 "배경 그래픽" 설정과 무관하게 찍힌다(box-shadow·배경 그라데이션은 배경으로 취급될 수 있다).
 *   칸이 쪽 사이에서 나뉘면 잘린 조각마다 선이 그어진다(앞 쪽은 쪽 본문 끝까지, 다음 쪽은 위에서 다시).
 * 감싼 상자는 위·아래 여백이 없어 첫·끝 문단의 바깥 여백이 상자 밖으로 빠진다 — 그래서 선의 위·아래 끝이 칸 글의 첫·끝 줄과 맞는다.
 */
import type { CSSProperties, ReactNode } from "react";

/** 선 모양 — 굵기·색·글과의 간격. */
export const ED4_AUTO_MARK_LINE = { width: "2px", color: "#444444", gap: "10px" } as const;

const STYLE: CSSProperties = {
  borderLeft: `${ED4_AUTO_MARK_LINE.width} solid ${ED4_AUTO_MARK_LINE.color}`,
  paddingLeft: ED4_AUTO_MARK_LINE.gap,
  marginLeft: `calc(-1 * (${ED4_AUTO_MARK_LINE.width} + ${ED4_AUTO_MARK_LINE.gap}))`,
};

export function Ed4AutoMark({ slot, children }: { slot: string; children: ReactNode }) {
  return (
    <div data-ed4-auto-mark={slot} style={STYLE}>
      {children}
    </div>
  );
}
