/**
 * 판 4 표 부품(판 4 라운드 계획 2.4) — 예시본의 표는 모두 머리 행이 있다("항목 | 내용", "Metric ID | 시험항목 | …").
 * - `Ed4Table`: 열 이름과 행(칸 배열)을 받는 범용 표. 칸 수는 열 수와 같게 넘긴다(화면이 깨지지 않게 여기서 던지지는 않는다 —
 *   시험 도구 `expectExampleBlock` 이 표 칸 수까지 예시본과 대조한다).
 * - `Ed4ItemTable`: "항목 | 내용" 두 칸 표(머리 행 이름은 바꿀 수 있다 — 예: "이름 | 값", "클래스 | 설명").
 * 판 3 `TwoColTable`(머리 행 없음)은 쓰지 않는다.
 */
import type { ReactNode } from "react";

import { cn } from "../../../../utils/styling/styles";

/**
 * 좁은 칸에서 한국어 낱말 중간이 끊기지 않게(keep-all) 하고 표 머리는 한 줄로 두는 인쇄 모양(J7 부록 1 표, 세션 5 끝 6절 권고 표 —
 * PDF 눈 확인에서 "우/선/순/위"·"데이/터가" 처럼 끊김). 글자는 바꾸지 않는다. 판 4 표에만 붙인다(판 3 절 컴포넌트는 이 부품을 쓰지 않는다).
 */
export const ED4_KEEP_WORDS_TABLE = "[word-break:keep-all] [&_th]:whitespace-nowrap";
/** 첫 열이 짧은 이름 칸(부록 1.3 축 이름, 6절 우선순위 "높음·중간·낮음")인 표 — 첫 열도 한 줄로. */
export const ED4_KEEP_WORDS_TABLE_SHORT_FIRST = `${ED4_KEEP_WORDS_TABLE} [&_td:first-child]:whitespace-nowrap`;

export interface Ed4TableProps {
  columns: ReadonlyArray<ReactNode>;
  rows: ReadonlyArray<ReadonlyArray<ReactNode>>;
  /** 행 key(없으면 행 번호). */
  rowKeys?: ReadonlyArray<string>;
  className?: string;
}

export function Ed4Table({ columns, rows, rowKeys, className }: Ed4TableProps) {
  return (
    <table className={cn("mt-2 w-full border-collapse text-sm", className)}>
      <thead>
        <tr className="border-b border-slate-300">
          {columns.map((column, i) => (
            <th key={i} className="py-1.5 pr-3 text-left font-semibold text-slate-700">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={rowKeys?.[r] ?? r} className="border-b border-slate-100 align-top">
            {row.map((cell, c) => (
              <td key={c} className="py-1.5 pr-3 text-slate-900">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export interface Ed4ItemRow {
  label: string;
  value: ReactNode;
}

export function Ed4ItemTable({
  rows,
  headers = ["항목", "내용"],
  className,
}: {
  rows: ReadonlyArray<Ed4ItemRow>;
  headers?: readonly [ReactNode, ReactNode];
  className?: string;
}) {
  return (
    <Ed4Table
      columns={headers}
      rows={rows.map((row) => [row.label, row.value])}
      rowKeys={rows.map((row, i) => `${i}:${row.label}`)}
      className={className}
    />
  );
}
