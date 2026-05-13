import {
  Home,
  BasicInfo,
  TestItems,
  TCDetail,
  DataUpload,
  ColumnMapping,
  DataValidation,
} from "./pages/Home";
import { Report } from "./pages/report/Report";
import { ReportPrint } from "./pages/report/ReportPrint";

export const routes = [
  { path: "/", Component: Home },
  { path: "/step/basic-info", Component: BasicInfo },
  { path: "/step/test-items", Component: TestItems },
  { path: "/step/tc-detail", Component: TCDetail },
  { path: "/step/data-upload", Component: DataUpload },
  { path: "/step/column-mapping", Component: ColumnMapping },
  { path: "/step/data-validation", Component: DataValidation },
  { path: "/report/:id", Component: Report },
  { path: "/report/:id/print", Component: ReportPrint },
] as const;
