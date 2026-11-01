/**
 * 판 4 run 시험용 통과 심판 묶음(심판 라운드 J6). 판 3 하네스(`edition3/newRun`)의 작업 응답(`<tag>.jobs.json`)은 판 3 작업이라
 * `result.judge` 가 없다 — 판 4 run 이 그 응답을 받으면 닫힌 쪽 기본값대로 "심판 기록 없음"으로 보류된다. 판 4 흐름을 시험하는
 * 파일은 `node:fs` 를 돌려 이 묶음을 끼운 응답을 읽힌다(판 3 run 에는 끼우지 않는다 — 판 3 정답은 그대로).
 * 묶음은 계약 `src/test/contract/judge_bundle_ed4.json` 의 passed 예시다.
 */
import { resolve } from "node:path";

const CONTRACT = resolve(__dirname, "../contract/judge_bundle_ed4.json");

export const JOBS_JSON = /([\\/])edition3\1newRun\1inputs\1(\w+)\.jobs\.json$/;

/**
 * 작업 응답 글(jobs.json)의 done.result 에 통과 묶음을 끼운 글. `read` 는 돌리지 않은 원래 readFileSync — 이 파일은 `node:fs` 를
 * 돌리는 vi.mock 안에서 읽히므로 `node:fs` 를 직접 import 하지 않는다.
 */
export function withPassedJudge(text: string, read: (p: string) => string): string {
  const passed = JSON.parse(read(CONTRACT)).examples.passed;
  const jobs = JSON.parse(text);
  jobs.done.result.judge = passed;
  return JSON.stringify(jobs, null, 2) + "\n";
}
