/**
 * 판 4 부록 1(성적서 점검 결과) — 심판 라운드 J7(계획 15-3). 화면·인쇄·번호로 열기가 같은 부품을 쓴다(`Edition4Report`).
 *
 * - 그리는 글은 서술을 합칠 때 한 번 만들어 저장한 `data.appendix1`(`appendix.ts`) 그대로다 — 여기서 다시 계산하지 않는다.
 * - 저장된 부록이 없으면(검증 중·발급 보류·판 4 이전 데이터) 아무것도 그리지 않는다 — 제목도 찍지 않는다(고정 문구 B58).
 * - 부록은 서술 칸이 아니라 세로줄(D54)을 긋지 않는다. 이름이 "Section" 으로 끝나지 않는다(화면↔인쇄 배선 시험이 이름을 대조함).
 * - 모양은 예시본 부록 1: 절 제목 → 머리 문장 → 1.1 요약(빠진 목록) → 1.2 표 넷 → 1.3 표 둘 → 1.4 목록.
 */
import { Ed4TableTitle } from "./shared/Ed4Headings";
import { Ed4Paragraph } from "./shared/Ed4Paragraph";
import { ED4_KEEP_WORDS_TABLE, ED4_KEEP_WORDS_TABLE_SHORT_FIRST, Ed4Table } from "./shared/Ed4Table";
import type { Ed4PartProps } from "./shared/ed4PartProps";
import {
  APPENDIX_AXES_COLUMNS,
  APPENDIX_AXES_TITLE,
  APPENDIX_CHECKLIST_COLUMNS,
  APPENDIX_CHECKLIST_TITLE,
  APPENDIX_LEAD,
  APPENDIX_OUTSIDE_COLUMNS,
  APPENDIX_PURPOSE_COLUMNS,
  APPENDIX_PURPOSE_TITLE,
  APPENDIX_RECORD_ACK,
  APPENDIX_RECORD_COLUMNS,
  APPENDIX_RECORD_TITLE,
  APPENDIX_REPORTING_COLUMNS,
  APPENDIX_REPORTING_TITLE,
  APPENDIX_TITLE,
  APPENDIX_TITLES,
} from "../../../lib/report/edition4/appendixText";
import { MISSING_LEAD } from "../../../lib/report/edition4/appendix";
import type { AppendixRow3 } from "../../../types/finalReport.types";

function Subtitle({ number }: { number: keyof typeof APPENDIX_TITLES }) {
  return <h3 className="mt-6 break-after-avoid text-base font-semibold text-slate-800">{APPENDIX_TITLES[number]}</h3>;
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-800">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

const rows3 = (rows: AppendixRow3[]) => rows.map((r) => [r.name, r.middle, r.result]);

/**
 * 부록 표의 인쇄 모양(J7 PDF 눈 확인) — 좁은 칸에서 한국어 낱말 중간이 끊기지 않게(keep-all), 표 머리는 한 줄로, 표 제목이 쪽 끝에
 * 홀로 남지 않게. 글자는 바꾸지 않는다.
 */
const TABLE = ED4_KEEP_WORDS_TABLE;
const AXES_TABLE = ED4_KEEP_WORDS_TABLE_SHORT_FIRST;
const TITLE = "break-after-avoid";

export function Ed4Appendix({ data }: Ed4PartProps) {
  const a = data.appendix1;
  if (!a) return null;
  return (
    <section data-ed4-part="Ed4Appendix">
      <h2 className="mt-10 text-xl font-semibold text-slate-900">{APPENDIX_TITLE}</h2>
      <Ed4Paragraph>{APPENDIX_LEAD}</Ed4Paragraph>

      <Subtitle number="1.1" />
      <Ed4Paragraph>{a.missing.length > 0 ? `${a.summary} ${MISSING_LEAD}` : a.summary}</Ed4Paragraph>
      <Bullets items={a.missing} />

      <Subtitle number="1.2" />
      <Ed4TableTitle className={TITLE}>{APPENDIX_REPORTING_TITLE}</Ed4TableTitle>
      <Ed4Table className={TABLE} columns={APPENDIX_REPORTING_COLUMNS} rows={rows3(a.reporting)} />
      <Ed4Paragraph>{a.outsideHead}</Ed4Paragraph>
      <Ed4Table className={TABLE} columns={APPENDIX_OUTSIDE_COLUMNS} rows={rows3(a.outside)} />
      <Ed4TableTitle className={TITLE}>{APPENDIX_PURPOSE_TITLE}</Ed4TableTitle>
      {a.purpose.length > 0 && <Ed4Table className={TABLE} columns={APPENDIX_PURPOSE_COLUMNS} rows={rows3(a.purpose)} />}
      {a.purposeNote && <Ed4Paragraph>{a.purposeNote}</Ed4Paragraph>}
      <Ed4TableTitle className={TITLE}>{APPENDIX_RECORD_TITLE}</Ed4TableTitle>
      <Ed4Table className={TABLE} columns={APPENDIX_RECORD_COLUMNS} rows={[[APPENDIX_RECORD_ACK, a.inputRecord]]} />

      <Subtitle number="1.3" />
      <Ed4TableTitle className={TITLE}>{APPENDIX_AXES_TITLE}</Ed4TableTitle>
      <Ed4Table className={AXES_TABLE} columns={APPENDIX_AXES_COLUMNS} rows={a.axes} />
      {a.checklist.length > 0 && (
        <>
          <Ed4TableTitle className={TITLE}>{APPENDIX_CHECKLIST_TITLE}</Ed4TableTitle>
          <Ed4Table className={TABLE} columns={APPENDIX_CHECKLIST_COLUMNS} rows={a.checklist} />
        </>
      )}
      {a.checklistNote && <Ed4Paragraph>{a.checklistNote}</Ed4Paragraph>}

      <Subtitle number="1.4" />
      <Bullets items={a.method} />
    </section>
  );
}
