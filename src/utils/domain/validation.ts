/**
 * 평가 데이터 유효성 검사 규칙
 *
 * 이 모듈은 워크플로우 전반(특히 Step 3 Metric Detail Input)에서 사용되는 핵심 유효성 검사
 * 로직을 포함합니다. 다양한 숫자 입력값(target value, beta 등)에 대한 허용 범위,
 * 검증 규칙 및 파싱(parsing) 로직을 정의합니다.
 */
/**
 * Parse a string to a number, returning null for empty or invalid values.
 */
export function parseNumericValue(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Get the validation rule for a metric target value based on its internal ID.
 * Returns the range description and a validate function.
 */
export function getTargetValueRule(tcId: string): { summary: string; validate: (value: number) => string | null } {
  const zeroToOneIds = new Set([
    "TC1",
    "TC2",
    "TC3",
    "TC4",
    "TC5",
    "TC7",
    "TC8",
    "TC9",
    "TC10",
    "TC11",
    "TC12",
    "TC13",
    "TC15",
    "TC16",
    "TC17",
    "TC22",
  ]);

  const nonNegativeIds = new Set(["TC6", "TC14", "TC18", "TC19", "TC21"]);

  if (zeroToOneIds.has(tcId)) {
    return {
      summary: "Enter a number between 0 and 1.",
      validate: (value) => (value < 0 || value > 1 ? "Target value must be between 0 and 1 for this metric." : null),
    };
  }

  if (nonNegativeIds.has(tcId)) {
    return {
      summary: "Enter a number greater than or equal to 0.",
      validate: (value) => (value < 0 ? "Target value must be 0 or greater for this metric." : null),
    };
  }

  if (tcId === "TC20") {
    return {
      summary: "Enter a number between -1 and 1.",
      validate: (value) => (value < -1 || value > 1 ? "Target value must be between -1 and 1 for MCC." : null),
    };
  }

  if (tcId === "TC23") {
    return {
      summary: "Enter a number greater than or equal to 1.",
      validate: (value) => (value < 1 ? "Target value must be 1 or greater for imbalance ratio." : null),
    };
  }

  return {
    summary: "Enter a valid numeric target value.",
    validate: () => null,
  };
}
