# 프론트엔드 프로젝트 구조 가이드라인

Page-based Component Colocation 아키텍처를 기반으로 한 프론트엔드 프로젝트 구조 가이드라인입니다.

## 1. 전체 폴더 구조

```text
src/
├── main.tsx            # 앱 진입점 (ReactDOM.render)
├── App.tsx             # Provider 래핑 (Router, Theme 등)
├── Root.tsx            # 레이아웃 쉘 (Navbar + Sidebar + Outlet)
├── routes.ts           # 라우트 정의 (path ↔ page 매핑)
│
├── pages/              # 🟢 라우트 단위 페이지 (얇은 조립 파일)
│   ├── Home.tsx
│   ├── Settings.tsx
│   └── Dashboard.tsx
│
├── components/         # 🟡 도메인별 컴포넌트
│   ├── home/           # pages/Home.tsx 전용
│   ├── settings/       # pages/Settings.tsx 전용
│   ├── dashboard/      # pages/Dashboard.tsx 전용
│   └── ui/             # ⚪ 진짜 공용 컴포넌트 (2개 이상 페이지에서 사용)
│       ├── Modal.tsx
│       └── EmptyState.tsx
│
├── layout/             # 🔵 앱 뼈대 (모든 페이지에 공통)
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
│
├── data/               # 📦 Mock 데이터, 상수, 정적 리스트
│   ├── dashboardData.ts
│   └── constants.ts
│
├── hooks/              # 🪝 재사용 가능한 커스텀 훅
├── utils/              # 🔧 순수 유틸리티 함수 (UI 무관)
├── types/              # 📝 공유 타입 정의
├── styles/             # 🎨 글로벌 스타일, 테마 변수
└── assets/             # 🖼️ 이미지, 폰트, SVG
```

### 폴더 한 줄 원칙

- `pages/` — 무엇을 보여주는가 (라우트 단위 조립)
- `components/{도메인}/` — 어떻게 보여주는가 (UI 단위 구현)
- `hooks/` — 어떤 상태와 로직인가 (행동)
- `data/` — 무슨 데이터인가 (정적 값)

## 2. 핵심 규칙 5가지

### 규칙 1: `pages/` 파일은 100줄 이하로 유지한다

`pages/`에 있는 파일은 **조립 파일(Assembler)** 입니다. 직접 UI를 그리지 않습니다.

#### `pages` 파일이 하는 일

- `useState`, `useEffect` 등 최상위 상태 관리
- `components/{도메인}/` 컴포넌트를 import하여 조립
- 페이지 레이아웃(`grid`, `flex`)을 잡는 최상위 컨테이너만 작성

#### `pages` 파일이 하면 안 되는 일

- 30줄 이상의 JSX 블록을 직접 작성
- Mock 데이터나 상수 배열을 내부에 선언
- `map()`으로 리스트를 직접 렌더링

```tsx
// ✅ 좋은 예 — pages/Dashboard.tsx (70줄)
import { useState } from "react";
import { MetricsGrid } from "../components/dashboard/MetricsGrid";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { metricsData } from "../data/dashboardData";

export function Dashboard() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1>Dashboard</h1>
      <MetricsGrid data={metricsData} filter={filter} />
      <ActivityFeed onFilterChange={setFilter} />
    </div>
  );
}
```

```tsx
// ❌ 나쁜 예 — 한 파일에 모든 UI + 데이터가 몰려있음 (400줄)
export function Dashboard() {
  const metrics = [
    { title: "Users", value: 1234 },
    { title: "Revenue", value: 5678 },
    // ... 50줄의 데이터
  ];

  return (
    <div>
      {metrics.map((m) => (
        <div className="p-6 bg-white rounded-xl">
          {/* 수십 줄의 카드 마크업 */}
        </div>
      ))}
    </div>
  );
}
```

### 규칙 2: `components/` 내 도메인 폴더는 `pages/` 파일과 1:1로 매칭한다

| `pages/` 파일 | `components/` 폴더 |
|---|---|
| `Home.tsx` | `components/home/` |
| `Settings.tsx` | `components/settings/` |
| `Dashboard.tsx` | `components/dashboard/` |

