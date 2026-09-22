/**
 * 성적서 구간 입력을 평가 결과 위에 다시 입힌다.
 *
 * **왜 필요한가** — 평가(`/api/evaluate`)는 5단계에서 끝나고, 그 순간 조립된 성적서가
 * `run.reportData` 에 `isEvaluated: true` 로 캐시된다. 그런데 기관 정보·학습 데이터셋
 * 정보·합격 목표값은 **그 뒤에**(`/report/:id/issue-info`) 들어온다. 캐시를 그대로 내보내면
 * 사용자가 입력한 값이 성적서에 영영 닿지 못한다 — 입력이 저장되지 않는 것처럼 보이지만
 * 실제로는 저장된 값을 성적서가 읽지 않는 것이다.
 *
 * 그래서 **캐시는 백엔드가 만든 것만 신뢰하고**(KPI 측정값·차트·검증 결과·LLM 서술·발급
 * 이력), 사용자가 주인인 영역은 run 의 `workflowSnapshot` 에서 매번 다시 만든다.
 *
 * 출처가 전역 워크플로우 store 가 아니라 **run 의 스냅샷**인 이유: 워크스페이스에서 예전
 * run 을 열었을 때 지금 작업 중인 다른 평가의 입력이 그 성적서에 새어 들어가면 안 된다.
 * run 마다 자기 입력을 들고 있으므로 그것을 읽는다.
 *
 * 매핑 규칙은 `mapWorkflowToFinalReport` 하나에만 둔다 — 여기서 필드를 다시 조립하면
 * 두 곳이 갈라져 한쪽만 고쳐지는 드리프트가 생긴다. 조금 낭비여도 그 함수를 호출해
 * 필요한 절만 꺼내 쓴다.
 */
import { buildConclusion } from "./computeVerdict";
import { evaluateStatus } from "./evaluateStatus";
import {
  mapWorkflowToFinalReport,
  type MapWorkflowToReportInput,
} from "./mapWorkflowToFinalReport";
import type { FinalReportData, KpiResult } from "../../types/finalReport.types";
import type { MetricDetailStateMap } from "../../types/workflow.types";
import { metricNeedsTargetValue } from "../../utils/domain/validation";

export function applyUserInputs(
  report: FinalReportData,
  snapshot: MapWorkflowToReportInput,
): FinalReportData {
  // 발급된 성적서는 번호가 붙은 보관 문서다. 발급 뒤의 입력 변경이 이미 나간 문서를
  // 조용히 바꾸면 인쇄물과 화면이 어긋난다 — 고치려면 재발급(사유 기재)을 거쳐야 한다.
  if (report.meta.reportId) return report;

  // 스냅샷에 작업 유형이 비어 있으면(구 저장본) 평가 결과가 확정한 값을 쓴다.
  // 비워 두면 mapWorkflowToFinalReport 가 binary 로 떨어뜨려 4·5절 지표가 통째로 걸러진다.
  const resolved: MapWorkflowToReportInput = snapshot.taskType
    ? snapshot
    : { ...snapshot, taskType: report.meta.taskType };

  const base = mapWorkflowToFinalReport(resolved);

  // 목표값은 측정 이후에 들어오므로 판정도 여기서 다시 낸다(값 자체는 백엔드 측정값 유지).
  const kpiResults = applyThresholds(report.kpiResults, resolved.metricDetails);
  const rule = buildConclusion(kpiResults, report.meta.taskType);

  return {
    ...report,

    // ── 사용자 입력이 주인인 절: 스냅샷에서 다시 만든다.
    applicant: base.applicant, // 1절 기업 정보
    evalScope: base.evalScope, // 2절 평가 범위(모델명·버전·용도·과제 정보)
    datasetInfo: base.datasetInfo, // 3절 데이터셋(평가 표본 수·포맷·클래스)
    trainingDatasetInfo: base.trainingDatasetInfo, // 3절 학습 데이터셋
    metricList: base.metricList, // 4절 지표 목록 + 합격 기준
    metricFormulas: base.metricFormulas, // 5절 산식

    // 시스템 사양은 사용자 입력, `environment`(실제 수행 라이브러리 버전)는 백엔드 산출.
    evalEnv: { ...base.evalEnv, environment: report.evalEnv.environment },

    meta: {
      ...report.meta,
      contractDate: base.meta.contractDate,
      evaluationPeriod: {
        from: base.meta.evaluationPeriod.from,
        // 평가 종료일은 실제로 평가한 날이다. base 는 '오늘'을 넣으므로 그대로 받으면
        // 초안을 열어볼 때마다 날짜가 밀린다.
        to: report.meta.evaluationPeriod.to || base.meta.evaluationPeriod.to,
      },
      // 양성 클래스는 매핑 단계 실측(metadata)이 우선이라 평가 결과 쪽을 먼저 본다.
      positiveClass: report.meta.positiveClass || base.meta.positiveClass,
    },

    // ── 목표값에 매인 절: 측정값은 그대로, 기준·판정만 다시.
    kpiResults,
    // 서술(benchmark/narrative/risks)은 LLM 결과라 보존하고, 규칙 산출값만 갱신한다.
    conclusion: { ...report.conclusion, verdict: rule.verdict, score: rule.score },
  };
}

/**
 * 목표값(`metricDetails[id].targetValue`)을 KPI 결과에 반영한다.
 *
 * 측정값(`value`)은 백엔드가 낸 사실이라 건드리지 않는다. 바뀌는 것은 기준값과 그에 따른
 * 합·불뿐이다. 목표값이 없으면 `threshold: 0` 으로 두어 '정보 제공' 지표가 되고,
 * `computeVerdict` 의 판정 분모에서도 빠진다.
 */
function applyThresholds(
  kpiResults: KpiResult[],
  metricDetails: MetricDetailStateMap,
): KpiResult[] {
  return kpiResults.map((kpi) => {
    // KPI 의 metricId 는 `getMetricDisplayId` 를 거친 표시 ID 이고, 현재 그 함수는 항등이라
    // metricDetails 의 키와 같다. 표시 ID 규칙이 갈라지면 여기도 함께 고쳐야 한다.
    const raw = metricDetails[kpi.metricId]?.targetValue ?? "";
    const target = parseFloat(raw);
    // M21(혼동행렬)·M22(분류 리포트)는 값이 아니라 그림이라 목표값을 받지 않는다.
    const hasThreshold =
      metricNeedsTargetValue(kpi.metricId) && Number.isFinite(target) && target > 0;

    // 계산 실패 지표는 판정 대상이 아니다 — 기준만 표기하고 status 는 건드리지 않는다.
    if (kpi.status === "unavailable") {
      return { ...kpi, threshold: hasThreshold ? target : 0 };
    }

    if (!hasThreshold) {
      return {
        ...kpi,
        threshold: 0,
        status: "pass",
        perClass: kpi.perClass?.map((item) => ({ ...item, status: "pass" as const })),
      };
    }

    const higherIsBetter = kpi.higherIsBetter !== false;

    return {
      ...kpi,
      threshold: target,
      status: evaluateStatus(kpi.value, target, higherIsBetter),
      perClass: kpi.perClass?.map((item) => ({
        ...item,
        status: evaluateStatus(item.value, target, higherIsBetter),
      })),
    };
  });
}
