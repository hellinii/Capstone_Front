/**
 * ISSUES.md E-16 — 마지막 탭(평가 결과)이 실제 run 이 아니라 임시 성적서를 가리켰다.
 *
 * `stepToPath(마지막 단계)` 는 항상 임시 성적서 경로를 돌려줬다. 그래서 성적서를 벗어난
 * 사용자가 UI 가 제공하는 유일한 복귀 경로로는 **자기 성적서로 돌아갈 수 없었다** — 빈
 * 미리보기가 떴다. 게다가 방금 만든 run 의 id 는 어디에도 보관되지 않아, '탭을 활성화한다'가
 * 아니라 **run id 를 상태에 남기는 것**이 선행이었다.
 *
 * 단계 번호는 `STEP`·`STEP_PATHS` 에서 가져온다 — 2026-09-19 재배치처럼 순서가 또 바뀌어도
 * 이 테스트가 번호를 직접 들고 있지 않도록.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { StepTabs } from "./StepTabs";
import { STEP, STEP_PATHS, useWorkflowStore } from "../../utils/stores/useWorkflowStore";

/** 평가 결과 탭의 접근성 이름. StepTabs 의 라벨과 같아야 한다. */
const RESULT_TAB = /Result/;

function renderTabs() {
  render(
    <MemoryRouter initialEntries={["/app/data-validation"]}>
      <StepTabs />
      <Routes>
        <Route path="/report/:id" element={<div data-testid="run-report" />} />
        <Route path="/workspaces" element={<div data-testid="workspace-list" />} />
        <Route path="*" element={<div />} />
      </Routes>
    </MemoryRouter>
  );
}

/** 평가 구간 전 단계를 완료로 표시한다(번호를 직접 쓰지 않는다). */
function completeAllSteps() {
  const s = useWorkflowStore.getState();
  STEP_PATHS.forEach((_, index) => s.markStepCompleted(index + 1));
}

beforeEach(() => {
  localStorage.clear();
  useWorkflowStore.getState().resetWorkflow();
});

describe("평가 결과 탭", () => {
  it("[E-16] 방금 만든 run 이 있으면 그 성적서로 간다", async () => {
    completeAllSteps();
    const s = useWorkflowStore.getState();
    s.setLastRunId("run-abc");
    s.setCurrentStep(STEP.RESULT);

    renderTabs();
    await userEvent.click(screen.getByRole("button", { name: RESULT_TAB }));

    expect(screen.getByTestId("run-report")).toBeInTheDocument();
  });

  it("[E-16·E-06] run 이 없으면 워크스페이스 목록으로 간다(임시 성적서 폐지)", async () => {
    completeAllSteps();
    useWorkflowStore.getState().setCurrentStep(STEP.RESULT);

    renderTabs();
    await userEvent.click(screen.getByRole("button", { name: RESULT_TAB }));

    expect(screen.getByTestId("workspace-list")).toBeInTheDocument();
  });

  it("[E-16] 평가를 마치기 전에는 결과 탭이 비활성이다", () => {
    useWorkflowStore.getState().setCurrentStep(STEP.UPLOAD);

    renderTabs();

    expect(screen.getByRole("button", { name: RESULT_TAB })).toBeDisabled();
  });
});
