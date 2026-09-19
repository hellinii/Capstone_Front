/**
 * 'New version' 이 눌렸을 때 제안할 다음 버전 이름.
 *
 * 워크스페이스의 'Edit' 은 과거 평가를 **고치는** 동작처럼 보였지만, 실제 쓰임은
 * "모델을 손본 뒤 같은 데이터로 다시 재보는 것"이다. 그건 수정이 아니라 **버전을 하나
 * 더 쌓는 일**이라 이름과 동작을 거기 맞췄다.
 *
 * 제안일 뿐이다 — 업로드 화면의 Version 입력은 그대로 열려 있어 사용자가 덮어쓸 수 있다.
 * 그래서 규칙을 영리하게 만들 이유가 없다. **맨 끝 숫자 하나만 올린다.**
 * semver 를 해석하려 들면 "v2.0-beta"·"2024.09" 같은 이름에서 틀린 답을 자신 있게 낸다.
 */

/** 문자열 맨 끝에 붙은 정수. 앞의 0 padding("v1.09")도 자릿수를 보존한다. */
const TRAILING_NUMBER = /(\d+)(\D*)$/;

export function nextVersionName(current: string): string {
  const trimmed = current.trim();
  if (trimmed === "") return "v1.0.0";

  const match = trimmed.match(TRAILING_NUMBER);
  // 숫자가 하나도 없는 이름("baseline", "final")은 건드리지 않는다. 어디를 올려야
  // 하는지 알 수 없고, 잘못 붙인 접미사는 사용자가 지우는 수고만 만든다.
  if (!match) return trimmed;

  const [, digits, suffix] = match;
  const incremented = String(Number(digits) + 1).padStart(digits.length, "0");
  const start = trimmed.length - match[0].length;

  return `${trimmed.slice(0, start)}${incremented}${suffix}`;
}
