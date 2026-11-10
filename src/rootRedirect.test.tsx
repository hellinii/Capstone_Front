/**
 * 첫 화면(`/`)은 워크스페이스 목록으로 보낸다.
 *
 * 종전에는 `/` 가 영어 랜딩 페이지였다. 랜딩이 하던 일은 "워크스페이스 만들기" 버튼 하나뿐이었고,
 * 평가는 워크스페이스 안에서만 시작하므로(활성 워크스페이스가 없으면 run 이 생기지 않는다)
 * 랜딩을 없애고 바로 목록으로 보낸다. "메인 홈" 버튼(성적서 화면)·로고도 결국 이곳에 닿는다.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { routes } from "./routes";

describe("첫 화면 `/`", () => {
  it("워크스페이스 목록(`/workspaces`)으로 보낸다", () => {
    const root = routes.find((r) => r.path === "/");
    expect(root).toBeDefined();
    const Root = root!.Component;

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/workspaces" element={<div data-testid="workspaces" />} />
          <Route path="*" element={<div data-testid="elsewhere" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("workspaces")).toBeInTheDocument();
    expect(screen.queryByTestId("elsewhere")).toBeNull();
  });
});
