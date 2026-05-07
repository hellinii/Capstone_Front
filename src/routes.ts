import {
  Home,
  BasicInfo,
  TestItems,
  TCDetail,
  DataUpload,
  ColumnMapping,
  DataValidation,
  EvaluationReport,
} from "./pages/Home";

export const routes = [
  { path: "/", Component: Home },
  { path: "/step/basic-info", Component: BasicInfo },
  { path: "/step/test-items", Component: TestItems },
  { path: "/step/tc-detail", Component: TCDetail },
  { path: "/step/data-upload", Component: DataUpload },
  { path: "/step/column-mapping", Component: ColumnMapping },
  { path: "/step/data-validation", Component: DataValidation },
  { path: "/step/report", Component: EvaluationReport },
] as const;
