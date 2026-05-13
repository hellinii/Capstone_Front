import { Navigate } from "react-router";
import { BasicInfo } from "./BasicInfo";
import { TestItems } from "./TestItems";
import { TCDetail } from "./TCDetail";
import { DataUpload } from "./DataUpload";
import { ColumnMapping } from "./ColumnMapping";
import { DataValidation } from "./DataValidation";

/**
 * Home page — redirects to the first workflow step.
 */
export function Home() {
  return <Navigate to="/step/basic-info" replace />;
}

export { BasicInfo, TestItems, TCDetail, DataUpload, ColumnMapping, DataValidation };
