/**
 * 판 4 6절 개선 권고(판 4 라운드 계획 4절, 갈래 b5) — 6.1 데이터(권고 칸 9.1)·6.2 모델과 운영(9.2). 배치는 순수 함수 `ed4RecommendLayout`.
 * - 소절마다 칸 서술 + 표 "우선순위 | 대응 문제 번호 | 권고 | 기대 효과". 한쪽에 문제가 없으면 표 없이 서술만(부록 B19).
 * - 문제가 하나도 없으면 고정 문구 6 만. 문제 목록이 아직 없는 초안은 판 3 처럼 칸 자리표시 + 권고 표 자리 안내.
 * - 9 칸 배지(규칙 기반)는 판 3 9절처럼 절 제목 옆에, **화면에만**.
 * - 자동 작성 표시(서술 설계 D54): 9 칸은 6.1·6.2 서술과 권고표가 한 칸(D36)이라 소절마다 서술과 권고표를 `Ed4AutoMark` 로 감싼다
 *   (둘 다면 한 줄로 이어서). 소절 제목·고정 문구 6·자리표시는 감싸지 않는다(판정은 `ed4RecommendLayout` 의 `autoMarked`).
 */
import { SectionSourceBadge } from "../shared/SectionSourceBadge";
import { Ed4SlotBodyView, Ed4SlotHeading } from "./Ed4Findings";
import { Ed4AutoMark } from "./shared/Ed4AutoMark";
import type { Ed4PartProps } from "./shared/ed4PartProps";
import { Ed4SectionTitle } from "./shared/Ed4Headings";
import { Ed4Paragraph } from "./shared/Ed4Paragraph";
import { Ed4Table } from "./shared/Ed4Table";
import { NO_PROBLEM_SENTENCE } from "../../../lib/report/reportConstants";
import { ed4RecommendLayout, type Ed4RecommendSide } from "../../../lib/report/edition4/render/recommendEd4";
import { EX_RECOMMEND_COLUMNS } from "../../../lib/report/edition4/render/recommendText";

/**
 * 소절 하나의 몸통 — 서술 + 권고표. 자동 작성 표시가 붙는 쪽끼리 이어지면(서술·표 둘 다) 한 `Ed4AutoMark` 안에 넣어 선이 끊기지
 * 않게 하고, 한쪽만이면 그쪽만 감싼다.
 */
function Ed4RecommendSideBody({ side }: { side: Ed4RecommendSide }) {
  const body = <Ed4SlotBodyView body={side.body} />;
  const table = side.rows && <Ed4Table columns={EX_RECOMMEND_COLUMNS} rows={side.rows} />;
  const marked = side.autoMarked;
  if (marked.body && marked.rows) {
    return (
      <Ed4AutoMark slot={side.slot}>
        {body}
        {table}
      </Ed4AutoMark>
    );
  }
  return (
    <>
      {marked.body ? <Ed4AutoMark slot={side.slot}>{body}</Ed4AutoMark> : body}
      {marked.rows ? <Ed4AutoMark slot={side.slot}>{table}</Ed4AutoMark> : table}
    </>
  );
}

export function Ed4Recommend({ data, mode }: Ed4PartProps) {
  const layout = ed4RecommendLayout(data);
  const badge = layout.kind === "sides" ? layout.badge : null;
  return (
    <section data-ed4-part="Ed4Recommend">
      {mode === "screen" && badge !== null ? (
        <div className="flex items-center gap-2">
          <Ed4SectionTitle number="6" />
          <SectionSourceBadge kind={badge} />
        </div>
      ) : (
        <Ed4SectionTitle number="6" />
      )}
      {layout.kind === "no_problem" ? (
        <Ed4Paragraph>{NO_PROBLEM_SENTENCE}</Ed4Paragraph>
      ) : (
        <>
          {layout.sides.map((side) => (
            <div key={side.place} data-ed4-slot={side.slot}>
              <Ed4SlotHeading place={side.place} badge={null} mode={mode} />
              <Ed4RecommendSideBody side={side} />
            </div>
          ))}
          {layout.itemsPlaceholder !== null && <Ed4Paragraph>{layout.itemsPlaceholder}</Ed4Paragraph>}
        </>
      )}
    </section>
  );
}
