/**
 * 판 4 심판 결과의 화면 글 고르기(심판 라운드 J6, 고정 문구 B37~B48) — 보류 띠·잠금 이유·서버 거절 안내.
 *
 * 다시 만들기를 줄지는 백엔드가 정한 `retryAllowed` 하나만 따른다(Q6 — 판정 지점은 백엔드 `app.judge.ladder.retry_allowed`).
 * 여기서 보류 종류로 다시 가르지 않는다. 심판 기록이 없거나 모양이 틀린 판 4 성적서는 B46 이 "서술을 다시 만들어 주세요"라고
 * 하므로 다시 만들기를 준다.
 */
import {
  B37_HELD_HEAD,
  B38_HELD_GATE_FAILED,
  B39_HELD_TIMEOUT,
  B40_HELD_JUDGE_ERROR,
  B40_HELD_JUDGE_ERROR_RETRY,
  B41_HELD_NO_KEY,
  B42_HELD_BUDGET,
  B43_HELD_JOB_LIMIT,
  B44_HELD_NO_MATERIAL,
  B45_LOCK_HELD,
  B46_LOCK_NO_RECORD,
  B48_SERVER_REJECTED,
  fillTemplate,
} from "./edition4/edition4Text";
import type { JudgeBundle, JudgeHeldKind } from "./judgeBundle";
import type { ReportLockReason } from "./reportLock";

const HELD_LINE: Record<Exclude<JudgeHeldKind, "judge_error">, string> = {
  gate_failed: B38_HELD_GATE_FAILED,
  timeout: B39_HELD_TIMEOUT,
  no_key: B41_HELD_NO_KEY,
  budget: B42_HELD_BUDGET,
  job_limit: B43_HELD_JOB_LIMIT,
  no_material: B44_HELD_NO_MATERIAL,
};

/** 보류 띠. 판 4 성적서에서 심판 묶음이 held 거나(종류별 둘째 줄) 묶음이 없을 때(B46 한 줄). */
export interface HeldNotice {
  head: string;
  line: string | null;
  retry: boolean;
}

export function heldNotice(judge: JudgeBundle | undefined): HeldNotice {
  if (!judge || judge.gate !== "held" || !judge.heldKind) return { head: B46_LOCK_NO_RECORD, line: null, retry: true };
  const line =
    judge.heldKind === "judge_error"
      ? judge.retryAllowed
        ? B40_HELD_JUDGE_ERROR_RETRY
        : B40_HELD_JUDGE_ERROR
      : HELD_LINE[judge.heldKind];
  return { head: B37_HELD_HEAD, line, retry: judge.retryAllowed };
}

/** 잠금 이유 → 버튼 옆 글. 서술 미완료(판 3 과 같은 글)는 부르는 쪽이 가진 글을 넘긴다. */
export function lockReasonText(reason: ReportLockReason, narrativeText: string): string {
  if (reason === "judge_held") return B45_LOCK_HELD;
  if (reason === "judge_missing") return B46_LOCK_NO_RECORD;
  return narrativeText;
}

/** 서버 발급 검사가 판 4 발급을 거절한 글인가 — 409 이고 글 끝 괄호가 심판 사유 코드(`app/issuance/judge_gate.py`). */
export function isJudgeRejection(status: number | undefined, detail: string): boolean {
  return status === 409 && /\(judge_[a-z0-9_]+\)$/.test(detail.trim());
}

/** B48 — 서버 거절 안내. 서버 글(사유 코드 포함)은 그대로 끼운다. */
export function serverRejectedText(detail: string): string {
  return fillTemplate(B48_SERVER_REJECTED, { "서버 글": detail });
}

/**
 * 평가 목록(워크스페이스의 run 표)에서 판 4 서술이 발급 보류인 평가에 다는 표시(심판 라운드 J9, 계획 14-8).
 *
 * 보류 띠 머리 B37 의 앞 낱말("발급 보류")을 그대로 따 왔다. 고정 문구(B35~B58)·Q7·Q8 후보표 밖의 글이라 후보(`CANDIDATE_`)로
 * 두었다가 2026-10-29 사용자가 승인했다(세션 5 끝 결정 1). 심판 묶음이 없는 판 4 완료 run 도 화면처럼 보류로 보이는 동작도 함께 확정.
 */
export const LIST_HELD_BADGE = "발급 보류";
