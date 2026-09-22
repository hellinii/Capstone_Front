import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isEvaluationDataUploadValid } from "./DataUpload";
import type { UploadedFileInfo } from "../../types/workflow.types";

const read = (p: string) => readFileSync(resolve(__dirname, "../..", p), "utf-8");

const file: UploadedFileInfo = { name: "eval.csv", size: "1 KB", type: "text/csv" };

describe("업로드 단계 통과 조건", () => {
  it("파일·모델명·버전이 모두 있어야 통과한다", () => {
    expect(isEvaluationDataUploadValid(file, true, "Face recognizer", "v1.0.0")).toBe(true);
  });

  it("원본 File 객체가 없으면 막는다(과거 평가를 물려받은 직후 상태)", () => {
    // 메타만 복원된 상태로 통과시키면 다음 단계에서 "file is missing" 을 만난다.
    expect(isEvaluationDataUploadValid(file, false, "Face recognizer", "v1.0.0")).toBe(false);
  });

  it("파일 자체가 없으면 막는다", () => {
    expect(isEvaluationDataUploadValid(null, false, "Face recognizer", "v1.0.0")).toBe(false);
  });

  it("모델명이 비면 막는다", () => {
    // 통과시키면 run 이 'Untitled model' 로 저장돼 다른 모델들과 한 덩어리로 묶인다.
    expect(isEvaluationDataUploadValid(file, true, "", "v1.0.0")).toBe(false);
    expect(isEvaluationDataUploadValid(file, true, "   ", "v1.0.0")).toBe(false);
  });

  it("버전이 비면 막는다(비교표의 열 이름이 사라진다)", () => {
    expect(isEvaluationDataUploadValid(file, true, "Face recognizer", "")).toBe(false);
  });
});

describe("모델 이름표는 한 곳에서만 편집한다", () => {
  /**
   * 모델명·버전은 성적서 서식이 아니라 평가 결과의 이름표라 업로드 단계로 앞당겼다.
   * 성적서 구간에도 입력란을 남겨두면 같은 값을 두 화면이 고치게 돼, 어느 쪽이 참인지
   * 화면만 보고는 알 수 없다.
   */
  it("성적서 기본정보 화면에는 입력란이 아니라 읽기 전용 표시만 있다", () => {
    const source = read("components/basic-info/BasicInfo.tsx");

    expect(source).toContain("ReadOnlyModelIdentity");
    expect(source).not.toContain('update("modelName"');
    expect(source).not.toContain('update("versionName"');
  });

  it("업로드 화면이 모델명·버전을 스토어에 쓴다", () => {
    const source = read("pages/DataUpload.tsx");

    expect(source).toContain("modelName: value");
    expect(source).toContain("versionName: value");
  });
});
