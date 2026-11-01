/**
 * 서버 발급 검사(백엔드 `app/issuance/judge_gate.py`)의 판 4 발급 거절 글 — 시험용 사본(심판 라운드 세션 5 끝, 2026-10-29 사용자 결정 3).
 * 서버는 `{글} ({사유 코드})` 꼴로 409 를 돌려준다. 프론트는 이 글을 해석하지 않고 B48 "서버가 발급을 거절했습니다: {서버 글}"에 그대로
 * 끼우며, 심판 거절인지는 글 끝 괄호의 사유 코드로만 안다(`judgeNotice.isJudgeRejection`). 가짜 응답 글이라 글이 또 바뀌어도 화면
 * 동작은 같다 — 다만 새 글(마침표 둘·두 문장·쉼표)에서도 사유 코드 알아보기가 흔들리지 않는지 보려고 실제 글을 그대로 둔다.
 */
export const JUDGE_SERVER_MESSAGES = {
  judge_job_missing:
    "자동 검증을 거친 서술인지 확인할 서술 작업 번호가 요청에 없어 발급할 수 없습니다. 화면을 새로 고친 뒤 다시 발급해 주세요.",
  judge_job_not_found: "이 성적서의 서술을 만든 작업을 찾을 수 없어 발급할 수 없습니다. 서술을 다시 만든 뒤 발급해 주세요.",
  judge_job_not_edition4:
    "요청에 담긴 서술 작업이 이 성적서 양식에 맞는 작업이 아니어서 발급할 수 없습니다. 서술을 다시 만든 뒤 발급해 주세요.",
  judge_record_expired:
    "서술 작업 기록을 보관하는 기간이 지나 자동 검증 결과를 확인할 수 없습니다. 서술을 다시 만든 뒤 발급해 주세요.",
  judge_not_passed: "이 서술은 자동 검증을 통과하지 못해 발급이 보류되었습니다. 성적서 화면 위쪽의 안내를 확인해 주세요.",
  judge_narrative_unrecorded:
    "자동 검증을 통과한 서술의 내용이 기록되어 있지 않아, 지금 성적서의 서술과 같은지 확인할 수 없습니다. 서술을 다시 만든 뒤 발급해 주세요.",
  judge_narrative_mismatch:
    "성적서의 서술이 자동 검증을 통과한 서술과 달라 발급할 수 없습니다. 검증을 통과한 뒤 서술이 바뀌었다면 서술을 다시 만들어 검증을 다시 받아 주세요.",
  judge_criteria_unverified:
    "이 서술은 아직 검증을 마치지 않은 점검 기준으로 확인되어 발급할 수 없습니다. 운영자에게 문의해 주세요.",
} as const;

export type JudgeRejectionCode = keyof typeof JUDGE_SERVER_MESSAGES;

/** 서버가 409 본문 `detail` 에 싣는 글 그대로 — `{글} ({코드})`. */
export const judgeServerDetail = (code: JudgeRejectionCode): string => `${JUDGE_SERVER_MESSAGES[code]} (${code})`;