새 페이지를 추가하면 반드시 대응하는 도메인 폴더도 함께 생성합니다.

```text
페이지 추가 시 체크리스트:
- pages/NewFeature.tsx 생성
- components/new-feature/ 폴더 생성
- routes.ts에 라우트 추가
```

### 규칙 3: 도메인 폴더 간 교차 import 금지

`components/home/`의 파일이 `components/settings/`의 파일을 import하면 안 됩니다.

```text
components/
├── home/
│   └── Hero.tsx         ← settings/의 파일을 import ❌
├── settings/
│   └── Toggle.tsx
└── ui/
    └── Modal.tsx        ← 어디서든 import ✅ (진짜 공용)
```

교차 사용이 필요하다면 `components/ui/`로 승격시킵니다.

### 규칙 4: `components/ui/`에는 2개 이상의 페이지에서 사용되는 컴포넌트만 넣는다

```text
판단 흐름:
Q: 이 컴포넌트를 1개 페이지에서만 사용하나?
├─ Yes → components/{해당 도메인}/ 에 배치
└─ No  → components/ui/ 에 배치
```

#### `ui/`에 들어가는 컴포넌트 예시

- `Modal.tsx` — 여러 페이지에서 동일한 모달 패턴 사용
- `EmptyState.tsx` — 데이터 없음 상태를 여러 곳에서 표시
- `Toggle.tsx` — Settings, Notifications 등에서 반복 사용

#### `ui/`에 들어가면 안 되는 것

- 특정 도메인 로직이 포함된 컴포넌트
- 한 페이지에서만 사용되는 컴포넌트
- Shadcn/Radix 등 라이브러리 컴포넌트를 설치만 해두고 실제 사용하지 않는 파일

### 규칙 5: Mock 데이터와 상수는 `data/`로 분리한다

페이지 파일이나 컴포넌트 파일 내에 하드코딩된 배열, 객체, 상수가 있으면 `data/` 폴더로 추출합니다.

```text
data/
├── dashboardData.ts   ← Dashboard 전용 데이터
├── settingsData.ts    ← Settings 전용 데이터
└── constants.ts       ← 여러 곳에서 공유하는 상수
```

#### 네이밍 규칙

- `{도메인}Data.ts` 형식 사용
- 예: `dashboardData.ts`, `settingsData.ts`

```ts
// ✅ data/dashboardData.ts
export const metrics = [
  { title: "Total Users", value: 1234, change: "+12%" },
  { title: "Revenue", value: 5678, change: "+8%" },
];

export const activityTypes = ["login", "purchase", "signup"] as const;
```

JSX를 포함하는 데이터는 `.tsx` 확장자를 사용합니다. 순수 데이터(문자열, 숫자, 객체)만 있으면 `.ts`를 사용합니다.

## 3. 컴포넌트 분리 기준

### 3-1. 언제 분리할까

| 기준 | 분리 | 유지 |
|---|---|---|
| JSX 블록이 30줄 이상 | ✅ 별도 컴포넌트로 추출 |  |
| 시각적으로 독립된 영역 (카드, 패널, 사이드바) | ✅ 추출 |  |
| 반복되는 패턴 (`map()`으로 렌더링하는 리스트 아이템) | ✅ 추출 |  |
| 단순한 텍스트 1~2줄, 아이콘 |  | ✅ 인라인 유지 |
| 조건부 렌더링 블록이 20줄 이상 | ✅ 추출 |  |
| 모달, 드로어, 토스트 | ✅ 반드시 별도 파일 |  |

### 3-2. 어떻게 분리할까 — 4단계 프로세스

#### Step 1: 화면을 시각적 블록으로 나눈다

페이지 UI를 눈으로 보고, 시각적으로 구분되는 영역에 이름을 붙입니다.

```text
┌─────────────────────────────────────────────┐
│ PageHeader (제목 + 검색바)                  │
├──────────────────────┬──────────────────────┤
│                      │                      │
│ MainContent          │ SidePanel            │
│ (차트, 맵, 테이블)   │ (요약, 상세정보)     │
│                      │                      │
├──────────────────────┴──────────────────────┤
│ BottomActions (버튼 그룹)                   │
└─────────────────────────────────────────────┘
```

