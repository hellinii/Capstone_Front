/**
 * Tailwind CSS 스타일링 유틸리티
 *
 * 이 파일은 Tailwind CSS 클래스들을 스타일 충돌 없이 안전하게 병합해 주는
 * `cn` (classNames) 유틸리티 함수를 제공합니다.
 * 버튼, 카드, 인풋 등 모든 UI 컴포넌트에서 광범위하게 사용됩니다.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
