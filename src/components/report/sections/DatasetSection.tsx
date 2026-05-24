import { FileImage } from "lucide-react";
import type {
  DatasetInfo,
  DatasetSampleRow,
  TrainingDatasetInfo,
} from "../../../types/finalReport.types";
import { SectionTitle } from "../ui/SectionTitle";
import { TwoColTable } from "../ui/TwoColTable";

interface DatasetSectionProps {
  datasetInfo: DatasetInfo;
  datasetSamples: DatasetSampleRow[];
  datasetDiagnosis: string;
  trainingDatasetInfo?: TrainingDatasetInfo;
}

export function DatasetSection({
  datasetInfo,
  datasetSamples,
  datasetDiagnosis,
  trainingDatasetInfo,
}: DatasetSectionProps) {
  const datasetRows = [
    { label: "데이터셋 형식",      value: datasetInfo.format },
    { label: "입력 컬럼",          value: datasetInfo.inputColumns.join(", ") },
    { label: "평가 데이터셋 샘플 수", value: `${datasetInfo.sampleCount.toLocaleString()}개` },
    { label: "평가 유형",          value: datasetInfo.taskTypeLabel },
    {
      label: "감지된 클래스 수",
      value: `${datasetInfo.classCount}개 — 클래스 목록: ${datasetInfo.classLabels.join(", ")}`,
    },
    { label: "업로드 파일명",      value: datasetInfo.fileName },
  ];

  if (trainingDatasetInfo) {
    datasetRows.push(
      { label: "학습 데이터셋명", value: trainingDatasetInfo.name },
      {
        label: "학습 샘플 수",
        value: `${trainingDatasetInfo.trainingSampleCount.toLocaleString()}개`,
      },
    );
  }

  return (
    <section className="space-y-8 border-t border-slate-200 py-10">
      <SectionTitle number={3} title="데이터셋 개요" />

      {/* 데이터셋 정보 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">데이터셋 정보</h3>
        <TwoColTable rows={datasetRows} />
      </div>

      {/* 데이터 예시 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">데이터 예시</h3>
        <p className="text-xs text-slate-400">
          업로드된 데이터셋의 상위 {datasetSamples.length}개 샘플
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                <th className="py-2 px-4 text-left font-medium text-slate-500 w-20">id</th>
                <th className="py-2 px-4 text-left font-medium text-slate-500">y_true</th>
                <th className="py-2 px-4 text-left font-medium text-slate-500">y_pred</th>
                <th className="py-2 px-4 text-left font-medium text-slate-500">score</th>
                <th className="py-2 px-4 text-left font-medium text-slate-500">비고</th>
              </tr>
            </thead>
            <tbody>
              {datasetSamples.map((row) => {
                const isCorrect = row.y_true === row.y_pred;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-2 px-4 font-mono text-xs text-slate-400">{row.id}</td>
                    <td className="py-2 px-4 tabular-nums text-slate-700">{row.y_true}</td>
                    <td className="py-2 px-4 tabular-nums text-slate-700">{row.y_pred}</td>
                    <td className="py-2 px-4 font-mono text-xs text-slate-700">{row.score.toFixed(3)}</td>
                    <td className="py-2 px-4 text-xs">
                      {isCorrect ? (
                        <span className="text-emerald-600">정답</span>
                      ) : (
                        <span className="text-red-500">오분류</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 데이터셋 분포 사전 진단 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">데이터셋 분포 사전 진단</h3>
        <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-slate-700">
            "{datasetDiagnosis}"
          </p>
        </blockquote>
      </div>

      {/* 학습 데이터 예시 (training 정보가 있을 때만) */}
      {trainingDatasetInfo &&
        (trainingDatasetInfo.validExamples.length > 0 ||
          trainingDatasetInfo.edgeExamples.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">학습 데이터 예시</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ExampleFileList
                title="대표 적합 샘플"
                files={trainingDatasetInfo.validExamples}
                emptyText="등록된 적합 샘플 없음"
              />
              <ExampleFileList
                title="부적합 / Edge 샘플 (옵션)"
                files={trainingDatasetInfo.edgeExamples}
                emptyText="등록된 부적합 샘플 없음"
              />
            </div>
          </div>
        )}
    </section>
  );
}

function ExampleFileList({
  title,
  files,
  emptyText,
}: {
  title: string;
  files: { name: string; size: string; type: string }[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      {files.length === 0 ? (
        <p className="text-xs text-slate-400">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 text-sm">
              <FileImage className="size-5 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-slate-700">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {file.size}
                  {file.type && file.type !== "unknown" ? ` · ${file.type}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