위 예시에서 분리할 컴포넌트:

- `PageHeader`
- `MainContent`
- `SidePanel`
- `BottomActions`

#### Step 2: 각 블록을 독립된 파일로 추출한다

```text
components/dashboard/
├── PageHeader.tsx     # 제목 + 검색바
├── MetricsChart.tsx   # 차트 영역
├── SidePanel.tsx      # 우측 요약 패널
└── ActionBar.tsx      # 하단 버튼 그룹
```

#### Step 3: Props 인터페이스를 정의한다

```tsx
// components/dashboard/MetricsChart.tsx
interface MetricsChartProps {
  data: MetricItem[];
  selectedPeriod: string;
  onPeriodChange: (p: string) => void;
}

export function MetricsChart({ data, selectedPeriod, onPeriodChange }: MetricsChartProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100">
      {/* 차트 렌더링 */}
    </div>
  );
}
```

#### Step 4: 페이지에서 조립한다

```tsx
// pages/Dashboard.tsx
import { useState } from "react";
import { MetricsChart } from "../components/dashboard/MetricsChart";
import { SidePanel } from "../components/dashboard/SidePanel";
import { metricsData } from "../data/dashboardData";

export function Dashboard() {
  const [period, setPeriod] = useState("monthly");

  return (
    <div className="grid grid-cols-3 gap-8">
      <MetricsChart
        data={metricsData}
        selectedPeriod={period}
        onPeriodChange={setPeriod}
      />
      <SidePanel period={period} />
    </div>
  );
}
```

## 4. 로직이 무거울 때는 `hooks/`로 분리

페이지 컴포넌트에 상태와 로직이 많아지면 커스텀 훅으로 추출합니다.

### 분리 기준

- `useState`가 3개 이상 한 파일에 몰릴 때
- `useEffect` 안에 API 호출, 조건 분기 로직이 20줄 이상일 때
- 동일한 상태 조합이 2개 이상의 컴포넌트에서 반복될 때

```ts
// ✅ hooks/useDashboard.ts — 로직만, JSX 없음
import { useMemo, useState } from "react";
import { metricsData } from "../data/dashboardData";

export function useDashboard() {
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("monthly");

  const filteredData = useMemo(
    () => metricsData.filter((m) => filter === "all" || m.type === filter),
    [filter]
  );

  return { filter, setFilter, period, setPeriod, filteredData };
}
```

```tsx
// ✅ pages/Dashboard.tsx — 조립만 담당
import { MetricsChart } from "../components/dashboard/MetricsChart";
import { SidePanel } from "../components/dashboard/SidePanel";
import { useDashboard } from "../hooks/useDashboard";

export function Dashboard() {
  const { filter, setFilter, period, setPeriod, filteredData } = useDashboard();

  return (
    <div className="grid grid-cols-3 gap-8">
      <MetricsChart
        data={filteredData}
        selectedPeriod={period}
        onPeriodChange={setPeriod}
      />
      <SidePanel period={period} />
    </div>
  );
}
```

## 5. 실전 리팩터링 예시

### Before

```text
pages/SomePage.tsx (451줄)
├── Mock 데이터 배열 선언 — 약 150줄
├── 섹션 A JSX — 약 80줄
├── 섹션 B JSX — 약 120줄
├── 섹션 C JSX — 약 80줄
└── 상세 모달 JSX — 약 50줄
```

### After

```text
pages/SomePage.tsx (95줄) ← 상태관리 + 조립만
components/some-page/
├── SectionA.tsx (80줄)
├── SectionB.tsx (120줄)
├── SectionC.tsx (100줄)
└── DetailModal.tsx (95줄)

data/somePageData.ts (100줄) ← 하드코딩 데이터 분리
```

| 항목 | Before | After |
|---|---:|---:|
| 페이지 파일 줄 수 | 451줄 | 95줄 |
| 특정 섹션 수정 시 | 파일 전체 탐색 | 해당 컴포넌트 파일로 직행 |
| 팀원 간 충돌 가능성 | 높음 (같은 파일 수정) | 낮음 (파일 분리) |
| 재사용 가능성 | 불가 (로직 엉킴) | 컴포넌트 단위 재사용 가능 |

