/**
 * 판 4 성적서 본문(판 4 라운드 계획 2.4) — 화면·인쇄 공용. 입구 세 곳(`ReportSections`·`ReportPrint`·`NarrativeRecordPanel`)이
 * `usesSchema4(data)` 일 때만 여기로 보낸다 — 판 4 데이터는 판 3 절 컴포넌트에 들어가지 않는다.
 *
 * - 장별 부품은 이 순서로 부른다(이름 고정 — "Section" 으로 끝나지 않게: 화면↔인쇄 배선 시험이 그 이름을 소스에서 대조한다).
 * - 인쇄일 때만 묶음마다 PageBreak(첫 묶음은 페이지 앞이라 나누지 않음 — 판 3 인쇄와 같은 방식). 화면은 묶지 않는다.
 *   묶음: 표지+1절 / 2절 / 3절 / 4.1~4.3 / 4.4~4.8 / 5절 / 6절+끝. 부록 1 이 있으면(심판을 통과한 판 4 — 심판 라운드 J7) 마지막 묶음을
 *   6절 / 부록 1+발급 이력·끝 으로 나눠 부록 앞에서 쪽을 나눈다. 부록이 없으면(검증 중·보류·이전 데이터) 지금 묶음 그대로다.
 */
import { Fragment, type ReactNode } from "react";

import { PageBreak } from "../layout/PageBreak";
import { Ed4Appendix } from "./Ed4Appendix";
import { Ed4Closing } from "./Ed4Closing";
import { Ed4Cover } from "./Ed4Cover";
import { Ed4Findings } from "./Ed4Findings";
import { Ed4Method } from "./Ed4Method";
import { Ed4Overview } from "./Ed4Overview";
import { Ed4Recommend } from "./Ed4Recommend";
import { Ed4ResultsCore } from "./Ed4ResultsCore";
import { Ed4ResultsDetail } from "./Ed4ResultsDetail";
import { Ed4Target } from "./Ed4Target";
import type { Ed4PartProps } from "./shared/ed4PartProps";

export function Edition4Report({ data, mode }: Ed4PartProps) {
  const p = { data, mode };
  const groups: ReactNode[][] = [
    [<Ed4Cover key="cover" {...p} />, <Ed4Overview key="overview" {...p} />],
    [<Ed4Target key="target" {...p} />],
    [<Ed4Method key="method" {...p} />],
    [<Ed4ResultsCore key="results-core" {...p} />],
    [<Ed4ResultsDetail key="results-detail" {...p} />],
    [<Ed4Findings key="findings" {...p} />],
    ...(data.appendix1
      ? [[<Ed4Recommend key="recommend" {...p} />], [<Ed4Appendix key="appendix" {...p} />, <Ed4Closing key="closing" {...p} />]]
      : [[<Ed4Recommend key="recommend" {...p} />, <Ed4Closing key="closing" {...p} />]]),
  ];
  return (
    <div data-report-edition="4">
      {groups.map((group, i) =>
        mode === "print" && i > 0 ? <PageBreak key={i}>{group}</PageBreak> : <Fragment key={i}>{group}</Fragment>,
      )}
    </div>
  );
}
