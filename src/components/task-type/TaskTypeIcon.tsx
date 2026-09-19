/**
 * 분류 유형 아이콘 — 세 유형의 차이를 도형 자체로 설명한다(docs/UI_DESIGN.md §2).
 *
 * 셋이 **같은 도형(원)** 을 쓰고 **개수와 채움만** 다르다. "채운 원 = 이 샘플에 배정된 것"
 * 이라는 규칙이 세 유형 모두에서 일관되게 성립한다.
 *
 *   binary     원 2개 중 1개   후보가 둘,   답은 하나
 *   multiclass 원 4개 중 1개   후보가 여럿, 답은 하나
 *   multilabel 원 4개 중 3개   후보가 여럿, 답도 여럿
 *
 * **multiclass 와 multilabel 은 반드시 같은 2×2 격자를 쓴다.** 격자가 달라지면 사용자가
 * "채운 개수의 차이"가 아니라 "서로 다른 그림 두 개"로 읽어, 아이콘이 설명하려던 것을
 * 스스로 무너뜨린다.
 *
 * 색은 `currentColor` 만 쓴다 — 부모의 text 색을 따라가므로 선택/비선택 상태별 색을
 * 따로 관리하지 않는다. 의미는 옆의 제목 텍스트가 전달하므로 aria-hidden 이다.
 */
import type { TaskType } from "../../data/evaluationData";

const RADIUS = 7;

/** 2×2 격자 — multiclass·multilabel 공용. 위 주석의 '같은 격자' 규칙이 여기에 있다. */
const GRID_2X2: ReadonlyArray<readonly [number, number]> = [
  [12, 12],
  [28, 12],
  [12, 28],
  [28, 28],
];

const POSITIONS: Record<TaskType, ReadonlyArray<readonly [number, number]>> = {
  binary: [
    [12, 20],
    [28, 20],
  ],
  multiclass: GRID_2X2,
  multilabel: GRID_2X2,
};

/** 채워지는 원의 인덱스. */
const FILLED: Record<TaskType, readonly number[]> = {
  binary: [1],
  multiclass: [0],
  multilabel: [0, 1, 2],
};

export function TaskTypeIcon({
  type,
  size = 40,
  className,
}: {
  type: TaskType;
  size?: number;
  className?: string;
}) {
  const filled = FILLED[type];

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {POSITIONS[type].map(([cx, cy], index) =>
        filled.includes(index) ? (
          <circle key={index} cx={cx} cy={cy} r={RADIUS} fill="currentColor" />
        ) : (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.35"
          />
        ),
      )}
    </svg>
  );
}