## 6. 새 프로젝트 적용 체크리스트

### Phase 1: 뼈대 잡기

- `src/` 하위 폴더 생성: `pages/`, `components/`, `layout/`, `data/`, `hooks/`, `utils/`, `types/`, `styles/`, `assets/`
- `main.tsx`, `App.tsx`, `Root.tsx`, `routes.ts` 배치
- `layout/`에 `Navbar.tsx`, `Sidebar.tsx`, `Footer.tsx` 생성

### Phase 2: 페이지별 도메인 폴더 생성

- 서비스의 핵심 페이지 목록 나열 (`Home`, `Dashboard`, `Settings` 등)
- 각 페이지마다 `components/{도메인}/` 폴더를 1:1로 생성
- `components/ui/` 폴더는 비워둔 채 생성 (향후 공용 컴포넌트용)

### Phase 3: 페이지 리팩터링

- 줄 수가 가장 많은 페이지부터 우선순위 정렬
- 각 페이지를 시각적 블록으로 분리 → 컴포넌트 추출
- Mock 데이터를 `data/`로 이동
- 상태/로직이 무거우면 `hooks/`로 추출
- 페이지 파일이 100줄 이하인지 확인

### Phase 4: 정리

- `components/ui/`에 진짜 2개 이상 페이지에서 쓰이는 컴포넌트만 있는지 확인
- 도메인 폴더 간 교차 import가 없는지 확인
- 미사용 파일 정리

## 7. 네이밍 컨벤션

| 종류 | 네이밍 패턴 | 예시 |
|---|---|---|
| 페이지 | `PascalCase` 명사 | `Dashboard.tsx`, `Settings.tsx` |
| 도메인 컴포넌트 | 역할을 설명하는 `PascalCase` | `MetricsGrid.tsx`, `ActivityFeed.tsx` |
| 커스텀 훅 | `use{기능}.ts` | `useDashboard.ts`, `useFileParser.ts` |
| 데이터 파일 | `{도메인}Data.ts(x)` | `dashboardData.ts`, `settingsData.ts` |
| 모달 / 드로어 | `{내용}Modal.tsx` / `{내용}Drawer.tsx` | `UserDetailModal.tsx`, `FilterDrawer.tsx` |
| 타입 파일 | `{도메인}.types.ts` | `dashboard.types.ts`, `api.types.ts` |

## 8. 자주 하는 실수와 해결법

| 실수 | 문제점 | 해결 |
|---|---|---|
| `pages/` 파일에 200줄+ JSX 작성 | 가독성 저하, 충돌 증가 | 시각적 블록으로 쪼개서 `components/{도메인}/`에 추출 |
| `ui/`에 모든 것을 넣음 | `ui/`가 쓰레기통화 | 1개 페이지 전용이면 도메인 폴더로 이동 |
| `components/`에 도메인 폴더 없이 파일 나열 | 어떤 페이지용인지 추적 어려움 | 반드시 도메인 폴더로 그룹핑 |
| Mock 데이터를 컴포넌트 안에 선언 | 파일 비대화, 재사용 어려움 | `data/` 폴더로 분리 |
| 도메인 폴더 간 교차 import | 의존성 꼬임, 순환 참조 위험 | `ui/`로 승격 또는 구조 재설계 |
| 상태 3개 이상을 `pages/`에 직접 선언 | 페이지 파일이 로직 파일화 | `hooks/use{도메인}.ts`로 추출 |
| 모달을 부모 컴포넌트 JSX 안에 인라인 작성 | 중첩 깊이 증가, 독립 수정 불가 | 반드시 별도 `{내용}Modal.tsx` 파일로 분리 |

## 부록: 핵심 운영 원칙 한눈에 보기

- 페이지는 조립만 한다.
- 구현은 도메인 컴포넌트로 내린다.
- 로직은 필요하면 훅으로 뺀다.
- 데이터는 `data/`로 분리한다.
- 공용화는 실제 2회 이상 재사용될 때만 한다.
